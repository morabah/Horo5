#!/usr/bin/env node
/**
 * HORO Performance Audit
 * Checks JS/CSS bundle sizes, image lazy-loading coverage, and render-blocking resources.
 * Run from shopify-theme/: node scripts/check-performance.mjs
 */
import fs from 'fs';
import path from 'path';

const assetsDir = path.resolve(process.cwd(), 'assets');
const snippetsDir = path.resolve(process.cwd(), 'snippets');
const sectionsDir = path.resolve(process.cwd(), 'sections');
const layoutDir = path.resolve(process.cwd(), 'layout');

const JS_SIZE_WARN = 30 * 1024;  // 30 KB
const JS_SIZE_FAIL = 100 * 1024; // 100 KB
const CSS_SIZE_WARN = 20 * 1024; // 20 KB
const CSS_SIZE_FAIL = 50 * 1024; // 50 KB
const DAWN_BASELINE_CSS = new Set([
  // Dawn v15 core stylesheets are intentionally preserved by HORO_THEME_BASE.md.
  // They are tracked as baseline warnings so HORO parity work does not rewrite
  // protected Dawn files just to satisfy a size heuristic.
  'base.css',
  'component-facets.css',
  'section-main-product.css',
]);
const DAWN_BASELINE_FILES = new Set([
  // Dawn/core Liquid is kept native-first. HORO-owned loading policy is checked
  // separately so baseline media decisions do not block Shopify parity work.
  'card-product.liquid',
  'cart-drawer.liquid',
  'cart-icon-bubble.liquid',
  'cart-live-region-text.liquid',
  'cart-notification-button.liquid',
  'cart-notification-product.liquid',
  'cart-notification.liquid',
  'collage.liquid',
  'collapsible-content.liquid',
  'facets.liquid',
  'featured-product.liquid',
  'main-article.liquid',
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
  'video.liquid',
]);

let warnings = 0;
let errors = 0;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function checkFileSizes() {
  console.log('\n📦 Asset bundle sizes\n');
  const files = fs.readdirSync(assetsDir);
  const jsFiles = files.filter((f) => f.endsWith('.js'));
  const cssFiles = files.filter((f) => f.endsWith('.css'));

  for (const file of jsFiles) {
    const stats = fs.statSync(path.join(assetsDir, file));
    const size = stats.size;
    const label = size > JS_SIZE_FAIL ? '❌' : size > JS_SIZE_WARN ? '⚠️' : '✅';
    const msg = `  ${label} ${file}: ${formatBytes(size)}`;
    console.log(msg);
    if (size > JS_SIZE_FAIL) errors++;
    else if (size > JS_SIZE_WARN) warnings++;
  }

  for (const file of cssFiles) {
    const stats = fs.statSync(path.join(assetsDir, file));
    const size = stats.size;
    const isDawnBaseline = DAWN_BASELINE_CSS.has(file);
    const label = size > CSS_SIZE_FAIL && !isDawnBaseline ? '❌' : size > CSS_SIZE_WARN ? '⚠️' : '✅';
    const msg = `  ${label} ${file}: ${formatBytes(size)}`;
    console.log(msg);
    if (size > CSS_SIZE_FAIL && !isDawnBaseline) errors++;
    else if (size > CSS_SIZE_WARN) warnings++;
    if (size > CSS_SIZE_FAIL && isDawnBaseline) {
      console.log(`    Baseline exception: protected Dawn stylesheet, not a HORO parity regression.`);
    }
  }
}

function checkLazyLoadImages() {
  console.log('\n🖼️  Image lazy-loading coverage\n');
  const liquidFiles = [...walkDir(snippetsDir), ...walkDir(sectionsDir), ...walkDir(layoutDir)];
  let imageTags = 0;
  let lazyLoaded = 0;
  let missingLazy = [];
  let horoImageTags = 0;
  let horoLazyOrIntentionalEager = 0;
  let horoMissingLoading = [];

  for (const file of liquidFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const tagMatches = content.matchAll(/\| image_tag:/g);
    const horoOwned = isHoroOwnedFile(file);
    for (const match of tagMatches) {
      imageTags++;
      // Check context after the image_tag for loading: 'lazy'
      const context = content.slice(match.index, match.index + 300);
      const hasLazy = context.includes("loading: 'lazy'");
      const hasIntentionalEager = context.includes("loading: 'eager'") || context.includes("fetchpriority: 'high'");
      if (context.includes("loading: 'lazy'")) {
        lazyLoaded++;
      } else {
        const fileName = path.basename(file);
        if (!missingLazy.includes(fileName)) {
          missingLazy.push(fileName);
        }
      }
      if (horoOwned) {
        horoImageTags++;
        if (hasLazy || hasIntentionalEager) {
          horoLazyOrIntentionalEager++;
        } else {
          const fileName = path.basename(file);
          if (!horoMissingLoading.includes(fileName)) {
            horoMissingLoading.push(fileName);
          }
        }
      }
    }
  }

  const pct = imageTags > 0 ? Math.round((lazyLoaded / imageTags) * 100) : 0;
  const horoPct = horoImageTags > 0 ? Math.round((horoLazyOrIntentionalEager / horoImageTags) * 100) : 100;
  const horoLabel = horoPct >= 95 ? '✅' : horoPct >= 80 ? '⚠️' : '❌';
  console.log(`  ${horoLabel} HORO-owned images: ${horoLazyOrIntentionalEager}/${horoImageTags} declare lazy loading or intentional eager priority (${horoPct}%)`);
  console.log(`  ℹ️  Full theme baseline: ${lazyLoaded}/${imageTags} image tags use lazy loading (${pct}%). Dawn/core eager media is reported for visibility, not failed here.`);
  if (horoMissingLoading.length > 0 && horoPct < 95) {
    console.log(`  ⚠️  HORO-owned files missing loading policy: ${horoMissingLoading.slice(0, 5).join(', ')}${horoMissingLoading.length > 5 ? '...' : ''}`);
    warnings++;
  }
}

function checkRenderBlocking() {
  console.log('\n⏳ Render-blocking resource audit\n');
  const themeLiquid = path.join(layoutDir, 'theme.liquid');
  const content = fs.readFileSync(themeLiquid, 'utf-8');

  // Count synchronous stylesheet_tag vs async link rel=stylesheet
  const syncStyles = [...content.matchAll(/\{\{ '.+\.css' \| asset_url \| stylesheet_tag \}\}/g)];
  const asyncStyles = [...content.matchAll(/<link rel="stylesheet"[^>]*media="print"[^>]*>/g)];

  console.log(`  ${syncStyles.length} synchronous CSS files (stylesheet_tag)`);
  console.log(`  ${asyncStyles.length} async CSS files (media="print" onload)`);

  if (syncStyles.length > 15) {
    console.log(`  ⚠️  ${syncStyles.length} sync stylesheets may delay FCP. Consider async for non-critical CSS.`);
    warnings++;
  }

  // Check for defer/async on scripts
  const syncScripts = [...content.matchAll(/<script[^>]*src="[^"]+"[^>]*>(?![\s\S]*?defer)(?![\s\S]*?async)/g)];
  const deferredScripts = [...content.matchAll(/<script[^>]*defer[^>]*>/g)];

  console.log(`  ${syncScripts.length} sync scripts in <head>`);
  console.log(`  ${deferredScripts.length} deferred scripts`);

  if (syncScripts.length > 3) {
    console.log(`  ⚠️  ${syncScripts.length} sync scripts may block rendering. Consider deferring non-critical JS.`);
    warnings++;
  }
}

function checkUnusedCss() {
  console.log('\n🧹 CSS selector coverage (approximate)\n');
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css') && f.startsWith('component-'));
  let totalSelectors = 0;
  let componentFiles = 0;

  for (const file of cssFiles) {
    const content = fs.readFileSync(path.join(assetsDir, file), 'utf-8');
    const selectors = [...content.matchAll(/[.#][a-zA-Z_-][a-zA-Z0-9_-]*/g)];
    const count = selectors.length;
    totalSelectors += count;
    componentFiles++;
  }

  console.log(`  ${componentFiles} component CSS files with ~${totalSelectors} total selectors`);
}

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (entry.name.endsWith('.liquid')) {
      results.push(fullPath);
    }
  }
  return results;
}

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

// Run checks
console.log('🔍 HORO Performance Audit');
checkFileSizes();
checkLazyLoadImages();
checkRenderBlocking();
checkUnusedCss();

console.log(`\n📊 Summary: ${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors > 0 ? 1 : 0);
