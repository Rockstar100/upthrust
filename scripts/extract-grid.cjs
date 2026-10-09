// Builds the dark-section grids from the Figma "curve lines" layers (Copy as PNG at 2x).
// tmp/fig-grid1.png starts 83px below the top of the services section and is only
// visible down to the footer, 968px later. tmp/fig-grid2.png is the next piece; only
// its last 60px show, as the strip along the bottom of the footer.
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
  await sharp(path.join(root, 'tmp/fig-grid2.png'))
    .flatten({ background: '#000' })
    .extract({ left: 0, top: 1598 - 120, width: 2880, height: 120 })
    .greyscale()
    .webp({ quality: 75 })
    .toFile(path.join(root, 'public/images/footer-grid.webp'));
  console.log('services-grid and footer-grid written');
})();
