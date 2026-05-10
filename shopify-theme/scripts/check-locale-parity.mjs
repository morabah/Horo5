#!/usr/bin/env node
/**
 * HORO locale parity checker
 * Fails when en.default.json has a horo.* key missing from ar.json or vice-versa.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'locales');

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys.push(...flatten(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadJson(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(text);
}

function getHoroKeys(obj) {
  if (!obj.horo) return new Set();
  return new Set(flatten(obj.horo, 'horo'));
}

const en = loadJson(path.join(localesDir, 'en.default.json'));
const ar = loadJson(path.join(localesDir, 'ar.json'));

const enKeys = getHoroKeys(en);
const arKeys = getHoroKeys(ar);

const missingInAr = [];
const missingInEn = [];

for (const key of enKeys) {
  if (!arKeys.has(key)) missingInAr.push(key);
}

for (const key of arKeys) {
  if (!enKeys.has(key)) missingInEn.push(key);
}

let exitCode = 0;

if (missingInAr.length > 0) {
  console.error(`❌ Missing in ar.json (${missingInAr.length} keys):`);
  missingInAr.forEach((k) => console.error(`  - ${k}`));
  exitCode = 1;
}

if (missingInEn.length > 0) {
  console.error(`❌ Missing in en.default.json (${missingInEn.length} keys):`);
  missingInEn.forEach((k) => console.error(`  - ${k}`));
  exitCode = 1;
}

if (exitCode === 0) {
  console.log(`✅ Locale parity OK — ${enKeys.size} horo keys in both files.`);
}

process.exit(exitCode);
