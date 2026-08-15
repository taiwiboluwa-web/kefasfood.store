import { neon } from '@neondatabase/serverless';

const ALLOWED_KEYS = new Set([
  'kefas_stock_status',
  'kefas_product_prices',
  'kefas_variant_prices',
  'kefas_all_products',
  'kefas_coming_soon_enabled',
  'kefas_coming_soon_products',
  'kefas_custom_products',
]);

const MAX_BODY_BYTES = 512_000;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function isAllowedKey(key: unknown): key is string {
  return typeof key === 'string' && ALLOWED_KEYS.has(key);
}

export default async function handler(req: Request) {
  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL is not configured' }, 500);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // This endpoint is intentionally limited to the application's known KV keys.
  // It never accepts arbitrary SQL or table names from the browser.
  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const key = new URL(req.url).searchParams.get('key');

      if (!isAllowedKey(key)) {
        return json({ error: 'Invalid key' }, 400);
      }

      const rows = await sql`
        SELECT value
        FROM kv_store_da50176a
        WHERE key = ${key}
        LIMIT 1
      `;

      return json({ value: rows[0]?.value ?? null });
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ error: 'Request body too large' }, 413);
    }

    const body = await req.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return json({ error: 'Request body too large' }, 413);
    }

    let payload: { key?: unknown; value?: unknown };
    try {
      payload = JSON.parse(body);
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    if (!isAllowedKey(payload.key)) {
      return json({ error: 'Invalid key' }, 400);
    }

    await sql`
      INSERT INTO kv_store_da50176a (key, value, updated_at)
      VALUES (${payload.key}, ${JSON.stringify(payload.value)}::jsonb, now())
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = now()
    `;

    return json({ ok: true });
  } catch (error) {
    console.error('Neon KV API error:', error);
    return json({ error: 'Database operation failed' }, 500);
  }
}
