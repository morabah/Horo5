#!/usr/bin/env node
/**
 * Task-based smoke checks (first-buy path, proof sections, compact home).
 * Run: npm run build && npm run test:e2e
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4174;
const BASE = `http://localhost:${PORT}`;
const DIST_INDEX = path.join(webRoot, 'dist', 'index.html');

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

async function assert(cond, message) {
  if (!cond) throw new Error(message);
}

async function runTaskChecks(page) {
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.getByRole('link', { name: /shop by feeling/i }).first().click();
  await page.waitForURL(/\/feelings\/?$/, { timeout: 30000 });
  await assert(page.url().includes('/feelings'), 'Expected /feelings after Shop by feeling');

  await page.goto(`${BASE}/feelings/soft-quiet`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#feeling-proof', { timeout: 30000 });
  await assert((await page.locator('#feeling-proof').count()) === 1, 'Feeling collection should expose #feeling-proof');

  await page.goto(`${BASE}/products/the-weight-of-light`, { waitUntil: 'load', timeout: 60000 });
  const pdpCta = page.getByRole('button', { name: /add to bag|choose size/i });
  await pdpCta.first().waitFor({ state: 'visible', timeout: 30000 });
  await assert((await pdpCta.count()) >= 1, 'PDP should show add-to-bag or choose-size CTA');

  await page.goto(`${BASE}/occasions/gift-something-real`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#occasion-proof', { timeout: 30000 });
  await assert((await page.locator('#occasion-proof').count()) === 1, 'Occasion collection should expose #occasion-proof');

  await page.goto(`${BASE}/?compact=1`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForSelector('#home-hero', { timeout: 30000 });
  const feelingLine = page.getByText(/nothing says what you/i);
  await assert((await feelingLine.count()) === 0, 'Compact home should omit the feeling explosion copy');
}

async function main() {
  if (!fs.existsSync(DIST_INDEX)) {
    console.error('test-e2e-tasks: dist/ missing. Run: npm run build');
    process.exit(1);
  }

  const preview = spawn('npm', ['run', 'preview:e2e'], {
    cwd: webRoot,
    stdio: 'inherit',
    shell: true,
  });

  let exitCode = 0;

  try {
    await waitForServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();
      await runTaskChecks(page);
      console.log('\ntest-e2e-tasks: all checks passed.\n');
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error(err);
    exitCode = 1;
  } finally {
    preview.kill('SIGTERM');
  }

  process.exit(exitCode);
}

main();
