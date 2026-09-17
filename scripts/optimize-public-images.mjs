import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve('public');
const EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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
  if (original.size < 250 * 1024) return { skipped: true, before: original.size, after: original.size };

  const ext = path.extname(file).toLowerCase();
  const temp = `${file}.optimized.tmp`;
  const image = sharp(file).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });

  if (ext === '.png') {
    await image.png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 }).toFile(temp);
  } else if (ext === '.webp') {
    await image.webp({ quality: 82, effort: 5 }).toFile(temp);
  } else {
    await image.jpeg({ quality: 82, mozjpeg: true }).toFile(temp);
  }

  const optimized = await fs.stat(temp);
  if (optimized.size < original.size) {
    await fs.rename(temp, file);
    return { skipped: false, before: original.size, after: optimized.size };
  }

  await fs.unlink(temp);
  return { skipped: true, before: original.size, after: original.size };
}

const files = await walk(PUBLIC_DIR);
let changed = 0;
let before = 0;
let after = 0;

for (const file of files) {
  try {
    const result = await optimize(file);
    before += result.before;
    after += result.after;
    if (!result.skipped) changed += 1;
  } catch (error) {
    console.warn(`Image optimization skipped ${file}:`, error?.message || error);
  }
}

const saved = Math.max(0, before - after);
const percent = before ? Math.round((saved / before) * 100) : 0;
console.log(`Web image optimization: ${changed} files reduced, ${(saved / 1024 / 1024).toFixed(2)}MB saved (${percent}%).`);
