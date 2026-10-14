import { createServer } from 'node:http';
const counts = {};
const asset = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="gold"/><circle cx="400" cy="300" r="180" fill="green"/></svg>';
createServer((req, res) => {
  if (req.url === '/stats') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(counts)); return; }
  if (req.url === '/reset') { for (const key of Object.keys(counts)) delete counts[key]; res.end('ok'); return; }
  counts[req.url] = (counts[req.url] || 0) + 1;
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Content-Type', 'image/svg+xml');
  if (req.url === '/missing.svg') { res.statusCode = 404; res.end('missing'); return; }
  res.end(asset);
}).listen(5189, '127.0.0.1');
