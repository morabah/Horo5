#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const sourceRoots = [
  "web-next/src",
  "web-next/public/images/proof",
  "medusa-backend/src",
  "medusa-backend/scripts",
  "shopify-theme/assets",
  "shopify-theme/config",
  "shopify-theme/layout",
  "shopify-theme/locales",
  "shopify-theme/sections",
  "shopify-theme/snippets",
  "shopify-theme/templates",
];

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".liquid",
  ".mjs",
  ".svg",
  ".ts",
  ".tsx",
]);

function rel(file) {
  return path.relative(root, file);
}

function read(relativeFile) {
  return fs.readFileSync(path.join(root, relativeFile), "utf8");
}

function fail(message) {
  failures.push(message);
}

function assertContains(file, needle, message) {
  if (!read(file).includes(needle)) {
    fail(`${file}: ${message}`);
  }
}

function assertMatches(file, pattern, message) {
  if (!pattern.test(read(file))) {
    fail(`${file}: ${message}`);
  }
}

function walk(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];

  const files = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "dist") {
      continue;
    }

    const fullPath = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(rel(fullPath)));
      continue;
    }

    if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function lineFor(content, index) {
  return content.slice(0, index).split("\n").length;
}

const bannedPublicPatterns = [
  { pattern: /Feel You What Wear/i, label: "reversed public brand line" },
  { pattern: /Wear What You Mean/i, label: "internal mantra used as public copy" },
  { pattern: /Find the mood you wear/i, label: "pre-V1.6 shop-by-feeling phrase" },
  { pattern: /moods,\s*moments/i, label: "pre-V1.6 hero/about phrase" },
  { pattern: /Avenir Next/i, label: "non-V1.6 font stack" },
  { pattern: /Cormorant Garamond/i, label: "non-V1.6 font stack" },
  { pattern: /#e8593c/i, label: "pre-V1.6 coral CTA color" },
];

for (const file of sourceRoots.flatMap(walk)) {
  const content = fs.readFileSync(file, "utf8");
  for (const { pattern, label } of bannedPublicPatterns) {
    const match = pattern.exec(content);
    if (match) {
      fail(`${rel(file)}:${lineFor(content, match.index)}: ${label}`);
    }
  }
}

assertContains(
  "web-next/src/storefront/data/brand.ts",
  "Wear What You Feel |",
  "public brand line must use Wear What You Feel.",
);

assertMatches(
  "web-next/src/app/layout.tsx",
  /fonts\.googleapis\.com\/css2\?family=Inter:[^"]+family=Space\+Grotesk/,
  "must load Inter and Space Grotesk.",
);
assertContains(
  "web-next/next.config.ts",
  "https://fonts.googleapis.com",
  "CSP must allow Google font styles.",
);
assertContains(
  "web-next/next.config.ts",
  "https://fonts.gstatic.com",
  "CSP must allow Google font files.",
);

for (const file of [
  "web-next/src/storefront/index.css",
  "web-next/src/storefront/styles/global.css",
  "shopify-theme/assets/horo-tokens.css",
  "shopify-theme/assets/component-horo-visual-system.css",
  "shopify-theme/config/settings_schema.json",
]) {
  assertContains(file, "Space Grotesk", "must expose the V1.6 heading font.");
  assertContains(file, "Inter", "must expose the V1.6 body font.");
  assertMatches(file, /#7a1f2b/i, "must expose the V1.6 burgundy anchor color.");
}

assertMatches(
  "shopify-theme/layout/theme.liquid",
  /family=Inter:[^"]+family=Space\+Grotesk/,
  "Shopify theme must load Inter and Space Grotesk.",
);

const homepageDefaults = read("medusa-backend/src/lib/homepage-sections/defaults.ts");
for (const key of [
  "hero",
  "trust_ribbon",
  "primary_routes",
  "founding_drop",
  "featured_piece",
  "feeling_grid",
  "gift_block",
  "why_horo",
  "artist_spotlight",
  "seen_on_you",
]) {
  if (!homepageDefaults.includes(`key: "${key}"`)) {
    fail(`medusa-backend/src/lib/homepage-sections/defaults.ts: missing homepage section "${key}".`);
  }
}
if (!homepageDefaults.includes("trustStripItems")) {
  fail("medusa-backend/src/lib/homepage-sections/defaults.ts: missing trust strip payload.");
}

for (const file of [
  "web-next/src/storefront/i18n/dictionary.ts",
  "shopify-theme/templates/page.faq-horo.json",
]) {
  const content = read(file).toLowerCase();
  for (const keyword of ["size", "print", "care", "cod", "delivery", "exchange", "gift", "return"]) {
    if (!content.includes(keyword)) {
      fail(`${file}: FAQ/commercial copy missing "${keyword}".`);
    }
  }
}

const productTemplate = JSON.parse(read("shopify-theme/templates/product.json"));
const productOrder = productTemplate.order || [];
for (const section of [
  "product_trust_strip",
  "product_delivery_payment",
  "product_gift_wrap_upsell",
  "product_size_guide",
  "product_proof_strip",
  "product_artist_card",
]) {
  if (!productOrder.includes(section)) {
    fail(`shopify-theme/templates/product.json: missing PDP section "${section}".`);
  }
}
if (productOrder.indexOf("product_delivery_payment") > productOrder.indexOf("product_story")) {
  fail("shopify-theme/templates/product.json: delivery/payment proof must appear before product story.");
}

const confirmationEmail = read("medusa-backend/src/lib/order-confirmation-email.ts").toLowerCase();
for (const keyword of ["care and next step", "wash inside out", "review", "repost permission"]) {
  if (!confirmationEmail.includes(keyword)) {
    fail(`medusa-backend/src/lib/order-confirmation-email.ts: missing post-purchase "${keyword}" copy.`);
  }
}

for (const file of [
  "shopify-theme/config/settings_data.json",
  "shopify-theme/config/settings_schema.json",
  "shopify-theme/locales/en.default.json",
  "shopify-theme/templates/index.json",
  "shopify-theme/templates/product.json",
  "shopify-theme/templates/page.faq-horo.json",
  "shopify-theme/templates/page.about-horo.json",
  "shopify-theme/templates/collection.json",
]) {
  try {
    JSON.parse(read(file));
  } catch (error) {
    fail(`${file}: invalid JSON (${error.message}).`);
  }
}

if (failures.length > 0) {
  console.error("HORO V1.6 visual compliance check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("HORO V1.6 visual compliance check passed.");
