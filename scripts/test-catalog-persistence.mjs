import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');

if (!source.includes("localStorage.getItem('kefas_last_known_good_products')")) {
  throw new Error('Catalog sync must read a last-known-good snapshot');
}
if (!source.includes("localStorage.setItem('kefas_last_known_good_products', JSON.stringify(catalog))")) {
  throw new Error('Valid catalogs must update the last-known-good snapshot');
}
if (!source.includes('Array.isArray(allProducts) || allProducts.length === 0')) {
  throw new Error('Empty/unavailable Neon catalogs must be rejected');
}
if (!source.includes('localStorage.getItem(KEYS.ALL_PRODUCTS)')) {
  throw new Error('Catalog fallback must inspect existing local state');
}
if (source.includes('window.setInterval(refresh, 30000)')) {
  throw new Error('30-second background catalog polling must remain removed');
}

console.log('Catalog persistence regression checks passed');
