#!/usr/bin/env node
/**
 * Capture storefront screenshots after password entry.
 * Usage:
 *   SHOPIFY_STORE_PASSWORD=yourpass node scripts/visual-storefront-audit.mjs
 *   SHOPIFY_STORE_PASSWORD=yourpass node scripts/visual-storefront-audit.mjs --product-handle=my-product
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '.visual-audit');
const store = process.env.SHOPIFY_STORE_URL || 'https://horo-9109.myshopify.com';
const password = process.env.SHOPIFY_STORE_PASSWORD || process.env.STORE_PASSWORD || '';
const productHandle =
  process.argv.find((a) => a.startsWith('--product-handle='))?.split('=')[1] || '';

if (!password) {
  console.error('Set SHOPIFY_STORE_PASSWORD (storefront password from Admin → Online Store → Preferences).');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

async function unlockStore(page) {
  await page.goto(store, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await pwd.fill(password);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  }
}

async function shot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log('Wrote', file);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    locale: 'en-US',
  });
  const page = await context.newPage();

  await unlockStore(page);
  await shot(page, '01-home-mobile-en');

  if (productHandle) {
    await page.goto(`${store}/products/${productHandle}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await shot(page, '02-pdp-mobile-en');
  } else {
    const productLink = page.locator('a[href*="/products/"]').first();
    if (await productLink.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await productLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      await shot(page, '02-pdp-mobile-en-first-product');
    }
  }

  await page.goto(`${store}/ar`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await unlockStore(page);
  await shot(page, '03-home-mobile-ar');

  await browser.close();
  console.log(`\nScreenshots in ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
