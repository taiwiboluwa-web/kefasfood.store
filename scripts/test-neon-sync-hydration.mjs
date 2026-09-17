import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');
const api = fs.readFileSync('api/kv.ts', 'utf8');

const syncStart = source.indexOf('export async function syncFromNeon');
const syncEnd = source.indexOf('\nexport async function syncToNeon', syncStart);
if (syncStart === -1 || syncEnd === -1) throw new Error('Could not locate syncFromNeon');
const sync = source.slice(syncStart, syncEnd);

if (!sync.includes('Array.isArray(allProducts) || allProducts.length === 0')) {
  throw new Error('syncFromNeon must reject empty/null product catalogs');
}
if (!sync.includes('readLastKnownGoodCatalog()')) {
  throw new Error('syncFromNeon must fall back to the last-known-good catalog');
}
if (!source.includes("cache: 'no-store'")) {
  throw new Error('Neon reads must bypass browser/Vercel fetch caching');
}
if (!source.includes("'Cache-Control': 'no-store'")) {
  throw new Error('Neon requests must send strict no-store headers');
}
if (!sync.includes('Promise.allSettled(writes)')) {
  throw new Error('Optional Neon bootstrap writes must not block admin inventory hydration');
}
if (source.includes('window.setInterval(refresh, 30000)')) {
  throw new Error('Storefront must not poll Neon every 30 seconds and mutate the visible catalog');
}
if (!source.includes("window.addEventListener('focus', refresh)")) {
  throw new Error('Storefront should retain an explicit focus refresh path');
}

if (!api.includes("res.setHeader('Cache-Control', 'no-store')")) {
  throw new Error('/api/kv must return Cache-Control: no-store');
}
if (!api.includes('value = ${serializedValue}::jsonb')) {
  throw new Error('/api/kv must verify the persisted JSONB value semantically');
}

console.log('Neon sync, catalog persistence, and cache-busting checks passed');
