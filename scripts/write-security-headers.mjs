import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match =>
  `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);
const api = process.env.VITE_API_URL || '/api';
let connect = "'self'";
if (!api.startsWith('/')) {
  const url = new URL(api);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid public API origin');
  connect += ` ${url.origin} ${url.origin.replace(/^http/, 'ws')}`;
}
const policy = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://res.cloudinary.com; media-src 'self' blob:; connect-src ${connect}; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
writeFileSync('dist/security-headers.conf', [
  `add_header Content-Security-Policy "${policy}" always;`,
  'add_header X-Content-Type-Options "nosniff" always;',
  'add_header X-Frame-Options "DENY" always;',
  'add_header Referrer-Policy "no-referrer" always;',
  'add_header Cross-Origin-Opener-Policy "same-origin" always;',
  'add_header Cross-Origin-Resource-Policy "same-origin" always;',
  'add_header Permissions-Policy "camera=(self), microphone=(), geolocation=()" always;',
].join('\n') + '\n');
