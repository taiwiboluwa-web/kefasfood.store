import fs from 'node:fs';

const source = fs.readFileSync('api/kv.ts', 'utf8');

if (!source.includes('process.env.VERCEL_DEPLOY_HOOK_URL')) {
  throw new Error('KV saves must support the Vercel production deploy hook');
}

const verifyIndex = source.indexOf('if (persisted.length === 0)');
const hookIndex = source.indexOf('VERCEL_DEPLOY_HOOK_URL');
if (verifyIndex === -1 || hookIndex === -1 || hookIndex < verifyIndex) {
  throw new Error('The deploy hook must run only after Neon JSONB write verification');
}

if (!source.includes("method: 'POST'")) {
  throw new Error('The Vercel deploy hook must be triggered with POST');
}

if (!source.includes('deploymentTriggered')) {
  throw new Error('KV response must expose deployment trigger status');
}

console.log('KV publish-on-save checks passed');
