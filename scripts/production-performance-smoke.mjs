import http from "node:http";
import https from "node:https";

const frontendBaseUrl = (process.env.PERF_FRONTEND_BASE_URL || "").replace(/\/+$/, "");
const medusaBaseUrl = (process.env.PERF_MEDUSA_BASE_URL || "").replace(/\/+$/, "");
const productSlug = process.env.PERF_PRODUCT_SLUG || "quiet-revolt";

const publicTtfbMs = numberEnv("PERF_PUBLIC_TTFB_MS", 1200);
const apiTtfbMs = numberEnv("PERF_API_TTFB_MS", 800);
const totalMs = numberEnv("PERF_TOTAL_MS", 4000);

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function requestOnce(url) {
  const startedAt = performance.now();
  let firstByteAt = 0;
  let bytes = 0;

  return new Promise((resolve) => {
    const client = url.startsWith("https:") ? https : http;
    const req = client.get(url, { timeout: totalMs }, (res) => {
      res.on("data", (chunk) => {
        if (!firstByteAt) {
          firstByteAt = performance.now();
        }
        bytes += chunk.length;
      });
      res.on("end", () => {
        const endedAt = performance.now();
        resolve({
          bytes,
          status: res.statusCode || 0,
          totalMs: Math.round(endedAt - startedAt),
          ttfbMs: Math.round((firstByteAt || endedAt) - startedAt),
          url,
        });
      });
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Timed out after ${totalMs}ms`));
    });

    req.on("error", (error) => {
      resolve({
        bytes,
        error: error instanceof Error ? error.message : String(error),
        status: 0,
        totalMs: Math.round(performance.now() - startedAt),
        ttfbMs: 0,
        url,
      });
    });
  });
}

function endpointSet() {
  const endpoints = [];
  if (frontendBaseUrl) {
    endpoints.push(
      { kind: "public", name: "home", url: `${frontendBaseUrl}/` },
      { kind: "public", name: "products", url: `${frontendBaseUrl}/products` },
      { kind: "public", name: "pdp", url: `${frontendBaseUrl}/products/${encodeURIComponent(productSlug)}` },
      { kind: "private-shell", name: "cart", url: `${frontendBaseUrl}/cart` },
      { kind: "private-shell", name: "checkout", url: `${frontendBaseUrl}/checkout` },
    );
  }
  if (medusaBaseUrl) {
    endpoints.push(
      { kind: "api", name: "medusa-health", url: `${medusaBaseUrl}/health` },
      { kind: "api", name: "medusa-catalog", url: `${medusaBaseUrl}/storefront/catalog` },
      { kind: "api", name: "medusa-products", url: `${medusaBaseUrl}/storefront/products` },
      { kind: "api", name: "medusa-pdp", url: `${medusaBaseUrl}/storefront/pdp/${encodeURIComponent(productSlug)}` },
    );
  }
  return endpoints;
}

const endpoints = endpointSet();
if (endpoints.length === 0) {
  console.error("Set PERF_FRONTEND_BASE_URL and/or PERF_MEDUSA_BASE_URL.");
  process.exit(2);
}

const rows = [];
const failures = [];

for (const endpoint of endpoints) {
  const result = await requestOnce(endpoint.url);
  const threshold = endpoint.kind === "api" ? apiTtfbMs : publicTtfbMs;
  const okStatus = result.status >= 200 && result.status < 400;
  const okTtfb = result.ttfbMs > 0 && result.ttfbMs <= threshold;
  const okTotal = result.totalMs <= totalMs;
  const ok = okStatus && okTtfb && okTotal;

  rows.push({
    ...endpoint,
    bytes: result.bytes,
    status: result.status,
    totalMs: result.totalMs,
    ttfbMs: result.ttfbMs,
    ok,
    ...(result.error ? { error: result.error } : {}),
  });

  if (!ok) {
    failures.push(endpoint.name);
  }
}

console.table(rows);

if (failures.length > 0) {
  console.error(`Performance smoke failed: ${failures.join(", ")}`);
  process.exit(1);
}

console.info("Performance smoke passed.");
