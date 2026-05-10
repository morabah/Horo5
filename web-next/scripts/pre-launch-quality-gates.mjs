#!/usr/bin/env node
/**
 * Pre-launch quality gate checklist.
 * Validates storefront readiness before going live.
 *
 * Checks:
 *   1. Medusa health + catalog API
 *   2. All catalog products have real images
 *   3. All catalog products have priced variants
 *   4. Shipping options are live
 *   5. Payment providers are configured
 *   6. Required env vars are set
 *   7. Storefront catalog contract matches expectations
 *
 * Usage:
 *   MEDUSA_BACKEND_URL=https://api.example.com NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... node scripts/pre-launch-quality-gates.mjs
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

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_MEDUSA_BACKEND_URL",
  "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
];

let exitCode = 0;
let failures = 0;

function ok(label) {
  console.log(`  ✓ ${label}`);
}

function fail(label, detail) {
  console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
  failures++;
  exitCode = 1;
}

function warn(label, detail) {
  console.warn(`  ⚠ ${label}${detail ? `: ${detail}` : ""}`);
}

async function checkEnv() {
  console.log("\n[1/7] Environment variables");
  for (const name of REQUIRED_ENV) {
    if (process.env[name]) {
      ok(name);
    } else {
      fail(name, "missing");
    }
  }

  const optional = [
    "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    "NEXT_PUBLIC_META_PIXEL_ID",
    "NEXT_PUBLIC_CLARITY_PROJECT_ID",
  ];
  for (const name of optional) {
    if (process.env[name]) {
      ok(`${name} (optional)`);
    } else {
      warn(`${name} (optional)`, "not set — analytics will be limited");
    }
  }
}

async function checkMedusaHealth() {
  console.log("\n[2/7] Medusa health");
  if (!base) {
    fail("MEDUSA_BACKEND_URL", "not set");
    return;
  }

  const health = await fetch(`${base}/health`);
  if (!health.ok) {
    fail("GET /health", `${health.status}`);
    return;
  }
  ok("GET /health");

  if (!key) {
    fail("publishable key", "not set — cannot verify Store API");
    return;
  }

  const products = await fetch(`${base}/store/products?limit=1`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!products.ok) {
    fail("GET /store/products", `${products.status}`);
    return;
  }
  ok("GET /store/products (auth OK)");
}

async function checkCatalogIntegrity() {
  console.log("\n[3/7] Catalog integrity");
  if (!base || !key) {
    fail("catalog", "skipped — Medusa not reachable");
    return;
  }

  const catalog = await fetch(`${base}/storefront/catalog`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!catalog.ok) {
    fail("GET /storefront/catalog", `${catalog.status}`);
    return;
  }

  const json = await catalog.json();
  const products = Array.isArray(json?.products) ? json.products : [];
  const feelingLines = Array.isArray(json?.feelingLines) ? json.feelingLines : [];
  const occasions = Array.isArray(json?.occasions) ? json.occasions : [];

  console.log(`    products=${products.length}, feelingLines=${feelingLines.length}, occasions=${occasions.length}`);

  if (products.length === 0) {
    fail("catalog", "no products returned");
    return;
  }
  ok(`catalog has ${products.length} products`);

  let imagesMissing = 0;
  let pricesMissing = 0;
  let variantsMissing = 0;

  for (const product of products) {
    const hasImage = Boolean(
      product.media?.card || product.media?.main ||
      (Array.isArray(product.media?.gallery) && product.media.gallery.length > 0 && product.media.gallery[0]?.url)
    );
    if (!hasImage) imagesMissing++;

    const hasPrice = typeof product.priceEgp === "number" && product.priceEgp > 0;
    if (!hasPrice) pricesMissing++;

    const variantEntries = Object.entries(product.variantsBySize || {});
    if (variantEntries.length === 0) {
      variantsMissing++;
    } else {
      const anyPriced = variantEntries.some(([, v]) => typeof v.priceEgp === "number" && v.priceEgp > 0);
      if (!anyPriced) pricesMissing++;
    }
  }

  if (imagesMissing > 0) {
    fail("product images", `${imagesMissing} / ${products.length} products missing images`);
  } else {
    ok("all products have images");
  }

  if (pricesMissing > 0) {
    fail("product prices", `${pricesMissing} / ${products.length} products missing prices`);
  } else {
    ok("all products have prices");
  }

  if (variantsMissing > 0) {
    fail("product variants", `${variantsMissing} / ${products.length} products have no variants`);
  } else {
    ok("all products have variants");
  }
}

async function checkShippingOptions() {
  console.log("\n[4/7] Shipping options");
  if (!base || !key) {
    fail("shipping", "skipped — Medusa not reachable");
    return;
  }

  const resp = await fetch(`${base}/store/shipping-options`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!resp.ok) {
    fail("GET /store/shipping-options", `${resp.status}`);
    return;
  }

  const json = await resp.json();
  const options = Array.isArray(json?.shipping_options) ? json.shipping_options : [];
  if (options.length === 0) {
    fail("shipping options", "none returned");
  } else {
    ok(`${options.length} shipping option(s) active`);
    for (const opt of options) {
      console.log(`      - ${opt.name || opt.id} (${opt.amount != null ? opt.amount : "no amount"})`);
    }
  }
}

async function checkPaymentProviders() {
  console.log("\n[5/7] Payment providers");
  if (!base || !key) {
    fail("payments", "skipped — Medusa not reachable");
    return;
  }

  // Need a cart to list payment providers, so we'll check via the storefront catalog
  // which should include region info, or directly via admin if available.
  // Fallback: check that at least payment_providers exist in a region.
  const regions = await fetch(`${base}/store/regions`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!regions.ok) {
    fail("GET /store/regions", `${regions.status}`);
    return;
  }

  const json = await regions.json();
  const regionList = Array.isArray(json?.regions) ? json.regions : [];
  if (regionList.length === 0) {
    fail("regions", "none returned — payment providers cannot be verified");
    return;
  }

  const egRegion = regionList.find((r) =>
    (r.name || "").toLowerCase().includes("egypt") ||
    (r.currency_code || "").toLowerCase() === "egp"
  ) || regionList[0];

  const providers = await fetch(`${base}/store/payment-providers?region_id=${egRegion.id}`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!providers.ok) {
    fail("GET /store/payment-providers", `${providers.status}`);
    return;
  }

  const pJson = await providers.json();
  const pList = Array.isArray(pJson?.payment_providers) ? pJson.payment_providers : [];
  if (pList.length === 0) {
    fail("payment providers", "none returned");
  } else {
    ok(`${pList.length} payment provider(s) configured`);
    for (const p of pList) {
      console.log(`      - ${p.id}`);
    }
  }
}

async function checkStorefrontContract() {
  console.log("\n[6/7] Storefront catalog contract");
  if (!base || !key) {
    fail("contract", "skipped — Medusa not reachable");
    return;
  }

  const resp = await fetch(`${base}/storefront/catalog`, {
    headers: { "x-publishable-api-key": key },
  });
  if (!resp.ok) {
    fail("GET /storefront/catalog", `${resp.status}`);
    return;
  }

  const json = await resp.json();
  const requiredKeys = ["products", "feelingLines", "occasions", "artists"];
  const missing = requiredKeys.filter((k) => !(k in json));
  if (missing.length > 0) {
    fail("catalog contract", `missing keys: ${missing.join(", ")}`);
  } else {
    ok("catalog contract keys present");
  }

  if (Array.isArray(json.products)) {
    const first = json.products[0];
    const productKeys = ["slug", "name", "priceEgp", "variantsBySize", "artistSlug"];
    const pMissing = productKeys.filter((k) => !(k in (first || {})));
    if (pMissing.length > 0) {
      warn("first product", `missing keys: ${pMissing.join(", ")}`);
    } else {
      ok("first product schema valid");
    }
  }
}

async function checkCriticalPages() {
  console.log("\n[7/7] Critical storefront pages (smoke)");
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (!siteUrl) {
    warn("storefront pages", "NEXT_PUBLIC_SITE_URL not set — skipping page smoke tests");
    return;
  }

  const pages = ["/", "/products", "/feelings", "/occasions", "/checkout", "/cart"];
  for (const path of pages) {
    const url = `${siteUrl}${path}`;
    try {
      const resp = await fetch(url, { method: "HEAD" });
      if (resp.status >= 400) {
        fail(`${path}`, `HTTP ${resp.status}`);
      } else {
        ok(`${path} — HTTP ${resp.status}`);
      }
    } catch (err) {
      fail(`${path}`, String(err.message || err));
    }
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  HORO Pre-Launch Quality Gate Checklist");
  console.log("═══════════════════════════════════════════════════");

  await checkEnv();
  await checkMedusaHealth();
  await checkCatalogIntegrity();
  await checkShippingOptions();
  await checkPaymentProviders();
  await checkStorefrontContract();
  await checkCriticalPages();

  console.log("\n═══════════════════════════════════════════════════");
  if (failures === 0) {
    console.log("  ✓ ALL GATES PASSED — Ready for launch");
  } else {
    console.log(`  ✗ ${failures} gate(s) FAILED — Fix before launch`);
  }
  console.log("═══════════════════════════════════════════════════\n");

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
