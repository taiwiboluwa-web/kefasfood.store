import { del, put } from '@vercel/blob'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const MAX_BODY_BYTES = 4 * 1024 * 1024
const TOKEN_ENV = 'KEFAS_READ_WRITE_TOKEN'

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false

  try {
    return new URL(origin).origin === new URL(req.url).origin
  } catch {
    return false
  }
}

export default async function handler(req: Request) {
  const token = process.env[TOKEN_ENV]

  if (!token) {
    return json({ error: `${TOKEN_ENV} is not configured` }, 500)
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return json({ error: 'Method not allowed' }, 405)
  }

  if (!isSameOrigin(req)) {
    return json({ error: 'Forbidden' }, 403)
  }

  try {
    if (req.method === 'POST') {
      const contentLength = Number(req.headers.get('content-length') || 0)
      if (contentLength > MAX_BODY_BYTES) {
        return json({ error: 'Request body too large. Maximum image size is 4MB.' }, 413)
      }

      const form = await req.formData()
      const file = form.get('file')
      const productId = String(form.get('productId') || 'product')

      if (!(file instanceof File)) return json({ error: 'Image file is required' }, 400)
      if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Unsupported image type' }, 415)
      if (file.size > MAX_FILE_SIZE) return json({ error: 'Maximum image size is 4MB' }, 413)

      const safeProductId = productId.replace(/[^a-zA-Z0-9_-]/g, '_')
      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
      const pathname = `products/${safeProductId}_${Date.now()}.${extension}`

      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
        token,
      })

      return json({ url: blob.url, pathname: blob.pathname }, 201)
    }

    const body = await req.json().catch(() => ({}))
    const url = typeof body?.url === 'string' ? body.url : ''

    if (!url || !url.includes('.blob.vercel-storage.com/')) {
      return json({ error: 'Invalid Blob URL' }, 400)
    }

    await del(url, { token })
    return json({ ok: true })
  } catch (error) {
    console.error('Vercel Blob error:', error)
    return json({ error: 'Storage operation failed' }, 500)
  }
}
