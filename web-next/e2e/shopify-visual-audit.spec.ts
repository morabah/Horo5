import { test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const store = process.env.SHOPIFY_STORE_URL || 'https://horo-9109.myshopify.com';
const password = process.env.SHOPIFY_STORE_PASSWORD || '';
const outDir = path.join(__dirname, '../../shopify-theme/.visual-audit');

test.describe.configure({ mode: 'serial' });

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

async function unlock(page: import('@playwright/test').Page) {
  await page.goto(store, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const pwd = page.locator('input[type="password"]').first();
  if (await pwd.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await pwd.fill(password);
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  }
}

test('shopify storefront visual audit', async ({ page }) => {
  test.skip(!password, 'Set SHOPIFY_STORE_PASSWORD');

  fs.mkdirSync(outDir, { recursive: true });

  await unlock(page);
  await page.screenshot({ path: path.join(outDir, '01-home-mobile-en.png'), fullPage: true });

  await page.goto(`${store}/collections/all`, { waitUntil: 'domcontentloaded' });
  await unlock(page);
  const html = await page.content();
  const handleMatch = html.match(/\/products\/([a-z0-9-]+)/i);
  if (handleMatch) {
    await page.goto(`${store}/products/${handleMatch[1]}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '02-pdp-mobile-en.png'), fullPage: true });
    const trustText = await page
      .locator('.trust-strip__label, .product-purchase-context__chip--trust, .delivery-payment__title')
      .allTextContents();
    console.log('PDP handle:', handleMatch[1]);
    console.log('Trust copy on PDP:', trustText.join(' | '));
  }

  await page.goto(`${store}/ar`, { waitUntil: 'domcontentloaded' });
  await unlock(page);
  await page.screenshot({ path: path.join(outDir, '03-home-mobile-ar.png'), fullPage: true });
});
