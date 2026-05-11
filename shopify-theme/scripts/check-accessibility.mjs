#!/usr/bin/env node
/**
 * HORO Accessibility Audit
 * Checks Liquid/CSS for common WCAG 2.1 AA issues.
 * Run from shopify-theme/: node scripts/check-accessibility.mjs
 */
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve(process.cwd(), 'assets');
const snippetsDir = path.resolve(process.cwd(), 'snippets');
const sectionsDir = path.resolve(process.cwd(), 'sections');
const layoutDir = path.resolve(process.cwd(), 'layout');

let errors = 0;
let warnings = 0;

const DAWN_BASELINE_FILES = new Set([
  'card-product.liquid',
  'cart-drawer.liquid',
  'cart-icon-bubble.liquid',
  'cart-live-region-text.liquid',
  'cart-notification-button.liquid',
  'cart-notification-product.liquid',
  'cart-notification.liquid',
  'facets.liquid',
  'main-cart-footer.liquid',
  'main-cart-items.liquid',
  'main-product.liquid',
  'price.liquid',
  'product-media-gallery.liquid',
  'product-media-modal.liquid',
  'product-media.liquid',
  'product-thumbnail.liquid',
  'product-variant-options.liquid',
  'product-variant-picker.liquid',
]);

function isHoroOwnedFile(file) {
  const name = path.basename(file);
  if (DAWN_BASELINE_FILES.has(name)) return false;
  return (
    name.startsWith('horo-') ||
    name.startsWith('component-horo-') ||
    name.startsWith('component-home-') ||
    name.startsWith('product-') ||
    name.startsWith('cart-') ||
    name.startsWith('page-') ||
    name.includes('feeling') ||
    name.includes('occasion') ||
    name.includes('gift') ||
    name.includes('search-support')
  );
}

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.liquid') || entry.name.endsWith('.css')) {
      results.push(fullPath);
    }
  }
  return results;
}

function checkFocusVisible() {
  console.log('\n🎯 focus-visible states\n');
  const cssFiles = walkDir(assetsDir).filter((f) => f.endsWith('.css'));
  let hasFocusVisible = 0;
  let interactiveRules = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const focusMatches = [...content.matchAll(/:focus-visible|focus-visible/g)];
    hasFocusVisible += focusMatches.length;

    const interactive = [...content.matchAll(/\.button|\.cta|a\b|input\b|select\b|textarea\b/g)];
    interactiveRules += interactive.length;
  }

  const label = hasFocusVisible >= 5 ? '✅' : hasFocusVisible > 0 ? '⚠️' : '❌';
  console.log(`  ${label} ${hasFocusVisible} :focus-visible declarations found`);
  if (hasFocusVisible === 0) {
    console.log('  ❌ No focus-visible styles found. Add :focus-visible outlines for keyboard navigation.');
    errors++;
  } else if (hasFocusVisible < 5) {
    warnings++;
  }
}

function checkAriaLive() {
  console.log('\n🔔 aria-live regions\n');
  const liquidFiles = [...walkDir(snippetsDir), ...walkDir(sectionsDir), ...walkDir(layoutDir)];
  let ariaLiveCount = 0;

  for (const file of liquidFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(/aria-live="[^"]+"/g)];
    ariaLiveCount += matches.length;
  }

  const label = ariaLiveCount >= 2 ? '✅' : ariaLiveCount > 0 ? '⚠️' : '❌';
  console.log(`  ${label} ${ariaLiveCount} aria-live region(s) found`);
  if (ariaLiveCount === 0) {
    console.log('  ⚠️  No aria-live regions found. Consider adding aria-live="polite" to cart drawer and ATC feedback.');
    warnings++;
  }
}

function checkImageAlt() {
  console.log('\n🖼️  Image alt text coverage\n');
  const liquidFiles = [...walkDir(snippetsDir), ...walkDir(sectionsDir), ...walkDir(layoutDir)];
  let imageTags = 0;
  let withAlt = 0;
  let horoImageTags = 0;
  let horoWithAlt = 0;

  for (const file of liquidFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const horoOwned = isHoroOwnedFile(file);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check for image_tag usage - look for `| image_tag:`
      if (line.includes('| image_tag:')) {
        imageTags++;
        if (horoOwned) horoImageTags++;
        // Check next 8 lines for alt: parameter
        const context = lines.slice(i, Math.min(i + 8, lines.length)).join('\n');
        if (context.includes('alt:')) {
          withAlt++;
          if (horoOwned) horoWithAlt++;
        } else if (line.includes('.alt') || line.includes('image.alt')) {
          // Shopify image objects that pipe their own alt
          withAlt++;
          if (horoOwned) horoWithAlt++;
        }
      }
    }
  }

  const pct = imageTags > 0 ? Math.round((withAlt / imageTags) * 100) : 0;
  const horoPct = horoImageTags > 0 ? Math.round((horoWithAlt / horoImageTags) * 100) : 100;
  const label = horoPct >= 95 ? '✅' : horoPct >= 70 ? '⚠️' : '❌';
  console.log(`  ${label} HORO-owned image tags: ${horoWithAlt}/${horoImageTags} have alt text (${horoPct}%)`);
  console.log(`  ℹ️  Full theme baseline: ${withAlt}/${imageTags} image tags have alt text (${pct}%). Dawn baseline files are reported for visibility, not failed here.`);
  if (horoPct < 70) warnings++;
  else if (horoPct < 95) warnings++;
}

function checkSvgAria() {
  console.log('\n📐 SVG accessibility\n');
  const liquidFiles = [...walkDir(snippetsDir), ...walkDir(sectionsDir), ...walkDir(layoutDir)];
  let svgCount = 0;
  let withAriaHidden = 0;
  let horoSvgCount = 0;
  let horoWithAriaHidden = 0;

  for (const file of liquidFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const svgMatches = [...content.matchAll(/<svg[\s\S]*?>/g)];
    const horoOwned = isHoroOwnedFile(file);
    for (const match of svgMatches) {
      const parentContext = content.slice(Math.max(0, match.index - 180), match.index);
      const hasA11yMarker =
        match[0].includes('aria-hidden') ||
        match[0].includes('role="img"') ||
        match[0].includes('<title>') ||
        parentContext.includes('aria-hidden="true"');
      svgCount++;
      if (hasA11yMarker) {
        withAriaHidden++;
        if (horoOwned) horoWithAriaHidden++;
      }
      if (horoOwned) horoSvgCount++;
    }
  }

  const pct = svgCount > 0 ? Math.round((withAriaHidden / svgCount) * 100) : 0;
  const horoPct = horoSvgCount > 0 ? Math.round((horoWithAriaHidden / horoSvgCount) * 100) : 100;
  const label = horoPct >= 90 ? '✅' : horoPct >= 70 ? '⚠️' : '❌';
  console.log(`  ${label} HORO-owned SVGs: ${horoWithAriaHidden}/${horoSvgCount} have aria-hidden or role (${horoPct}%)`);
  console.log(`  ℹ️  Full theme baseline: ${withAriaHidden}/${svgCount} SVGs have aria-hidden or role (${pct}%). Dawn baseline files are reported for visibility, not failed here.`);
  if (horoPct < 70) warnings++;
}

function checkTouchTargets() {
  console.log('\n👆 Touch target sizes (already covered by check-mobile-audit.mjs)\n');
  console.log('  ℹ️  Run: node scripts/check-mobile-audit.mjs');
}

function checkColorContrast() {
  console.log('\n🎨 Color contrast hints\n');
  const cssFiles = walkDir(assetsDir).filter((f) => f.endsWith('.css'));
  let lowOpacityText = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = [...content.matchAll(/opacity\s*:\s*0\.([0-4])\d*/g)];
    lowOpacityText += matches.length;
  }

  const label = lowOpacityText === 0 ? '✅' : '⚠️';
  console.log(`  ${label} ${lowOpacityText} opacity values below 0.5 found`);
  if (lowOpacityText > 0) {
    console.log('  ⚠️  Ensure text with reduced opacity still meets WCAG AA contrast (4.5:1).');
    warnings++;
  }
}

function checkSkipLink() {
  console.log('\n🔗 Skip-to-content link\n');
  const themeLiquid = path.join(layoutDir, 'theme.liquid');
  const content = fs.readFileSync(themeLiquid, 'utf-8');
  const hasSkipLink = content.includes('skip-to-content') || content.includes('Skip to content');
  const label = hasSkipLink ? '✅' : '❌';
  console.log(`  ${label} Skip-to-content link present`);
  if (!hasSkipLink) {
    console.log('  ❌ Add a skip-to-content link as the first focusable element in theme.liquid.');
    errors++;
  }
}

function checkLangAttribute() {
  console.log('\n🌐 Language attribute\n');
  const themeLiquid = path.join(layoutDir, 'theme.liquid');
  const content = fs.readFileSync(themeLiquid, 'utf-8');
  const hasLang = content.includes('<html lang=') || content.includes('lang="{{');
  const label = hasLang ? '✅' : '❌';
  console.log(`  ${label} lang attribute on <html>`);
  if (!hasLang) {
    console.log('  ❌ Ensure <html> has a lang attribute matching the current locale.');
    errors++;
  }
}

// Run checks
console.log('♿ HORO Accessibility Audit (WCAG 2.1 AA checklist)');
checkSkipLink();
checkLangAttribute();
checkFocusVisible();
checkAriaLive();
checkImageAlt();
checkSvgAria();
checkTouchTargets();
checkColorContrast();

console.log(`\n📊 Summary: ${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors > 0 ? 1 : 0);
