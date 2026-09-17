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
  res.setHeader('cache-control', 'no-store');
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

async function triggerProductionDeployment(): Promise<boolean> {
  const hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    console.warn('VERCEL_DEPLOY_HOOK_URL is not configured; Neon save completed without a deployment trigger.');
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(hookUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'kefas-admin-neon-save' }),
      });
      if (!response.ok) {
        console.error('Vercel production deploy hook failed:', response.status);
        return false;
      }
      return true;
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    console.error('Vercel production deploy hook request failed:', error);
    return false;
  }
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

      if (rows.length === 0 && key === 'kefas_all_products') {
        const value = staticProducts;
        await sql`INSERT INTO kv_store_da50176a (key, value, updated_at) VALUES ('kefas_all_products', ${JSON.stringify(value)}::jsonb, now()) ON CONFLICT (key) DO NOTHING`;
        return sendJson(res, { value });
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
    const serializedValue = JSON.stringify(payload.value);
    if (Buffer.byteLength(serializedValue, 'utf8') > MAX_BODY_BYTES) return sendJson(res, { error: 'Request body too large' }, 413);

    await sql`
      INSERT INTO kv_store_da50176a (key, value, updated_at)
      VALUES (${payload.key}, ${serializedValue}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;

    // Verify the exact semantic JSONB value. Neon/Postgres normally returns
    // the write immediately, but retry briefly to tolerate a transient
    // serverless connection/read timing issue instead of rejecting a valid save.
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

    // Neon is authoritative. Once the write is verified, trigger a fresh
    // production deployment so any statically cached storefront assets are
    // refreshed as well. A hook failure never rolls back the verified Neon save.
    const deploymentTriggered = await triggerProductionDeployment();

    return sendJson(res, {
      ok: true,
      value: persisted[0].value,
      updatedAt: persisted[0].updated_at ?? null,
      deploymentTriggered,
    });
  } catch (error: any) {
    console.error('Neon KV API error:', error);
    return sendJson(res, { error: 'Database operation failed' }, error?.statusCode || 500);
  }
}
