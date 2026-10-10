// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  output: 'static',
  adapter: vercel(),
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
  },
});
