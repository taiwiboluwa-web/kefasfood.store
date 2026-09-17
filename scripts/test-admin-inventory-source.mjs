import fs from 'node:fs';

const source = fs.readFileSync('src/app/AdminVisits.tsx', 'utf8');

function sectionBetween(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) throw new Error('Could not locate fetchStock section');
  return source.slice(start, end);
}

const fetchStock = sectionBetween('  const fetchStock = async', '  const toggleStock = async');

for (const expected of [
  'await productsSync.load()',
  'await productPricesSync.load()',
  'await stockStatusSync.load()',
  'await comingSoonSync.load()',
]) {
  if (!fetchStock.includes(expected)) {
    throw new Error(`Admin inventory must load authoritative Neon data with: ${expected}`);
  }
}

if (fetchStock.includes('await syncFromNeon()')) {
  throw new Error('Admin inventory must not depend on the all-or-nothing syncFromNeon bootstrap');
}

console.log('Admin inventory source checks passed');
