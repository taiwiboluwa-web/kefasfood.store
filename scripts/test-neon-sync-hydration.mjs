import fs from 'node:fs';

const source = fs.readFileSync('src/lib/dataSync.ts', 'utf8');

const syncStart = source.indexOf('export async function syncFromNeon');
const syncEnd = source.indexOf('\nexport async function syncToNeon', syncStart);
if (syncStart === -1 || syncEnd === -1) throw new Error('Could not locate syncFromNeon');
const sync = source.slice(syncStart, syncEnd);

const hydrationMarker = 'localValues.forEach(([key, value]) => {';
const hydrationIndex = sync.indexOf(hydrationMarker);
const blockingWriteIndex = sync.indexOf('if (writes.length) await Promise.all(writes)');

if (hydrationIndex === -1) throw new Error('syncFromNeon must hydrate local state from Neon');
if (blockingWriteIndex !== -1 && blockingWriteIndex < hydrationIndex) {
  throw new Error('Neon sync must hydrate local state before optional bootstrap writes can fail');
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

console.log('Neon sync hydration and storefront stability checks passed');
