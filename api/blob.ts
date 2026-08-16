import { del, put } from '@vercel/blob'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_BODY_BYTES = 5 * 1024 * 1024
const TOKEN_ENV = 'KEFAS_READ_WRITE_TOKEN'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

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
  if (Array.isArray(direct)) return direct[0] ? String(direct[0]) : undefined
  return direct == null ? undefined : String(direct)
}

function getRequestUrl(req: any): URL {
  const protocol = getHeader(req, 'x-forwarded-proto') || 'https'
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host')
  if (!host) throw new Error('Unable to determine request host')

  const requestPath = typeof req.url === 'string' && req.url.length > 0 ? req.url : '/'
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

async function readRawBody(req: any): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body
  if (typeof req.body === 'string') return Buffer.from(req.body)

  const chunks: Buffer[] = []
  let total = 0

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Request body too large'), { statusCode: 413 })
    }
    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

function parseMultipart(body: Buffer, contentType: string): { file: Buffer; filename: string; mimeType: string; productId: string } {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)
  const boundary = match?.[1] || match?.[2]
  if (!boundary) throw Object.assign(new Error('Multipart boundary is missing'), { statusCode: 400 })

  const delimiter = Buffer.from(`--${boundary}`)
  const fields: Record<string, string> = {}
  let file: Buffer | null = null
  let filename = 'product-image'
  let mimeType = ''

  let cursor = body.indexOf(delimiter)
  while (cursor !== -1) {
    const partStart = cursor + delimiter.length
    if (body.slice(partStart, partStart + 2).toString() === '--') break

    const contentStart = partStart + 2
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), contentStart)
    if (headerEnd === -1) break

    const headers = body.slice(contentStart, headerEnd).toString('utf8')
    const dataStart = headerEnd + 4
    const nextBoundary = body.indexOf(delimiter, dataStart)
    if (nextBoundary === -1) break

    let dataEnd = nextBoundary
    if (body[dataEnd - 2] === 13 && body[dataEnd - 1] === 10) dataEnd -= 2
    const data = body.slice(dataStart, dataEnd)

    const disposition = headers.match(/content-disposition:\s*form-data;\s*([^\r\n]+)/i)?.[1] || ''
    const name = disposition.match(/name="([^"]+)"/i)?.[1]
    const fileNameMatch = disposition.match(/filename="([^"]*)"/i)
    const typeMatch = headers.match(/content-type:\s*([^\r\n]+)/i)

    if (fileNameMatch && name === 'file') {
      file = data
      filename = fileNameMatch[1] || filename
      mimeType = (typeMatch?.[1] || '').trim().toLowerCase()
    } else if (name) {
      fields[name] = data.toString('utf8')
    }

    cursor = nextBoundary
  }

  if (!file) throw Object.assign(new Error('Image file is required'), { statusCode: 400 })

  return {
    file,
    filename,
    mimeType,
    productId: fields.productId || 'product',
  }
}

async function readJsonBody(req: any): Promise<any> {
  const raw = await readRawBody(req)
  if (!raw.length) return {}
  return JSON.parse(raw.toString('utf8'))
}

export default async function handler(req: any, res: any) {
  const token = process.env[TOKEN_ENV]

  if (!token) {
    return sendJson(res, { error: `${TOKEN_ENV} is not configured` }, 500)
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return sendJson(res, { error: 'Method not allowed' }, 405)
  }

  if (!isSameOrigin(req)) {
    return sendJson(res, { error: 'Forbidden' }, 403)
  }

  try {
    if (req.method === 'POST') {
      const requestUrl = getRequestUrl(req)

      // Lightweight server-side Blob health check. This deliberately avoids
      // multipart parsing so the diagnostic tests the storage provider itself,
      // not the product-image upload parser.
      if (requestUrl.searchParams.get('diagnostic') === '1') {
        const probePath = `diagnostics/kefas-blob-${Date.now()}.txt`
        const probe = await put(probePath, 'Kefas Food Vercel Blob health check', {
          access: 'public',
          addRandomSuffix: true,
          contentType: 'text/plain; charset=utf-8',
          token,
        })

        try {
          await del(probe.url, { token })
        } catch (cleanupError) {
          console.warn('Blob diagnostic cleanup failed:', cleanupError)
        }

        return sendJson(res, { ok: true, provider: 'vercel-blob' })
      }

      const contentLength = Number(getHeader(req, 'content-length') || 0)
      if (contentLength > MAX_BODY_BYTES) {
        return sendJson(res, { error: 'Request body too large. Maximum image size is 4MB.' }, 413)
      }

      const contentType = getHeader(req, 'content-type') || ''
      if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
        return sendJson(res, { error: 'Expected multipart/form-data upload' }, 415)
      }

      const body = await readRawBody(req)
      const parsed = parseMultipart(body, contentType)

      if (!ALLOWED_TYPES.has(parsed.mimeType)) {
        return sendJson(res, { error: 'Unsupported image type. Use JPG, PNG, WebP, GIF or AVIF.' }, 415)
      }

      if (parsed.file.length > MAX_FILE_SIZE) {
        return sendJson(res, { error: 'Maximum image size is 4MB' }, 413)
      }

      const safeProductId = parsed.productId.replace(/[^a-zA-Z0-9_-]/g, '_')
      const extension = parsed.filename.includes('.') ? parsed.filename.split('.').pop() : 'bin'
      const pathname = `products/${safeProductId}_${Date.now()}.${extension}`

      const blob = await put(pathname, parsed.file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: parsed.mimeType,
        token,
      })

      return sendJson(res, { url: blob.url, pathname: blob.pathname }, 201)
    }

    const body = await readJsonBody(req)
    const url = typeof body?.url === 'string' ? body.url : ''

    if (!url || !url.includes('.blob.vercel-storage.com/')) {
      return sendJson(res, { error: 'Invalid Blob URL' }, 400)
    }

    await del(url, { token })
    return sendJson(res, { ok: true })
  } catch (error: any) {
    console.error('Vercel Blob error:', error)
    return sendJson(res, { error: error?.message || 'Storage operation failed' }, error?.statusCode || 500)
  }
}
