import { neon } from '@neondatabase/serverless';

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

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return sendJson(res, { error: 'Method not allowed' }, 405);
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = getHeader(req, 'authorization');

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return sendJson(res, { error: 'Unauthorized' }, 401);
  }

  if (!process.env.DATABASE_URL) {
    return sendJson(res, { error: 'DATABASE_URL is not configured' }, 500);
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT 1 AS keepalive, now() AS checked_at`;

    return sendJson(res, {
      ok: true,
      service: 'neon-keepalive',
      checkedAt: result[0]?.checked_at ?? null,
    });
  } catch (error) {
    console.error('Neon keepalive failed:', error);
    return sendJson(res, { error: 'Neon keepalive query failed' }, 500);
  }
}
