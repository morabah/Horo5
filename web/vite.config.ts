import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { createRobotsTxt, createSitemapXml } from './src/seo/assets';
import { resolveSiteUrlForBuild } from './scripts/env-config.mjs';

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
      const fileEnv = loadEnv(mode, process.cwd(), '');
      const merged = { ...process.env, ...fileEnv } as Record<string, string | undefined>;
      const base = resolveSiteUrlForBuild(merged)?.replace(/\/$/, '');
      if (!base) {
        throw new Error(
          '[horo-seo-assets] Set VITE_SITE_URL or build on Vercel (VERCEL_URL) for robots.txt and sitemap.xml',
        );
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
