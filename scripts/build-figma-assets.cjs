// Turns raw Figma "Copy as SVG/PNG" captures in tmp/ into web assets in public/.
// Every capture is saved as tmp/<name>.png, so SVG captures are SVG text despite the extension.
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
const write = (f, data) => fs.writeFileSync(out(f), data);
const svgInput = (svg, density) => sharp(Buffer.from(svg), { density });
const webp = (img, file, quality, alphaQuality) => img.webp({ quality, alphaQuality }).toFile(out(file));

const ORANGE_PATH = /<path[^>]*fill="#FF4200"[^>]*\/>/g;

// Swaps the heavy orange brush paths for one embedded raster of the same paths.
async function rasterOrangeInline(svg, density = 288) {
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const orange = [...svg.matchAll(ORANGE_PATH)].map((m) => m[0]);
  if (!orange.length) return svg;

  const only = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${orange.join('')}</svg>`;
  const raster = await svgInput(only, density).webp({ quality: 90, alphaQuality: 100 }).toBuffer();
  const stripped = orange.reduce((s, p) => s.replace(p, ''), svg);
  const img = `<image href="data:image/webp;base64,${raster.toString('base64')}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none"/>`;
  return stripped.replace(/<\/svg>\s*$/, `${img}</svg>`);
}

// Pixel bounds of some paths drawn on the 1440x72 header canvas.
async function headerBounds(paths) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="72" viewBox="0 0 1440 72">${paths}</svg>`;
  const { data, info } = await svgInput(svg, 72).raw().toBuffer({ resolveWithObject: true });
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] === 0) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  return `${x0} ${y0} ${x1 + 1 - x0} ${y1 + 1 - y0}`;
}

async function hero() {
  // Display type, exact Figma outlines.
  write('hero/bold.svg', read('fig-bold.png'));
  write('hero/that.svg', read('fig-vector.png'));
  write('hero/performs.svg', read('fig-perform.png'));

  // Side notes: vector text, rasterised brush marks.
  write('hero/identity.svg', await rasterOrangeInline(read('fig-identity.png')));
  write('hero/strategy.svg', await rasterOrangeInline(read('fig-strategy.png')));
  write('hero/comfortable.svg', read('fig-comfortable.png'));
  await webp(svgInput(read('fig-path56.png'), 288), 'hero/underline.webp', 90, 100);

  // Blueprint drawing at 2x. Figma masks it to 716 wide, the frame's right edge; the drawing
  // runs to 1040, so the mask is widened and wide screens see the whole plan instead of a cut.
  const blueprint = read('fig-clipgroup.png')
    .replace('width="716" height="713" viewBox="0 0 716 713"', 'width="1040" height="713" viewBox="0 0 1040 713"')
    .replace(/(maskUnits="userSpaceOnUse" x="0" y="0") width="716"/, '$1 width="1040"')
    .replace('d="M-6.10352e-05 712.041H716V0H-6.10352e-05V712.041Z"', 'd="M0 712.041H1040V0H0V712.041Z"');
  await webp(svgInput(blueprint, 144), 'hero/blueprint.webp', 82, 90);
  await webp(sharp(out('hero/blueprint.webp')).resize(1040), 'hero/blueprint-1040.webp', 82, 90);

  // Statue: the 546x685 Figma frame crops a 4096x2304 fill drawn at 1282x721, offset -375,-36.
  const k = 4096 / (4096 * 0.000573394 * 546);
  const top = Math.round(36.3 * k);
  const crop = {
    left: Math.round(375.375 * k),
    top,
    width: Math.round(546 * k),
    height: Math.min(2304 - top, Math.round(685 * k)),
  };
  await webp(sharp(tmp('figma-statue.png')).extract(crop).resize(1092, 1370, { fit: 'fill' }), 'images/statue.webp', 86, 100);
  await webp(sharp(out('images/statue.webp')).resize(600), 'images/statue-600.webp', 84, 100);

  // Light grid behind the hero (1440x1800 @2x). The capture name is historical.
  await sharp(tmp('fig-darkbg.png')).webp({ quality: 80 }).toFile(out('images/grid.webp'));
}

async function brand() {
  // Logo and CONTACT US, cut out of the 1440x72 header by fill colour.
  const header = read('fig-header.png').replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const pathsWithFill = (fill) => [...header.matchAll(new RegExp(`<path[^>]*fill="${fill}"[^>]*/>`, 'g'))].map((m) => m[0]).join('');
  const svgBox = (paths, viewBox) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${paths}</svg>`;

  const logo = pathsWithFill('black');
  const contact = pathsWithFill('#FE3A00');
  const logoBox = await headerBounds(logo);
  const contactBox = await headerBounds(contact);
  write('brand/logo.svg', svgBox(logo, logoBox));
  write('brand/contact-us.svg', svgBox(contact, contactBox));
  console.log('logo box', logoBox, '| contact box', contactBox);

  // Logo rail: full row for desktop, logos-only crop for the mobile marquee.
  const logos = read('fig-logos.png');
  write('brand/logo-rail.svg', logos);
  const logosOnly = logos
    .replace('viewBox="0 0 1440 144"', 'viewBox="280 40 1110 64"')
    .replace(/width="1440" height="144"/, 'width="1110" height="64"');
  await webp(svgInput(logosOnly, 144), 'brand/logos.webp', 90, 100);

  // Footer wordmark: the paths between the black backdrop and the divider mask, y 252-458.
  const footer = read('fig-footer.png');
  const backdrop = '<rect width="1440" height="900" fill="black"/>';
  const body = footer.slice(footer.indexOf(backdrop) + backdrop.length, footer.indexOf('<mask id="path-7'));
  const defs = footer.slice(footer.indexOf('<defs>'));
  write('brand/wordmark.svg', `<svg width="1440" height="206" viewBox="0 252 1440 206" fill="none" xmlns="http://www.w3.org/2000/svg">${body}${defs}`);
}

// Top and bottom of the copper tube in one column of an RGBA buffer, within rows y0-y1.
function tubeSpan(data, width, x, y0, y1) {
  let top = -1, bottom = -1;
  for (let y = y0; y < y1; y++) {
    const i = (y * width + x) * 4;
    if (((data[i] + data[i + 1] + data[i + 2]) / 3) * (data[i + 3] / 255) <= 40) continue;
    if (top < 0) top = y;
    bottom = y;
  }
  return [top, bottom];
}

// Sweeps the product curve's last column along the campaign tube and fades it out over `width`
// columns, so the stripe and highlight don't jump where slide 3 hands over to slide 4.
function blendSeam(campaign, product, size, width = 240) {
  const { w, h } = size;
  const [pTop, pBottom] = tubeSpan(product, w, w - 1, 150, 450);
  const pad = 6;
  for (let x = 0; x < width; x++) {
    const [cTop, cBottom] = tubeSpan(campaign, w, x, 150, 450);
    const t = x / width;
    const keep = 1 - t * t * (3 - 2 * t);
    for (let y = cTop - pad; y <= cBottom + pad; y++) {
      const v = (y - cTop) / (cBottom - cTop);
      const sy = Math.min(h - 1, Math.max(0, Math.round(pTop + v * (pBottom - pTop))));
      const ci = (y * w + x) * 4;
      const pi = (sy * w + (w - 1)) * 4;
      for (let c = 0; c < 4; c++) campaign[ci + c] = Math.round(product[pi + c] * keep + campaign[ci + c] * (1 - keep));
    }
  }
}

async function services() {
  // Bento cards: 492x331 at 2x, at the same spot on every slide, with Figma's 7px radius.
  const card = { left: 240, top: 670, width: 984, height: 662 };
  const roundMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${card.width}" height="${card.height}"><rect width="${card.width}" height="${card.height}" rx="14" fill="#fff"/></svg>`,
  );
  const slides = { strategy: 'fig-slide4.png', identity: 'fig-slide3.png', product: 'fig-slide2.png', campaign: 'fig-slide1.png' };
  for (const [name, file] of Object.entries(slides)) {
    const cut = await sharp(tmp(file)).extract(card).toBuffer();
    const rounded = await sharp(cut).composite([{ input: roundMask, blend: 'dest-in' }]).png().toBuffer();
    await sharp(rounded).webp({ quality: 84 }).toFile(out(`services/${name}.webp`));
    await sharp(rounded).resize(560).webp({ quality: 82 }).toFile(out(`services/${name}-560.webp`));
  }

  // Copper curve: slides 1-3 are 1440-wide windows onto one 4320x1400 curve (captured at 3451 wide).
  // Figma's slides stop at 810, which slices the product loop; the windows run the full 1051-tall
  // services section instead so every loop ends on its own.
  const SECTION_H = 1051;
  const scale = 3451 / 4320;
  const offsets = { strategy: 0, identity: 1440, product: 2880 };
  const curveWindow = (x) => ({
    left: Math.round(x * scale),
    top: Math.round(295 * scale),
    width: Math.round(1440 * scale),
    height: Math.round(SECTION_H * scale),
  });
  for (const [name, x] of Object.entries(offsets)) {
    await webp(sharp(tmp('figma-curve.png')).extract(curveWindow(x)), `services/curve-${name}.webp`, 82, 90);
  }
  // Slide 4 is a separate render whose tube enters 5% thinner and a few px off the product curve's
  // exit; scale it from the left edge so the tube is continuous while scrolling from slide 3 to 4.
  const SEAM_SCALE = 1.0575;
  const SEAM_TOP = 14;
  const scaledH = Math.round(810 * SEAM_SCALE);
  const scaled = await sharp(tmp('fig-curve1.png')).resize(Math.round(1440 * SEAM_SCALE), scaledH).png().toBuffer();
  const campaign = await sharp(scaled)
    .extract({ left: 0, top: SEAM_TOP, width: 1440, height: scaledH - SEAM_TOP })
    .png()
    .toBuffer();
  const padded = await sharp(campaign)
    .extend({ bottom: SECTION_H - (scaledH - SEAM_TOP), background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .raw()
    .toBuffer();
  const product = await sharp(tmp('figma-curve.png'))
    .extract(curveWindow(offsets.product))
    .resize(1440, SECTION_H, { fit: 'fill' })
    .ensureAlpha()
    .raw()
    .toBuffer();
  blendSeam(padded, product, { w: 1440, h: SECTION_H });
  await webp(sharp(padded, { raw: { width: 1440, height: SECTION_H, channels: 4 } }), 'services/curve-campaign.webp', 82, 90);
}

async function main() {
  await hero();
  await brand();
  await services();

  for (const dir of ['hero', 'brand', 'services', 'images']) {
    for (const name of fs.readdirSync(path.join(root, 'public', dir))) {
      console.log(`${dir}/${name}`, fs.statSync(path.join(root, 'public', dir, name)).size);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
