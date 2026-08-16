import { neon } from '@neondatabase/serverless';
import { products as staticProducts } from '../src/app/data/products.js';

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

function getRequestUrl(req: Request): URL {
  try {
    return new URL(req.url);
  } catch {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (!host) throw new Error('Unable to determine request host');
    return new URL(req.url, `${proto}://${host}`);
  }
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;

  try {
    return new URL(origin).origin === getRequestUrl(req).origin;
  } catch {
    return false;
  }
}

function initialStock() {
  return Object.fromEntries(staticProducts.map(product => [product.id, product.inStock !== false]));
}

function initialPrices() {
  return Object.fromEntries(staticProducts.map(product => [product.id, product.price]));
}

function initialVariantPrices() {
  const result: Record<string, Record<string, number>> = {};
  staticProducts.forEach(product => {
    if (product.variants?.length) {
      result[product.id] = Object.fromEntries(product.variants.map(variant => [variant.weight, variant.price]));
    }
  });
  return result;
}

export default async function handler(req: Request) {
  if (!process.env.DATABASE_URL) {
    return json({ error: 'DATABASE_URL is not configured' }, 500);
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (req.method === 'POST' && !isSameOrigin(req)) {
    return json({ error: 'Forbidden' }, 403);
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const key = getRequestUrl(req).searchParams.get('key');

      if (!isAllowedKey(key)) {
        return json({ error: 'Invalid key' }, 400);
      }

      const rows = await sql`
        SELECT value
        FROM kv_store_da50176a
        WHERE key = ${key}
        LIMIT 1
      `;

      if (rows.length === 0 && key === 'kefas_all_products') {
        await sql`
          INSERT INTO kv_store_da50176a (key, value, updated_at)
          VALUES ('kefas_all_products', ${JSON.stringify(staticProducts)}::jsonb, now())
          ON CONFLICT (key) DO NOTHING
        `;
        return json({ value: staticProducts });
      }

      if (rows.length === 0 && key === 'kefas_stock_status') {
        const value = initialStock();
        await sql`
          INSERT INTO kv_store_da50176a (key, value, updated_at)
          VALUES ('kefas_stock_status', ${JSON.stringify(value)}::jsonb, now())
          ON CONFLICT (key) DO NOTHING
        `;
        return json({ value });
      }

      if (rows.length === 0 && key === 'kefas_product_prices') {
        const value = initialPrices();
        await sql`
          INSERT INTO kv_store_da50176a (key, value, updated_at)
          VALUES ('kefas_product_prices', ${JSON.stringify(value)}::jsonb, now())
          ON CONFLICT (key) DO NOTHING
        `;
        return json({ value });
      }

      if (rows.length === 0 && key === 'kefas_variant_prices') {
        const value = initialVariantPrices();
        await sql`
          INSERT INTO kv_store_da50176a (key, value, updated_at)
          VALUES ('kefas_variant_prices', ${JSON.stringify(value)}::jsonb, now())
          ON CONFLICT (key) DO NOTHING
        `;
        return json({ value });
      }

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
