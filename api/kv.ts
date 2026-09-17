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

function sendJson(res: any, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.end(JSON.stringify(data));
}

function getHeader(req: any, name: string): string | undefined {
  const headers = req?.headers;
  if (!headers) return undefined;
  if (typeof headers.get === 'function') {
    const value = headers.get(name);
    return value == null ? undefined : String(value);
  }
  const direct = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(direct)) return direct[0] ? String(direct[0]) : undefined;
  return direct == null ? undefined : String(direct);
}

function isAllowedKey(key: unknown): key is string {
  return typeof key === 'string' && ALLOWED_KEYS.has(key);
}

function getRequestUrl(req: any): URL {
  const protocol = getHeader(req, 'x-forwarded-proto') || 'https';
  const host = getHeader(req, 'x-forwarded-host') || getHeader(req, 'host');
  if (!host) throw new Error('Unable to determine request host');
  const requestPath = typeof req.url === 'string' && req.url.length > 0 ? req.url : '/';
  return new URL(requestPath, `${protocol}://${host}`);
}

function isSameOrigin(req: any): boolean {
  const origin = getHeader(req, 'origin');
  if (!origin) return true;
  try { return new URL(origin).origin === getRequestUrl(req).origin; } catch { return false; }
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
    if (product.variants?.length) result[product.id] = Object.fromEntries(product.variants.map(variant => [variant.weight, variant.price]));
  });
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validateValue(key: string, value: unknown): { ok: true } | { ok: false; error: string } {
  if (key === 'kefas_all_products' || key === 'kefas_custom_products') {
    if (!Array.isArray(value)) return { ok: false, error: `${key} must be an array` };
    if (key === 'kefas_all_products' && value.length === 0) return { ok: false, error: 'Refusing to persist an empty product catalog' };
    if (!value.every(product => isPlainObject(product) && typeof product.id === 'string' && product.id.length > 0 && typeof product.name === 'string')) {
      return { ok: false, error: `${key} contains an invalid product record` };
    }
    return { ok: true };
  }

  if (key === 'kefas_stock_status' || key === 'kefas_product_prices') {
    if (!isPlainObject(value)) return { ok: false, error: `${key} must be an object` };
    if (key === 'kefas_stock_status' && !Object.values(value).every(item => typeof item === 'boolean')) {
      return { ok: false, error: 'Stock status values must be booleans' };
    }
    if (key === 'kefas_product_prices' && !Object.values(value).every(isFiniteNonNegativeNumber)) {
      return { ok: false, error: 'Product price values must be finite non-negative numbers' };
    }
    return { ok: true };
  }

  if (key === 'kefas_variant_prices') {
    if (!isPlainObject(value)) return { ok: false, error: 'Variant prices must be an object' };
    for (const productValue of Object.values(value)) {
      if (!isPlainObject(productValue) || !Object.values(productValue).every(isFiniteNonNegativeNumber)) {
        return { ok: false, error: 'Variant price values must be finite non-negative numbers' };
      }
    }
    return { ok: true };
  }

  if (key === 'kefas_coming_soon_enabled') {
    return typeof value === 'boolean' ? { ok: true } : { ok: false, error: 'Coming Soon enabled value must be boolean' };
  }

  if (key === 'kefas_coming_soon_products') {
    return Array.isArray(value) && value.every(item => typeof item === 'string')
      ? { ok: true }
      : { ok: false, error: 'Coming Soon products must be an array of product IDs' };
  }

  return { ok: false, error: 'Unsupported key' };
}

async function readBody(req: any): Promise<any> {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return req.body;
    if (typeof req.body === 'string') return JSON.parse(req.body);
  }
  let body = '';
  for await (const chunk of req) {
    body += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw Object.assign(new Error('Request body too large'), { statusCode: 413 });
  }
  return body ? JSON.parse(body) : {};
}

export default async function handler(req: any, res: any) {
  if (!process.env.DATABASE_URL) return sendJson(res, { error: 'DATABASE_URL is not configured' }, 500);
  if (req.method !== 'GET' && req.method !== 'POST') return sendJson(res, { error: 'Method not allowed' }, 405);
  if (req.method === 'POST' && !isSameOrigin(req)) return sendJson(res, { error: 'Forbidden' }, 403);

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      const key = getRequestUrl(req).searchParams.get('key');
      if (!isAllowedKey(key)) return sendJson(res, { error: 'Invalid key' }, 400);

      const rows = await sql`
        SELECT value, updated_at
        FROM kv_store_da50176a
        WHERE key = ${key}
        LIMIT 1
      `;

      // A missing catalog is an infrastructure/data-integrity condition, not a
      // reason to silently recreate it from static data. The client will keep
      // its last-known-good snapshot and retry later.
      if (rows.length === 0 && key === 'kefas_all_products') {
        return sendJson(res, { error: 'Product catalog is unavailable' }, 503);
      }

      if (rows.length === 0 && key === 'kefas_stock_status') {
        const value = initialStock();
        await sql`INSERT INTO kv_store_da50176a (key, value, updated_at) VALUES ('kefas_stock_status', ${JSON.stringify(value)}::jsonb, now()) ON CONFLICT (key) DO NOTHING`;
        return sendJson(res, { value });
      }
      if (rows.length === 0 && key === 'kefas_product_prices') {
        const value = initialPrices();
        await sql`INSERT INTO kv_store_da50176a (key, value, updated_at) VALUES ('kefas_product_prices', ${JSON.stringify(value)}::jsonb, now()) ON CONFLICT (key) DO NOTHING`;
        return sendJson(res, { value });
      }
      if (rows.length === 0 && key === 'kefas_variant_prices') {
        const value = initialVariantPrices();
        await sql`INSERT INTO kv_store_da50176a (key, value, updated_at) VALUES ('kefas_variant_prices', ${JSON.stringify(value)}::jsonb, now()) ON CONFLICT (key) DO NOTHING`;
        return sendJson(res, { value });
      }

      return sendJson(res, { value: rows[0]?.value ?? null, updatedAt: rows[0]?.updated_at ?? null });
    }

    const contentLength = Number(getHeader(req, 'content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return sendJson(res, { error: 'Request body too large' }, 413);

    let payload: { key?: unknown; value?: unknown };
    try { payload = await readBody(req); }
    catch (error: any) {
      if (error?.statusCode === 413) return sendJson(res, { error: 'Request body too large' }, 413);
      return sendJson(res, { error: 'Invalid JSON' }, 400);
    }

    if (!isAllowedKey(payload?.key)) return sendJson(res, { error: 'Invalid key' }, 400);
    const validation = validateValue(payload.key, payload.value);
    if (!validation.ok) return sendJson(res, { error: validation.error }, 422);

    const serializedValue = JSON.stringify(payload.value);
    if (Buffer.byteLength(serializedValue, 'utf8') > MAX_BODY_BYTES) return sendJson(res, { error: 'Request body too large' }, 413);

    await sql`
      INSERT INTO kv_store_da50176a (key, value, updated_at)
      VALUES (${payload.key}, ${serializedValue}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;

    // Verify the exact semantic JSONB value. Retry briefly for a transient
    // serverless read/write timing issue before reporting a hard failure.
    let persisted: any[] = [];
    for (let attempt = 0; attempt < 3; attempt += 1) {
      persisted = await sql`
        SELECT value, updated_at
        FROM kv_store_da50176a
        WHERE key = ${payload.key}
          AND value = ${serializedValue}::jsonb
        LIMIT 1
      `;
      if (persisted.length > 0) break;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 150 * (attempt + 1)));
    }

    if (persisted.length === 0) {
      console.error('Neon KV verification mismatch:', payload.key);
      return sendJson(res, { error: 'Neon write verification failed' }, 500);
    }

    // Do not redeploy Vercel for every data write. Inventory is served from
    // Neon through an explicitly uncached API; deployment hooks here created
    // unnecessary deployment churn and could race with each other.
    return sendJson(res, {
      ok: true,
      value: persisted[0].value,
      updatedAt: persisted[0].updated_at ?? null,
    });
  } catch (error: any) {
    console.error('Neon KV API error:', error);
    return sendJson(res, { error: 'Database operation failed' }, error?.statusCode || 500);
  }
}
