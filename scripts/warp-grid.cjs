// Generates the warped line grid that sits behind the services slides.
const fs = require('fs');
const path = require('path');

const W = 1440;
const H = 1051;
const fadeEnd = 972;

const warp = (x, y) => {
  const t = y / H;
  const dx = 34 * Math.sin(y / 150 + x / 380) + 18 * Math.sin(y / 70 - x / 210) * t;
  const dy = 26 * Math.sin(x / 190 + y / 330) + 14 * Math.cos(x / 95 - y / 160) * t;
  return [x + dx, y + dy];
};

const line = (pts) => 'M' + pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(' ');
const paths = [];
for (let x = -96; x <= W + 96; x += 48) {
  const pts = [];
  for (let y = -60; y <= fadeEnd + 60; y += 12) pts.push(warp(x, y));
  paths.push(line(pts));
}
for (let y = -40; y <= fadeEnd + 40; y += 40) {
  const pts = [];
  for (let x = -96; x <= W + 96; x += 12) pts.push(warp(x, y));
  paths.push(line(pts));
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="${(820 / H).toFixed(3)}" stop-color="#fff"/><stop offset="${(fadeEnd / H).toFixed(3)}" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="m"><rect width="${W}" height="${H}" fill="url(#f)"/></mask></defs>
<path mask="url(#m)" d="${paths.join('')}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'images', 'warp-grid.svg'), svg);
console.log('warp-grid.svg', svg.length);
