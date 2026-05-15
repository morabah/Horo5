#!/usr/bin/env node
/**
 * Bundle Size Budget Check
 *
 * Scans .next/static after build and warns/fails if transfer sizes exceed
 * configured budgets. Run after `next build`.
 *
 * The budget gate intentionally checks browser transfer size and largest route
 * payload. Counting every emitted route/lazy chunk as one raw payload makes the
 * total budget meaningless for App Router builds because users never download
 * all route chunks together.
 *
 * Usage:
 *   node scripts/bundle-size-budget.mjs
 *
 * Env overrides:
 *   BUNDLE_BUDGET_JS_KB      default 180 (kilobytes)
 *   BUNDLE_BUDGET_CSS_KB     default 40  (kilobytes)
 *   BUNDLE_BUDGET_TOTAL_KB   default 400 (kilobytes)
 *   BUNDLE_BUDGET_COMPRESSION default gzip (gzip | brotli | raw)
 *   BUNDLE_BUDGET_TOTAL_SCOPE default route (route | all)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webNextDir = path.resolve(__dirname, "..");
const staticDir = path.join(webNextDir, ".next", "static");

const JS_BUDGET_KB = numberEnv("BUNDLE_BUDGET_JS_KB", 180);
const CSS_BUDGET_KB = numberEnv("BUNDLE_BUDGET_CSS_KB", 40);
const TOTAL_BUDGET_KB = numberEnv("BUNDLE_BUDGET_TOTAL_KB", 400);
const COMPRESSION = parseCompression(process.env.BUNDLE_BUDGET_COMPRESSION);
const TOTAL_SCOPE = parseTotalScope(process.env.BUNDLE_BUDGET_TOTAL_SCOPE);

function numberEnv(name, fallback) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function parseCompression(value) {
  const normalized = (value || "gzip").trim().toLowerCase();
  if (normalized === "raw" || normalized === "gzip" || normalized === "brotli") {
    return normalized;
  }
  return "gzip";
}

function parseTotalScope(value) {
  const normalized = (value || "route").trim().toLowerCase();
  if (normalized === "route" || normalized === "all") {
    return normalized;
  }
  return "route";
}

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

function formatKb(bytes) {
  return (bytes / 1024).toFixed(1);
}

function measureBytes(buffer) {
  if (COMPRESSION === "raw") return buffer.length;
  if (COMPRESSION === "brotli") return zlib.brotliCompressSync(buffer).length;
  return zlib.gzipSync(buffer, { level: 9 }).length;
}

const measuredSizeCache = new Map();
const rawSizeCache = new Map();

function readStaticAsset(relativePath) {
  const candidates = [path.join(webNextDir, ".next", relativePath)];

  try {
    const decoded = decodeURIComponent(relativePath);
    if (decoded !== relativePath) {
      candidates.push(path.join(webNextDir, ".next", decoded));
    }
  } catch {
    // Keep the original path if a manifest path is not URI-encoded cleanly.
  }

  const fullPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!fullPath) return null;

  return fs.readFileSync(fullPath);
}

function measuredStaticSize(relativePath) {
  if (!measuredSizeCache.has(relativePath)) {
    const buffer = readStaticAsset(relativePath);
    measuredSizeCache.set(relativePath, buffer ? measureBytes(buffer) : 0);
  }
  return measuredSizeCache.get(relativePath);
}

function rawStaticSize(relativePath) {
  if (!rawSizeCache.has(relativePath)) {
    const buffer = readStaticAsset(relativePath);
    rawSizeCache.set(relativePath, buffer ? buffer.length : 0);
  }
  return rawSizeCache.get(relativePath);
}

function toStaticRelative(filePath) {
  return path.relative(path.join(webNextDir, ".next"), filePath);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function parseClientReferenceManifest(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const match = text.match(/__RSC_MANIFEST\[((?:"(?:\\.|[^"\\])*"))\]=(.*);$/s);
  if (!match) return null;

  try {
    return {
      route: JSON.parse(match[1]),
      manifest: JSON.parse(match[2]),
    };
  } catch {
    return null;
  }
}

function addClientReferenceChunks(files, manifest) {
  for (const moduleRef of Object.values(manifest.clientModules || {})) {
    for (const chunk of moduleRef.chunks || []) {
      if (typeof chunk === "string" && chunk.startsWith("static/") && /\.(js|css)$/.test(chunk)) {
        files.add(chunk);
      }
    }
  }

  for (const entryFiles of Object.values(manifest.entryCSSFiles || {})) {
    for (const file of entryFiles || []) {
      if (file?.path && /\.(js|css)$/.test(file.path)) {
        files.add(file.path);
      }
    }
  }
}

function collectRoutePayloads() {
  const buildManifest = readJson(path.join(webNextDir, ".next", "build-manifest.json"));
  const appManifestDir = path.join(webNextDir, ".next", "server", "app");

  if (!buildManifest || !fs.existsSync(appManifestDir)) return [];

  const baseFiles = [
    ...(buildManifest.polyfillFiles || []),
    ...(buildManifest.rootMainFiles || []),
  ].filter((file) => /\.(js|css)$/.test(file));

  return walkFiles(appManifestDir)
    .filter((file) => file.endsWith("_client-reference-manifest.js"))
    .map(parseClientReferenceManifest)
    .filter(Boolean)
    .map(({ route, manifest }) => {
      const files = new Set(baseFiles);
      addClientReferenceChunks(files, manifest);

      let rawBytes = 0;
      let measuredBytes = 0;
      for (const file of files) {
        rawBytes += rawStaticSize(file);
        measuredBytes += measuredStaticSize(file);
      }

      return {
        route,
        files: files.size,
        rawBytes,
        measuredBytes,
      };
    })
    .sort((a, b) => b.measuredBytes - a.measuredBytes);
}

if (!fs.existsSync(staticDir)) {
  console.error("[bundle-size] .next/static not found. Run `next build` first.");
  process.exit(2);
}

const files = walkFiles(staticDir);

const jsFiles = files.filter((f) => f.endsWith(".js") && !f.endsWith(".hot-update.js"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

const jsSizes = jsFiles.map((f) => {
  const relative = toStaticRelative(f);
  return {
    name: path.relative(webNextDir, f),
    rawBytes: rawStaticSize(relative),
    measuredBytes: measuredStaticSize(relative),
  };
});
const cssSizes = cssFiles.map((f) => {
  const relative = toStaticRelative(f);
  return {
    name: path.relative(webNextDir, f),
    rawBytes: rawStaticSize(relative),
    measuredBytes: measuredStaticSize(relative),
  };
});

const totalJs = jsSizes.reduce((sum, f) => sum + f.measuredBytes, 0);
const totalCss = cssSizes.reduce((sum, f) => sum + f.measuredBytes, 0);
const grandTotal = totalJs + totalCss;
const rawGrandTotal =
  jsSizes.reduce((sum, f) => sum + f.rawBytes, 0) +
  cssSizes.reduce((sum, f) => sum + f.rawBytes, 0);

const jsMax = jsSizes.length > 0 ? Math.max(...jsSizes.map((f) => f.measuredBytes)) : 0;
const cssMax = cssSizes.length > 0 ? Math.max(...cssSizes.map((f) => f.measuredBytes)) : 0;
const routePayloads = collectRoutePayloads();
const largestRoute = routePayloads[0] || null;
const totalBudgetBytes =
  TOTAL_SCOPE === "route" && largestRoute ? largestRoute.measuredBytes : grandTotal;

const rows = [];
const failures = [];

rows.push({
  metric: `JS assets (${COMPRESSION})`,
  scope: "all emitted",
  files: jsSizes.length,
  route: "",
  "max KB": formatKb(jsMax),
  "total KB": formatKb(totalJs),
  "raw total KB": "",
});
rows.push({
  metric: `CSS assets (${COMPRESSION})`,
  scope: "all emitted",
  files: cssSizes.length,
  route: "",
  "max KB": formatKb(cssMax),
  "total KB": formatKb(totalCss),
  "raw total KB": "",
});
rows.push({
  metric: `Route payload (${COMPRESSION})`,
  scope: "largest route",
  files: largestRoute?.files ?? 0,
  route: largestRoute?.route ?? "n/a",
  "max KB": "",
  "total KB": formatKb(largestRoute?.measuredBytes ?? 0),
  "raw total KB": "",
});
rows.push({
  metric: `Static assets (${COMPRESSION})`,
  scope: "all emitted, info",
  files: jsSizes.length + cssSizes.length,
  route: "",
  "max KB": "",
  "total KB": formatKb(grandTotal),
  "raw total KB": formatKb(rawGrandTotal),
});

console.table(rows);

// Budget checks
if (jsMax > JS_BUDGET_KB * 1024) {
  failures.push(`Largest JS asset ${formatKb(jsMax)} KB exceeds budget ${JS_BUDGET_KB} KB (${COMPRESSION})`);
}
if (cssMax > CSS_BUDGET_KB * 1024) {
  failures.push(`Largest CSS asset ${formatKb(cssMax)} KB exceeds budget ${CSS_BUDGET_KB} KB (${COMPRESSION})`);
}
if (totalBudgetBytes > TOTAL_BUDGET_KB * 1024) {
  const totalLabel =
    TOTAL_SCOPE === "route" && largestRoute
      ? `Largest route payload (${largestRoute.route})`
      : "Total emitted static assets";
  failures.push(`${totalLabel} ${formatKb(totalBudgetBytes)} KB exceeds budget ${TOTAL_BUDGET_KB} KB (${COMPRESSION})`);
}

if (failures.length > 0) {
  console.error("\n[bundle-size] Budget violations:");
  failures.forEach((msg) => console.error(`  x ${msg}`));
  console.error("\nTip: set BUNDLE_BUDGET_COMPRESSION=raw for raw-byte audits.");
  process.exit(1);
}

console.log("\n[bundle-size] All budgets OK");
