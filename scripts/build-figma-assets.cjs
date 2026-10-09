// Turns raw Figma "Copy as SVG/PNG" captures in tmp/ into web assets in public/.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const tmp = (f) => path.join(root, 'tmp', f);
const out = (f) => {
  const p = path.join(root, 'public', f);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
};
const read = (f) => fs.readFileSync(tmp(f), 'utf8');

async function rasterOrangeInline(svg, density = 288) {
  // Replace heavy orange brush paths with an embedded raster of the same paths.
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const [w, h] = [Number(m[1]), Number(m[2])];
  const orange = [...svg.matchAll(/<path[^>]*fill="#FF4200"[^>]*\/>/g)].map((x) => x[0]);
  if (!orange.length) return svg;
  const only = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${orange.join('')}</svg>`;
  const png = await sharp(Buffer.from(only), { density }).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  let stripped = svg;
  for (const p of orange) stripped = stripped.replace(p, '');
  const img = `<image href="data:image/webp;base64,${png.toString('base64')}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  return stripped.replace(/<\/svg>\s*$/, `${img}</svg>`);
}

async function main() {
  // Hero display type, exact Figma outlines.
  fs.writeFileSync(out('hero/bold.svg'), read('fig-bold.png'));
  fs.writeFileSync(out('hero/that.svg'), read('fig-vector.png'));
  fs.writeFileSync(out('hero/performs.svg'), read('fig-perform.png'));

  // Side notes: vector text, rasterised brush marks.
  fs.writeFileSync(out('hero/identity.svg'), await rasterOrangeInline(read('fig-identity.png')));
  fs.writeFileSync(out('hero/strategy.svg'), await rasterOrangeInline(read('fig-strategy.png')));
  fs.writeFileSync(out('hero/comfortable.svg'), read('fig-comfortable.png'));
  await sharp(Buffer.from(read('fig-path56.png')), { density: 288 }).webp({ quality: 90, alphaQuality: 100 }).toFile(out('hero/underline.webp'));

  // Blueprint drawing (716x713 in Figma) at 2x.
  await sharp(Buffer.from(read('fig-clipgroup.png')), { density: 144 }).webp({ quality: 82, alphaQuality: 90 }).toFile(out('hero/blueprint.webp'));

  // Statue: Figma frame 546x685 crops a 4096x2304 fill (1282x721 css, offset -375,-36).
  const k = 4096 / (4096 * 0.000573394 * 546);
  await sharp(tmp('figma-statue.png'))
    .extract({ left: Math.round(375.375 * k), top: Math.round(36.3 * k), width: Math.round(546 * k), height: Math.min(2304 - Math.round(36.3 * k), Math.round(685 * k)) })
    .resize(1092, 1370, { fit: 'fill' })
    .webp({ quality: 86, alphaQuality: 100 })
    .toFile(out('images/statue.webp'));

  await sharp(out('images/statue.webp')).resize(600).webp({ quality: 84, alphaQuality: 100 }).toFile(out('images/statue-600.webp'));
  await sharp(out('hero/blueprint.webp')).resize(720).webp({ quality: 82, alphaQuality: 90 }).toFile(out('hero/blueprint-720.webp'));

  // Light grid behind the hero (1440x1800 @2x).
  await sharp(tmp('fig-darkbg.png')).webp({ quality: 80 }).toFile(out('images/grid.webp'));

  // Header pieces from the 1440x72 header.
  const header = read('fig-header.png');
  const svgBody = header.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const logoPaths = [...svgBody.matchAll(/<path[^>]*fill="black"[^>]*\/>/g)].map((x) => x[0]).join('');
  const contactPath = [...svgBody.matchAll(/<path[^>]*fill="#FE3A00"[^>]*\/>/g)].map((x) => x[0]).join('');
  const box = async (inner, vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
  const bounds = async (inner) => {
    const buf = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="72" viewBox="0 0 1440 72">${inner}</svg>`), { density: 72 }).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = buf;
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * info.channels + 3] > 0) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return [x0, y0, x1 + 1, y1 + 1];
  };
  const lb = await bounds(logoPaths);
  const cb = await bounds(contactPath);
  fs.writeFileSync(out('brand/logo.svg'), await box(logoPaths, `${lb[0]} ${lb[1]} ${lb[2] - lb[0]} ${lb[3] - lb[1]}`));
  fs.writeFileSync(out('brand/contact-us.svg'), await box(contactPath, `${cb[0]} ${cb[1]} ${cb[2] - cb[0]} ${cb[3] - cb[1]}`));
  console.log('logo box', lb, 'contact box', cb);

  // Logo rail: full row and a logos-only crop for the mobile marquee.
  const logos = read('fig-logos.png');
  fs.writeFileSync(out('brand/logo-rail.svg'), logos);
  const logosOnly = logos.replace('viewBox="0 0 1440 144"', 'viewBox="280 40 1110 64"').replace(/width="1440" height="144"/, 'width="1110" height="64"');
  await sharp(Buffer.from(logosOnly), { density: 144 }).webp({ quality: 90, alphaQuality: 100 }).toFile(out('brand/logos.webp'));

  // Footer wordmark (y 250-460 of the 1440x900 footer).
  const footer = read('fig-footer.png');
  const start = footer.indexOf('<rect width="1440" height="900" fill="black"/>') + '<rect width="1440" height="900" fill="black"/>'.length;
  const cut = footer.indexOf('<mask id="path-7');
  const defsAt = footer.indexOf('<defs>');
  const wordmark = '<svg width="1440" height="206" viewBox="0 252 1440 206" fill="none" xmlns="http://www.w3.org/2000/svg">' + footer.slice(start, cut) + footer.slice(defsAt);
  fs.writeFileSync(out('brand/wordmark.svg'), wordmark);

  // Service slides: bento cards and per-slide copper curve backdrops.
  const roundMask = (w, h, r) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);
  const slides = { strategy: 'fig-slide4.png', identity: 'fig-slide3.png', product: 'fig-slide2.png', campaign: 'fig-slide1.png' };
  for (const [name, file] of Object.entries(slides)) {
    const card = await sharp(tmp(file)).extract({ left: 240, top: 670, width: 984, height: 662 }).toBuffer();
    const rounded = await sharp(card).composite([{ input: roundMask(984, 662, 14), blend: 'dest-in' }]).png().toBuffer();
    await sharp(rounded).webp({ quality: 84 }).toFile(out(`services/${name}.webp`));
    await sharp(rounded).resize(560).webp({ quality: 82 }).toFile(out(`services/${name}-560.webp`));
  }
  const nat = 3451 / 4320;
  const offsets = { strategy: 0, identity: 1440, product: 2880 };
  for (const [name, x] of Object.entries(offsets)) {
    await sharp(tmp('figma-curve.png'))
      .extract({ left: Math.round(x * nat), top: Math.round(295 * nat), width: Math.round(1440 * nat), height: Math.round(810 * nat) })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(out(`services/curve-${name}.webp`));
  }
  await sharp(tmp('fig-curve1.png')).resize(1440, 810).webp({ quality: 82, alphaQuality: 90 }).toFile(out('services/curve-campaign.webp'));

  for (const f of ['hero', 'brand', 'services', 'images']) {
    for (const n of fs.readdirSync(path.join(root, 'public', f))) console.log(f + '/' + n, fs.statSync(path.join(root, 'public', f, n)).size);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
