// Builds the services background grid from the Figma "curve lines" layer
// (tmp/fig-grid1.png, Copy as PNG at 2x). The layer starts 83px below the top
// of the services section and is only visible down to the footer, 968px later.
const sharp = require('sharp');
const path = require('path');

const root = path.join(__dirname, '..');
const VISIBLE = 968;

(async () => {
  const grid = await sharp(path.join(root, 'tmp/fig-grid1.png'))
    .flatten({ background: '#000' })
    .extract({ left: 0, top: 0, width: 2880, height: VISIBLE * 2 })
    .greyscale()
    .png()
    .toBuffer();
  await sharp(grid).webp({ quality: 72 }).toFile(path.join(root, 'public/images/services-grid.webp'));
  await sharp(grid).resize(1440).webp({ quality: 78 }).toFile(path.join(root, 'public/images/services-grid-1440.webp'));
  console.log('services-grid written');
})();
