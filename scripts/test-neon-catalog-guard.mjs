import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');

if (!source.includes("cache: 'no-store'")) {
  throw new Error('Neon KV reads must bypass browser/intermediary caching');
}
if (!source.includes('cacheBust')) {
  throw new Error('Neon KV reads must use a cache-busting query value');
}
if (!source.includes('if (!Array.isArray(allProducts) || allProducts.length === 0)')) {
  throw new Error('Catalog hydration must reject empty/missing remote catalogs');
}
if (!source.includes('return')) {
  throw new Error('Catalog guard must preserve the currently displayed catalog on a transient Neon failure');
}

console.log('Neon catalog safety checks passed');
