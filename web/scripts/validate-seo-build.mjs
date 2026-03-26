import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMergedEnv, resolveSiteUrlForBuild } from './env-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const env = loadMergedEnv(projectRoot);

const siteUrl = resolveSiteUrlForBuild(env);
if (!siteUrl) {
  console.error(
    'HORO SEO build requires VITE_SITE_URL, or VERCEL_URL (set automatically on Vercel).',
  );
  process.exit(1);
}

console.log('HORO SEO build config validation passed.');
