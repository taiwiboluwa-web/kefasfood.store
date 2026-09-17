import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../api/kv.ts', import.meta.url), 'utf8');

if (source.includes("JSON.stringify(persistedValue) !== serializedValue")) {
  throw new Error('KV verification is still comparing JSON strings; jsonb key ordering can cause false mismatches.');
}

if (!source.includes('value = ${serializedValue}::jsonb')) {
  throw new Error('KV verification must compare the persisted JSONB value in PostgreSQL.');
}

console.log('KV verification regression test passed.');
