import { del, put } from '@vercel/blob';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export default async function handler(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return json({ error: 'BLOB_READ_WRITE_TOKEN is not configured' }, 500);
  }

  try {
    if (req.method === 'POST') {
      const form = await req.formData();
      const file = form.get('file');
      const productId = String(form.get('productId') || 'product');

      if (!(file instanceof File)) return json({ error: 'Image file is required' }, 400);
      if (!ALLOWED_TYPES.has(file.type)) return json({ error: 'Unsupported image type' }, 415);
      if (file.size > MAX_FILE_SIZE) return json({ error: 'Maximum image size is 10MB' }, 413);

      const safeProductId = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
      const pathname = `products/${safeProductId}_${Date.now()}.${extension}`;

      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: file.type,
      });

      return json({ url: blob.url, pathname: blob.pathname }, 201);
    }

    if (req.method === 'DELETE') {
      const body = await req.json().catch(() => ({}));
      const url = typeof body?.url === 'string' ? body.url : '';

      if (!url || !url.includes('.blob.vercel-storage.com/')) {
        return json({ error: 'Invalid Blob URL' }, 400);
      }

      await del(url);
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error('Vercel Blob error:', error);
    return json({ error: 'Storage operation failed' }, 500);
  }
}
