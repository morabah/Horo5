#!/usr/bin/env node
/**
 * Brand slot contract: fail if banned storefront image filenames appear under public/images
 * or in configured source files (§3.4 guardrail).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webNextDir = path.resolve(__dirname, "..");
const publicImagesDir = path.join(webNextDir, "public", "images");

/** AI batch filenames like emotions_vibe_1_1774374034307.png */
const TIMESTAMP_VIBE_PNG = /_vibe_\d+_\d{13}\.png$/i;
const BANNED_IN_SOURCE =
  /\/images\/(?:tees|hero)\/[^"'\s]*(?:_177437\d+\.png|hero-model\.png)/;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

const violations = [];

for (const f of walkFiles(publicImagesDir)) {
  const base = path.basename(f);
  if (TIMESTAMP_VIBE_PNG.test(base)) {
    violations.push(`public/images: banned filename pattern: ${path.relative(webNextDir, f)}`);
  }
}

const SOURCE_FILES_TO_SCAN = [
  path.join(webNextDir, "src/storefront/data/images.ts"),
  path.join(webNextDir, "../medusa-backend/src/scripts/data/feelings-taxonomy-data.ts"),
  path.join(webNextDir, "../medusa-backend/src/scripts/data/legacy-product-media.ts"),
];

for (const file of SOURCE_FILES_TO_SCAN) {
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (!BANNED_IN_SOURCE.test(line)) return;
    violations.push(`${path.relative(webNextDir, file)}:${i + 1}: references banned asset path`);
  });
}

if (violations.length > 0) {
  console.error("[audit:images] FAILED\n", violations.join("\n"));
  process.exit(1);
}

console.log("[audit:images] OK — no banned storefront image patterns found.");
