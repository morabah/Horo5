#!/usr/bin/env node
/**
 * Capture full-page screenshots for critical storefront routes (desktop + mobile).
 * Usage: node scripts/capture-critical-screenshots.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '');
const outDir = path.join(
  process.cwd(),
  'screenshots',
  `critical-pages-${new Date().toISOString().slice(0, 10)}`,
);

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const pages = [
  { id: 'home', path: '/' },
  { id: 'products', path: '/products' },
  { id: 'products-zodiac', path: '/products?category=zodiac' },
  { id: 'gifts', path: '/gifts' },
  { id: 'feelings-mood', path: '/feelings/mood' },
  { id: 'pdp', path: '/products/the-weight-of-light' },
  { id: 'cart', path: '/cart' },
  { id: 'about', path: '/about' },
  { id: 'faq', path: '/faq' },
  { id: 'size-guide', path: '/size-guide' },
  { id: 'exchange', path: '/exchange' },
  { id: 'checkout', path: '/checkout' },
];

async function dismissOverlays(page) {
  const consentAccept = page.getByRole('button', { name: /accept|agree|allow|موافق/i });
  if (await consentAccept.isVisible({ timeout: 1500 }).catch(() => false)) {
    await consentAccept.click().catch(() => undefined);
    await page.waitForTimeout(400);
  }
}

async function warmFullPage(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
    const step = Math.max(Math.floor(window.innerHeight * 0.75), 320);
    const maxScroll = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
    ) - window.innerHeight;

    for (let y = 0; y < maxScroll; y += step) {
      window.scrollTo(0, y);
      await wait(90);
    }

    window.scrollTo(0, Math.max(0, maxScroll));
    await wait(180);
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ locale: 'en-US', reducedMotion: 'reduce' });

for (const vp of viewports) {
  const page = await context.newPage();
  await page.setViewportSize({ width: vp.width, height: vp.height });

  for (const route of pages) {
    const url = `${baseUrl}${route.path}`;
    const file = path.join(outDir, `${route.id}--${vp.name}.png`);

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await dismissOverlays(page);
      await page.locator('#main-content').waitFor({ state: 'visible', timeout: 30_000 }).catch(() => undefined);
      await page.waitForTimeout(1200);
      await warmFullPage(page);
      await page.screenshot({ path: file, fullPage: true });
      const status = response?.status() ?? '?';
      console.log(`OK ${status} ${vp.name} ${route.id} -> ${path.relative(process.cwd(), file)}`);
    } catch (error) {
      console.error(`FAIL ${vp.name} ${route.id}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await page.close();
}

await context.close();
await browser.close();

console.log(`\nSaved ${pages.length * viewports.length} screenshots to:\n${outDir}`);
