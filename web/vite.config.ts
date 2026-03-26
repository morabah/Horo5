import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { createRobotsTxt, createSitemapXml } from './src/seo/assets';

function horoSeoPlugin(): Plugin {
  let outDir = 'dist';
  let mode = 'development';

  return {
    name: 'horo-seo-assets',
    configResolved(config) {
      outDir = config.build.outDir;
      mode = config.mode;
    },
    closeBundle() {
      const env = loadEnv(mode, process.cwd(), '');
      const base = env.VITE_SITE_URL?.trim().replace(/\/$/, '');
      if (!base) {
        throw new Error('[horo-seo-assets] VITE_SITE_URL is required to generate robots.txt and sitemap.xml');
      }
      const out = path.resolve(outDir);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, 'sitemap.xml'), createSitemapXml(base), 'utf8');
      fs.writeFileSync(path.join(out, 'robots.txt'), createRobotsTxt(base), 'utf8');
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), horoSeoPlugin()],
});
