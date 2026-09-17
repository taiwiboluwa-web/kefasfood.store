import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');

if (!source.includes("const lastKnownGood = localStorage.getItem('kefas_last_known_good_products')")) throw new Error('missing last-known-good read');
if (!source.includes("localStorage.setItem('kefas_last_known_good_products', JSON.stringify(allProducts))")) throw new Error('missing last-known-good write');
if (!source.includes('Array.isArray(allProducts) || allProducts.length === 0')) throw new Error('missing empty catalog guard');
if (source.includes('window.setInterval(refresh, 30000)')) throw new Error('background catalog polling is still present');
console.log('Catalog persistence regression checks passed');
