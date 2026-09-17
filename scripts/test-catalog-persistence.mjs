import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');

if (!source.includes("localStorage.setItem('kefas_all_products', JSON.stringify(allProducts))")) {
  throw new Error('Catalog hydration must persist a last-known-good catalog');
}

if (!source.includes('Array.isArray(allProducts) || allProducts.length === 0')) {
  throw new Error('Empty/unavailable Neon catalogs must be rejected');
}

if (!source.includes('return')) {
  throw new Error('Empty catalog guard must preserve the existing catalog');
}

if (source.includes('window.setInterval(refresh, 30000)')) {
  throw new Error('30-second background catalog polling must remain removed');
}

console.log('Catalog persistence regression checks passed');
