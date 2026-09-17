import { neon } from '@neondatabase/serverless'
import { del, put } from '@vercel/blob'
import sharp from 'sharp'

const TOKEN_ENV = 'KEFAS_READ_WRITE_TOKEN'
const MAX_IMAGES_PER_RUN = 50
const MIN_SAVINGS_RATIO = 0.05
const MAX_DIMENSION = 1600
const WEBP_QUALITY = 82

type Product = {
  id: string
  imageUrl?: string
  [key: string]: unknown
}

function sendJson(res: any, data: unknown, status = 200) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(data))
}

function getHeader(req: any, name: string): string | undefined {
  const headers = req?.headers
  if (!headers) return undefined
  if (typeof headers.get === 'function') {
    const value = headers.get(name)
    return value == null ? undefined : String(value)
  }
  const direct = headers[name] ?? headers[name.toLowerCase()]
  return Array.isArray(direct) ? String(direct[0] || '') : direct == null ? undefined : String(direct)
}

function getRequestUrl(req: any): URL {
  const protocol = getHeader(req, 'x-forwarded-proto') || 'https'
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host')
  if (!host) throw new Error('Unable to determine request host')
  const requestPath = typeof req.url === 'string' && req.url ? req.url : '/'
  return new URL(requestPath, `${protocol}://${host}`)
}

function isSameOrigin(req: any): boolean {
  const origin = getHeader(req, 'origin')
  if (!origin) return true
  try {
    return new URL(origin).origin === getRequestUrl(req).origin
  } catch {
    return false
  }
}

function isBlobUrl(value: unknown): value is string {
  return typeof value === 'string' && value.includes('.blob.vercel-storage.com/')
}

function blobPathname(url: string): string {
  const pathname = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '')
  if (!pathname || pathname.includes('..')) throw new Error('Invalid Blob pathname')
  return pathname
}

async function optimizeBuffer(input: Buffer) {
  const optimized = await sharp(input, { failOn: 'none' })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toBuffer()

  return optimized
}

async function readCatalog(sql: any, key: string): Promise<Product[]> {
  const rows = await sql`SELECT value FROM kv_store_da50176a WHERE key = ${key} LIMIT 1`
  const value = rows[0]?.value
  return Array.isArray(value) ? value : []
}

async function saveCatalog(sql: any, key: string, products: Product[]) {
  const serialized = JSON.stringify(products)
  await sql`
    INSERT INTO kv_store_da50176a (key, value, updated_at)
    VALUES (${key}, ${serialized}::jsonb, now())
    ON CONFLICT (key)
    DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return sendJson(res, { error: 'Method not allowed' }, 405)
  if (!isSameOrigin(req)) return sendJson(res, { error: 'Forbidden' }, 403)

  const token = process.env[TOKEN_ENV]
  const databaseUrl = process.env.DATABASE_URL
  if (!token) return sendJson(res, { error: `${TOKEN_ENV} is not configured` }, 500)
  if (!databaseUrl) return sendJson(res, { error: 'DATABASE_URL is not configured' }, 500)

  try {
    const sql = neon(databaseUrl)
    const catalogs = [
      { key: 'kefas_all_products', products: await readCatalog(sql, 'kefas_all_products') },
      { key: 'kefas_custom_products', products: await readCatalog(sql, 'kefas_custom_products') },
    ]

    const seen = new Set<string>()
    const changes: Array<{ key: string; productId: string; oldUrl: string; newUrl: string; before: number; after: number; saved: number }> = []
    const failures: Array<{ productId: string; url: string; error: string }> = []
    let scanned = 0
    let skipped = 0
    let totalBefore = 0
    let totalAfter = 0

    outer: for (const catalog of catalogs) {
      for (const product of catalog.products) {
        if (!isBlobUrl(product.imageUrl) || seen.has(product.imageUrl)) {
          skipped++
          continue
        }
        seen.add(product.imageUrl)
        if (scanned >= MAX_IMAGES_PER_RUN) break outer

        scanned++
        try {
          const response = await fetch(product.imageUrl, { cache: 'no-store' })
          if (!response.ok) throw new Error(`Blob download failed (${response.status})`)
          const source = Buffer.from(await response.arrayBuffer())
          const optimized = await optimizeBuffer(source)
          const savings = 1 - optimized.length / Math.max(source.length, 1)
          totalBefore += source.length

          if (optimized.length >= source.length || savings < MIN_SAVINGS_RATIO) {
            totalAfter += source.length
            skipped++
            continue
          }

          const pathname = blobPathname(product.imageUrl)
          const blob = await put(pathname, optimized, {
            access: 'public',
            addRandomSuffix: false,
            allowOverwrite: true,
            contentType: 'image/webp',
            token,
          })

          const newUrl = blob.url
          product.imageUrl = newUrl
          totalAfter += optimized.length
          changes.push({
            key: catalog.key,
            productId: product.id,
            oldUrl: product.imageUrl as string,
            newUrl,
            before: source.length,
            after: optimized.length,
            saved: source.length - optimized.length,
          })
        } catch (error: any) {
          failures.push({ productId: product.id, url: product.imageUrl, error: error?.message || 'Optimization failed' })
        }
      }
    }

    // Persist only catalogs that actually changed. URLs are normally unchanged
    // because the existing Blob pathname is overwritten in place.
    for (const catalog of catalogs) {
      if (changes.some(change => change.key === catalog.key)) {
        await saveCatalog(sql, catalog.key, catalog.products)
      }
    }

    const savedBytes = Math.max(0, totalBefore - totalAfter)
    return sendJson(res, {
      ok: failures.length === 0,
      scanned,
      optimized: changes.length,
      skipped,
      failed: failures.length,
      beforeBytes: totalBefore,
      afterBytes: totalAfter,
      savedBytes,
      savedPercent: totalBefore ? Math.round((savedBytes / totalBefore) * 100) : 0,
      changes,
      failures,
      limit: MAX_IMAGES_PER_RUN,
    })
  } catch (error: any) {
    console.error('Image optimization failed:', error)
    return sendJson(res, { error: error?.message || 'Image optimization failed' }, 500)
  }
}
