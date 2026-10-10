// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321');

const bareBuildOnlyImport = /^import\s*["'](?:rolldown|@vercel\/routing-utils)["'];?\s*$/gm;
/** @type {import('vite').Plugin} */
const dropBuildOnlyImports = {
  name: 'drop-build-only-imports',
  apply: 'build',
  renderChunk(code) {
    if (!bareBuildOnlyImport.test(code)) return null;
    bareBuildOnlyImport.lastIndex = 0;
    return { code: code.replace(bareBuildOnlyImport, ''), map: null };
  },
};

// Vercel serves public/admin/index.html at /admin; the Astro dev server only serves it by full path.
/** @type {import('vite').Plugin} */
const adminIndexInDev = {
  name: 'admin-index-in-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      req.url = req.url?.replace(/^\/admin\/?(?=\?|$)/, '/admin/index.html');
      next();
    });
  },
};

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss(), dropBuildOnlyImports, adminIndexInDev],
  },
});
