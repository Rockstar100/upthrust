import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('public/images', { recursive: true });

await sharp('tmp/curve.png').trim().webp({ quality: 80 }).toFile('public/images/curve.webp');

const curve = await sharp('public/images/curve.webp').metadata();
const statue = await sharp('public/images/statue.webp').metadata();
console.log('curve', curve.width, curve.height);
console.log('statue', statue.width, statue.height);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#f2f1ee"/>
  <text x="70" y="250" font-family="Arial, sans-serif" font-style="italic" font-weight="700" font-size="84" fill="#ff3b00">BOLD DESIGN</text>
  <text x="70" y="360" font-family="Arial, sans-serif" font-style="italic" font-weight="700" font-size="84" fill="#ff3b00">THAT PERFORMS</text>
  <text x="74" y="450" font-family="Arial, sans-serif" font-size="28" fill="#0c0c0c">UPTHRUST DESIGN</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('public/og.png');
console.log('og ok');
