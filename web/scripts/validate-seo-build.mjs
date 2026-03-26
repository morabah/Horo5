import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidUrlValue, loadMergedEnv } from './env-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const env = loadMergedEnv(projectRoot);

const siteUrl = env.VITE_SITE_URL;
if (typeof siteUrl !== 'string' || siteUrl.trim().length === 0) {
  console.error('HORO SEO build requires VITE_SITE_URL.');
  process.exit(1);
}

if (!isValidUrlValue(siteUrl)) {
  console.error(`HORO SEO build: invalid VITE_SITE_URL=${siteUrl}`);
  process.exit(1);
}

console.log('HORO SEO build config validation passed.');
