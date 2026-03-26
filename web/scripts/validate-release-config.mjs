import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidUrlValue, loadMergedEnv } from './env-config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const REQUIRED_URL_KEYS = [
  'VITE_HORO_INSTAGRAM_URL',
  'VITE_HORO_WHATSAPP_SUPPORT_URL',
  'VITE_HORO_WHATSAPP_TRACKING_URL',
];

const env = loadMergedEnv(projectRoot);
const missing = [];
const invalid = [];

for (const key of REQUIRED_URL_KEYS) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    missing.push(key);
    continue;
  }
  if (!isValidUrlValue(value)) invalid.push(`${key}=${value}`);
}

if (missing.length || invalid.length) {
  console.error('HORO release config is incomplete.');
  if (missing.length) {
    console.error(`Missing required support URLs: ${missing.join(', ')}`);
  }
  if (invalid.length) {
    console.error(`Invalid support URL values: ${invalid.join(', ')}`);
  }
  process.exit(1);
}

const OPTIONAL_URL_KEYS = ['VITE_SITE_URL', 'VITE_GA_MEASUREMENT_ID', 'VITE_META_PIXEL_ID'];
for (const key of OPTIONAL_URL_KEYS) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim().length === 0) continue;
  if (key === 'VITE_GA_MEASUREMENT_ID' || key === 'VITE_META_PIXEL_ID') continue;
  if (!isValidUrlValue(value)) {
    console.error(`HORO release config: invalid optional URL ${key}=${value}`);
    process.exit(1);
  }
}

console.log('HORO release config validation passed.');
