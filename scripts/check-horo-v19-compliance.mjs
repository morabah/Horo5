#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

const sourceRoots = [
  "web-next/src",
  "web-next/public/images/proof",
  "web-next/public/images/cart",
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

const marketingCopyFiles = [
  "web-next/src/storefront/content/page-heroes.ts",
  "web-next/src/storefront/i18n/dictionary.ts",
  "web-next/src/storefront/seo/constants.ts",
  "web-next/src/storefront/seo/routeMeta.ts",
  "medusa-backend/src/lib/homepage-sections/defaults.ts",
  "shopify-theme/locales/en.default.json",
  "shopify-theme/locales/ar.json",
];

const checkoutExemptPaths = [
  "web-next/src/storefront/pages/Checkout.tsx",
  "web-next/src/storefront/pages/OrderConfirmation.tsx",
  "web-next/src/app/internal/",
  "medusa-backend/src/api/",
  "medusa-backend/src/subscribers/",
  "medusa-backend/src/workflows/",
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

function isCheckoutExempt(filePath) {
  const normalized = rel(filePath).replaceAll("\\", "/");
  return checkoutExemptPaths.some((prefix) => normalized.includes(prefix.replaceAll("\\", "/")));
}

const bannedPublicPatterns = [
  { pattern: /Feel You What Wear/i, label: "reversed public brand line" },
  { pattern: /Wear What You Mean/i, label: "internal mantra used as public copy" },
  { pattern: /Find the mood you wear/i, label: "pre-V1.6 shop-by-feeling phrase" },
  { pattern: /Find the feeling you wear/i, label: "pre-V1.9 shop-by-feeling phrase" },
  { pattern: /#e8593c/i, label: "pre-V1.6 coral CTA color" },
  { pattern: /#7a1f2b/i, label: "pre-V1.9 burgundy anchor color" },
  { pattern: /rgba\(232,\s*89,\s*60/i, label: "pre-V1.6 coral rgba accent" },
];

for (const file of sourceRoots.flatMap(walk)) {
  if (isCheckoutExempt(file)) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const { pattern, label } of bannedPublicPatterns) {
    const match = pattern.exec(content);
    if (match) {
      fail(`${rel(file)}:${lineFor(content, match.index)}: ${label}`);
    }
  }
}

const bannedMarketingCodPatterns = [
  { pattern: /COD available/i, label: "unconditional COD available claim" },
  { pattern: /Printed in Egypt · COD/i, label: "hero COD shorthand" },
  { pattern: /Cash on delivery \(COD\) is available/i, label: "unconditional FAQ COD claim" },
  { pattern: /COD-friendly/i, label: "COD-friendly marketing claim" },
];

for (const file of marketingCopyFiles) {
  const content = read(file);
  for (const { pattern, label } of bannedMarketingCodPatterns) {
    const match = pattern.exec(content);
    if (match) {
      fail(`${file}:${lineFor(content, match.index)}: ${label}`);
    }
  }
}

assertContains(
  "web-next/src/storefront/brand/horo-v19.ts",
  "HORO_V19_COLORS",
  "V1.9 brand constants file must export HORO_V19_COLORS.",
);

assertContains(
  "web-next/src/storefront/brand/horo-v19.ts",
  "Wear What You Feel",
  "public brand line must use Wear What You Feel.",
);

assertContains(
  "web-next/src/storefront/data/visual-readiness.ts",
  "paid-media destination",
  "visual readiness must document placeholder policy.",
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

const v19TokenFiles = [
  "web-next/src/storefront/index.css",
  "web-next/src/storefront/styles/global.css",
  "shopify-theme/assets/horo-tokens.css",
];

for (const file of v19TokenFiles) {
  assertContains(file, "Space Grotesk", "must expose Space Grotesk heading font.");
  assertContains(file, "Inter", "must expose Inter body font.");
  assertMatches(file, /#4[fF]111[fF]/, "must expose V1.9 Root color.");
  assertMatches(file, /#FEE5E2/i, "must expose V1.9 Breath color.");
  assertMatches(file, /#8[Cc]2340/, "must expose V1.9 Pulse color.");
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
if (!homepageDefaults.includes("soundbite_en")) {
  fail("medusa-backend/src/lib/homepage-sections/defaults.ts: missing V1.9 hero soundbite payload.");
}
if (!homepageDefaults.includes("Payment options shown at checkout")) {
  fail("medusa-backend/src/lib/homepage-sections/defaults.ts: missing V1.9 payment trust copy.");
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
  console.error("HORO V1.9 compliance check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("HORO V1.9 compliance check passed.");
