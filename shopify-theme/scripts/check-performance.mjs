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
    const label = size > CSS_SIZE_FAIL ? '❌' : size > CSS_SIZE_WARN ? '⚠️' : '✅';
    const msg = `  ${label} ${file}: ${formatBytes(size)}`;
    console.log(msg);
    if (size > CSS_SIZE_FAIL) errors++;
    else if (size > CSS_SIZE_WARN) warnings++;
  }
}

function checkLazyLoadImages() {
  console.log('\n🖼️  Image lazy-loading coverage\n');
  const liquidFiles = [...walkDir(snippetsDir), ...walkDir(sectionsDir), ...walkDir(layoutDir)];
  let imageTags = 0;
  let lazyLoaded = 0;
  let missingLazy = [];

  for (const file of liquidFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const tagMatches = content.matchAll(/\| image_tag:/g);
    for (const match of tagMatches) {
      imageTags++;
      // Check context after the image_tag for loading: 'lazy'
      const context = content.slice(match.index, match.index + 300);
      if (context.includes("loading: 'lazy'")) {
        lazyLoaded++;
      } else {
        const fileName = path.basename(file);
        if (!missingLazy.includes(fileName)) {
          missingLazy.push(fileName);
        }
      }
    }
  }

  const pct = imageTags > 0 ? Math.round((lazyLoaded / imageTags) * 100) : 0;
  const label = pct >= 80 ? '✅' : pct >= 50 ? '⚠️' : '❌';
  console.log(`  ${label} ${lazyLoaded}/${imageTags} image tags use lazy loading (${pct}%)`);
  if (missingLazy.length > 0 && pct < 80) {
    console.log(`  ⚠️  Files without lazy loading: ${missingLazy.slice(0, 5).join(', ')}${missingLazy.length > 5 ? '...' : ''}`);
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

// Run checks
console.log('🔍 HORO Performance Audit');
checkFileSizes();
checkLazyLoadImages();
checkRenderBlocking();
checkUnusedCss();

console.log(`\n📊 Summary: ${errors} error(s), ${warnings} warning(s)\n`);
process.exit(errors > 0 ? 1 : 0);
