import fs from 'node:fs';

const source = fs.readFileSync(new URL('../api/kv.ts', import.meta.url), 'utf8');

if (!source.includes('for (let attempt = 0; attempt < 3; attempt += 1)')) throw new Error('KV verification retry loop is missing');
if (!source.includes('150 * (attempt + 1)')) throw new Error('KV verification retry backoff is missing');
if (!source.includes('value = ${serializedValue}::jsonb')) throw new Error('KV semantic JSONB verification is missing');

console.log('PASS: KV verification retry contract is present');
