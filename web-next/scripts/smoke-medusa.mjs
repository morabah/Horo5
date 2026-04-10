#!/usr/bin/env node
/**
 * Smoke test: Medusa /health + Store API (publishable key + CORS headers on preflight).
 * Usage:
 *   MEDUSA_BACKEND_URL=https://api.example.com NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... node scripts/smoke-medusa.mjs
 * Or use NEXT_PUBLIC_* names only.
 */

const base = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  ""
).replace(/\/$/, "");
const key =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "";
const storefrontOrigin =
  process.env.SMOKE_STORE_ORIGIN ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://example.vercel.app";

async function main() {
  if (!base) {
    console.error(
      "Missing MEDUSA_BACKEND_URL or NEXT_PUBLIC_MEDUSA_BACKEND_URL",
    );
    process.exit(2);
  }

  const health = await fetch(`${base}/health`);
  if (!health.ok) {
    console.error(`GET /health failed: ${health.status}`);
    process.exit(1);
  }
  console.log("GET /health OK");

  if (!key) {
    console.warn(
      "No publishable key set; skipping Store API check. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY.",
    );
    process.exit(0);
  }

  const products = await fetch(`${base}/store/products?limit=1`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!products.ok) {
    const body = await products.text();
    console.error(
      `GET /store/products failed: ${products.status} ${body.slice(0, 200)}`,
    );
    process.exit(1);
  }
  console.log("GET /store/products OK (publishable key)");

  const preflight = await fetch(`${base}/store/products?limit=1`, {
    method: "OPTIONS",
    headers: {
      Origin: storefrontOrigin.replace(/\/$/, ""),
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "x-publishable-api-key",
    },
  });
  const allowOrigin = preflight.headers.get("access-control-allow-origin");
  if (!allowOrigin && preflight.status >= 400) {
    console.warn(
      "CORS preflight: unexpected status; verify STORE_CORS includes your storefront origin.",
    );
  } else {
    console.log(
      `CORS preflight: status=${preflight.status} access-control-allow-origin=${allowOrigin || "(none)"}`,
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
