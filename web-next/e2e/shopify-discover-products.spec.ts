import { test, expect } from '@playwright/test';

const store = process.env.SHOPIFY_STORE_URL || 'https://horo-9109.myshopify.com';
const password = process.env.SHOPIFY_STORE_PASSWORD || '';

test('discover product handles', async ({ page }) => {
  test.skip(!password, 'password required');
  await page.goto(store);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"], input[type="submit"]').first().click();
  await page.waitForLoadState('networkidle').catch(() => {});

  for (const url of ['/collections/all', '/collections/feeling-mood', '/']) {
    await page.goto(`${store}${url}`);
    const count = await page.locator('a[href*="/products/"]').count();
    console.log(url, 'product links:', count);
  }

  const html = await page.content();
  const handles = [...new Set([...html.matchAll(/\/products\/([a-z0-9-]+)/gi)].map((m) => m[1]))];
  console.log('handles:', handles.slice(0, 10).join(', ') || '(none)');
  expect(handles.length, 'need at least one published product for PDP audit').toBeGreaterThan(0);
});
