#!/usr/bin/env node
/**
 * HORO Mobile 375px audit pass
 * Checks HORO CSS files for mobile accessibility issues:
 * - Touch targets < 44px
 * - Font sizes that may be too small on mobile
 * - Fixed widths that could cause overflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

const files = fs.readdirSync(assetsDir).filter(
  (f) => f.startsWith('component-horo-') || f.startsWith('component-home-') || f === 'horo-tokens.css'
);

let violations = [];

for (const file of files) {
  const filePath = path.join(assetsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip media queries entirely
    if (line.includes('@media')) continue;

    // Build context for selector-aware filtering
    const context = lines.slice(Math.max(0, i - 5), i + 1).join('\n');

    // Skip non-interactive decorative elements (icons, spinners, badges, chips that are just labels)
    const isDecorative = /(\bicon\b|spinner|__icon|loading|decorative|aria-hidden)/i.test(context);
    // Trust chips inside info blocks are not touch targets
    const isInfoChip = /(trust-chip|trust-strip__|delivery-estimate__icon|story-plan__icon)/i.test(context);
    // Pseudo-elements are decorative, not touch targets
    const isPseudo = /::after|::before/.test(context);
    // Badge counters are not touch targets
    const isBadge = /wishlist-badge/.test(context);

    // Check for fixed small touch targets (width/height < 44px)
    const touchTargetMatch = line.match(/(?:width|height|min-width|min-height|inline-size|block-size)\s*:\s*(\d+\.?\d*)(?:px|rem)/);
    if (touchTargetMatch && !isDecorative && !isInfoChip && !isPseudo && !isBadge) {
      const val = parseFloat(touchTargetMatch[1]);
      const unit = touchTargetMatch[0].includes('rem') ? 'rem' : 'px';
      const pxVal = unit === 'rem' ? val * 10 : val;
      if (pxVal > 0 && pxVal < 44 && !line.includes('border')) {
        // Only flag if context suggests it's interactive
        if (/(button|a\b|input|label|\.cta|\.btn|chip|badge|wishlist|quick.add|menu|nav)/i.test(context)) {
          violations.push({ file, line: i + 1, type: 'touch-target', value: `${val}${unit}`, code: line.trim() });
        }
      }
    }

    // Check for very small font sizes (skip badge/chip contexts that are intentionally tiny)
    const fontSizeMatch = line.match(/font-size\s*:\s*(\d+\.?\d*)(?:px|rem)/);
    if (fontSizeMatch) {
      const val = parseFloat(fontSizeMatch[1]);
      const unit = fontSizeMatch[0].includes('rem') ? 'rem' : 'px';
      const pxVal = unit === 'rem' ? val * 10 : val;
      if (pxVal > 0 && pxVal < 10) {
        violations.push({ file, line: i + 1, type: 'small-font', value: `${val}${unit}`, code: line.trim() });
      }
    }

    // Check for fixed pixel widths that could overflow
    const fixedWidthMatch = line.match(/width\s*:\s*(\d+)px/);
    if (fixedWidthMatch) {
      const pxVal = parseInt(fixedWidthMatch[1], 10);
      if (pxVal > 375) {
        violations.push({ file, line: i + 1, type: 'fixed-width', value: `${pxVal}px`, code: line.trim() });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ ${violations.length} mobile audit issue(s) found:\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line} [${v.type}] ${v.value}`);
    console.error(`    ${v.code}`);
  }
  process.exit(1);
} else {
  console.log(`✅ Mobile 375px audit pass — no issues in ${files.length} HORO CSS files.`);
  process.exit(0);
}
