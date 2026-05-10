#!/usr/bin/env node
/**
 * HORO physical property checker
 * Fails CI when HORO custom CSS uses physical properties instead of logical ones.
 * Only checks assets/component-horo-*.css and assets/component-home-*.css
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

const PHYSICAL_PROPS = [
  /margin-left\s*:/,
  /margin-right\s*:/,
  /padding-left\s*:/,
  /padding-right\s*:/,
  /border-left\s*:/,
  /border-right\s*:/,
  /left\s*:/,
  /right\s*:/,
  /text-align\s*:\s*(left|right)/,
];

const files = fs.readdirSync(assetsDir).filter(
  (f) => f.startsWith('component-horo-') || f.startsWith('component-home-')
);

let violations = 0;

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const regex of PHYSICAL_PROPS) {
      if (regex.test(line)) {
        console.error(`❌ ${file}:${i + 1} — physical property: ${line.trim()}`);
        violations++;
      }
    }
  }
}

if (violations > 0) {
  console.error(`\n❌ ${violations} physical property violation(s) found.`);
  console.error('Use logical properties: margin-inline-start/end, padding-inline-start/end, inset-inline-start/end, text-align: start/end.');
  process.exit(1);
} else {
  console.log(`✅ No physical property violations in ${files.length} HORO CSS files.`);
  process.exit(0);
}
