import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';

await mkdir('tmp', { recursive: true });

createServer((req, res) => {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', async () => {
    const name = req.url?.replace('/', '') || 'shot';
    const file = `tmp/${name}.png`;
    await writeFile(file, Buffer.concat(chunks));
    console.log('saved', file, Buffer.concat(chunks).length);
    res.end('ok');
  });
}).listen(4456, () => console.log('save server 4456'));
