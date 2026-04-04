#!/usr/bin/env node
/**
 * Serves the production build with `vite preview`, then runs axe via Playwright (bundled Chromium).
 * Usage: npm run build && npm run test:a11y
 * First-time setup: npx playwright install chromium
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const DIST_INDEX = path.join(webRoot, 'dist', 'index.html');

const URLS = [
  `${BASE}/`,
  `${BASE}/vibes`,
  `${BASE}/search`,
  `${BASE}/products/the-weight-of-light`,
  `${BASE}/cart`,
  `${BASE}/checkout`,
];

function waitForServer(timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      http
        .get(`${BASE}/`, (res) => {
          res.resume();
          if (res.statusCode && res.statusCode < 500) {
            resolve();
            return;
          }
          retry();
        })
        .on('error', retry);

      function retry() {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for preview at ${BASE}`));
          return;
        }
        setTimeout(ping, 250);
      }
    };
    ping();
  });
}

async function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.error('test-a11y: dist/ missing. Run: npm run build');
    process.exit(1);
  }

  const preview = spawn('npm', ['run', 'preview:a11y'], {
    cwd: webRoot,
    stdio: 'inherit',
    shell: true,
  });

  let exitCode = 0;

  try {
    await waitForServer();

    const browser = await chromium.launch({ headless: true });

    try {
      for (const url of URLS) {
        console.log(`\n--- axe (playwright): ${url} ---\n`);
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .exclude('.footer-watermark-a11y-exempt')
          .analyze();
        await context.close();

        if (results.violations.length > 0) {
          exitCode = 1;
          for (const v of results.violations) {
            console.error(`[${v.id}] ${v.description} (${v.impact})`);
            for (const n of v.nodes.slice(0, 5)) {
              console.error(`  - ${n.html?.slice(0, 120)}`);
            }
            if (v.nodes.length > 5) console.error(`  … +${v.nodes.length - 5} more nodes`);
          }
        } else {
          console.log('No WCAG 2.0 A/AA violations reported by axe.');
        }
      }
    } finally {
      await browser.close();
    }
  } finally {
    preview.kill('SIGTERM');
  }

  process.exit(exitCode);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
