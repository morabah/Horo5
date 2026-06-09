#!/usr/bin/env node
import { chromium } from 'playwright';

const url = process.argv[2] || 'https://horo-9109.myshopify.com/';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);

  const report = await page.evaluate(() => {
    const pick = (sel) => document.querySelector(sel);
    const style = (el) =>
      el
        ? {
            tag: el.tagName,
            className: String(el.className).slice(0, 120),
            pointerEvents: getComputedStyle(el).pointerEvents,
            opacity: getComputedStyle(el).opacity,
            cursor: getComputedStyle(el).cursor,
            ariaDisabled: el.getAttribute('aria-disabled'),
            disabled: el.hasAttribute('disabled'),
            href: el.getAttribute('href'),
          }
        : null;

    const grain = pick('.home-grain');
    const heroCta = pick('.home-hero__cta, .home-btn--primary, .button');
    const foundingCta = pick('.home-founding-card__cta');
    const midY = Math.floor(window.innerHeight * 0.75);
    const midX = Math.floor(window.innerWidth / 2);
    const topAtMid = document.elementFromPoint(midX, midY);

    return {
      grain: grain
        ? { pointerEvents: getComputedStyle(grain).pointerEvents, childCount: grain.children.length }
        : null,
      heroCta: style(heroCta),
      foundingCta: style(foundingCta),
      elementAt75vh: topAtMid
        ? {
            tag: topAtMid.tagName,
            id: topAtMid.id,
            className: String(topAtMid.className).slice(0, 120),
            pointerEvents: getComputedStyle(topAtMid).pointerEvents,
          }
        : null,
      bodyOverflow: getComputedStyle(document.body).overflow,
      drawerOpen: !!document.querySelector('.horo-drawer-wrapper.is-open'),
      cartDrawerActive: !!document.querySelector('cart-drawer.drawer.active'),
    };
  });

  console.log(JSON.stringify(report, null, 2));

  const hero = page.locator('.home-hero__cta, .home-hero .home-btn--primary').first();
  if ((await hero.count()) > 0) {
    const before = page.url();
    await hero.click({ timeout: 5000 }).catch((e) => console.log('HERO_CLICK_ERROR:', e.message));
    await page.waitForTimeout(1000);
    console.log('AFTER_HERO_CLICK_URL:', page.url(), 'changed:', page.url() !== before);
  }
} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}
