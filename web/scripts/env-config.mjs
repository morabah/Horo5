import fs from 'node:fs';
import path from 'node:path';

export const URL_PATTERN = /^https?:\/\/\S+$/i;

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

export function loadMergedEnv(projectRoot) {
  const fileNames = ['.env', '.env.local', '.env.production', '.env.production.local'];
  const merged = {};
  for (const fileName of fileNames) {
    Object.assign(merged, parseEnvFile(path.join(projectRoot, fileName)));
  }
  return { ...merged, ...process.env };
}

export function isValidUrlValue(value) {
  return URL_PATTERN.test(value.trim());
}
