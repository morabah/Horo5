import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const REQUIRED_URL_KEYS = [
  'VITE_HORO_INSTAGRAM_URL',
  'VITE_HORO_WHATSAPP_SUPPORT_URL',
  'VITE_HORO_WHATSAPP_TRACKING_URL',
];

const urlPattern = /^https?:\/\/\S+$/i;

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvFile(filePath) {
  const parsed = {};
  if (!fs.existsSync(filePath)) return parsed;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = stripQuotes(line.slice(separatorIndex + 1));
    if (key) parsed[key] = value;
  }

  return parsed;
}

function loadMergedEnv() {
  const fileNames = ['.env', '.env.local', '.env.production', '.env.production.local'];
  const merged = {};
  for (const fileName of fileNames) {
    Object.assign(merged, parseEnvFile(path.join(projectRoot, fileName)));
  }
  return { ...merged, ...process.env };
}

const env = loadMergedEnv();
const missing = [];
const invalid = [];

for (const key of REQUIRED_URL_KEYS) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim().length === 0) {
    missing.push(key);
    continue;
  }
  if (!urlPattern.test(value.trim())) invalid.push(`${key}=${value}`);
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

console.log('HORO release config validation passed.');
