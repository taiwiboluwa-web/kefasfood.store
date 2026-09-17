import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MIN_SIZE = 250 * 1024;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (EXTENSIONS.has(path.extname(entry.name).toLowerCase())) files.push(full);
  }
  return files;
}

async function optimize(file) {
  const original = await fs.stat(file);
  if (original.size < MIN_SIZE) return { changed: false, before: original.size, after: original.size };

  const ext = path.extname(file).toLowerCase();
  const temp = `${file}.optimized.tmp`;
  const image = sharp(file).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });

  if (ext === '.png') {
    await image.png({ compressionLevel: 9, effort: 6 }).toFile(temp);
  } else if (ext === '.webp') {
    await image.webp({ quality: 82, effort: 4 }).toFile(temp);
  } else {
    await image.jpeg({ quality: 82, mozjpeg: true }).toFile(temp);
  }

  const optimized = await fs.stat(temp);
  if (optimized.size < original.size) {
    await fs.rename(temp, file);
    return { changed: true, before: original.size, after: optimized.size };
  }

  await fs.unlink(temp);
  return { changed: false, before: original.size, after: original.size };
}

const files = await walk(PUBLIC_DIR);
const candidates = files.filter(async file => (await fs.stat(file)).size >= MIN_SIZE);
let changed = 0;
let before = 0;
let after = 0;
let completed = 0;

async function worker(file) {
  try {
    const result = await optimize(file);
    before += result.before;
    after += result.after;
    if (result.changed) changed += 1;
  } catch (error) {
    const stat = await fs.stat(file).catch(() => ({ size: 0 }));
    before += stat.size;
    after += stat.size;
    console.warn(`Image optimization skipped ${file}:`, error?.message || error);
  } finally {
    completed += 1;
    if (completed % 4 === 0 || completed === files.length) console.log(`Web image optimization: ${completed}/${files.length}`);
  }
}

// Limit concurrency to keep the Vercel 2-core build machine responsive.
for (let index = 0; index < files.length; index += 4) {
  await Promise.all(files.slice(index, index + 4).map(worker));
}

const saved = Math.max(0, before - after);
const percent = before ? Math.round((saved / before) * 100) : 0;
console.log(`Web image optimization complete: ${changed} files reduced, ${(saved / 1024 / 1024).toFixed(2)}MB saved (${percent}%).`);
