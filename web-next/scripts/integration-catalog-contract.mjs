#!/usr/bin/env node
/**
 * Integration-style contract check: Medusa `GET /storefront/catalog` matches shapes
 * the storefront (setRuntimeCatalog / adapters) relies on.
 *
 * Requires a running Medusa and publishable key (same env names as smoke-medusa.mjs).
 *
 * Usage:
 *   MEDUSA_BACKEND_URL=http://127.0.0.1:9000 NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... node scripts/integration-catalog-contract.mjs
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

function assert(cond, msg) {
  if (!cond) {
    console.error(msg);
    process.exit(1);
  }
}

async function main() {
  assert(base, "Set MEDUSA_BACKEND_URL or NEXT_PUBLIC_MEDUSA_BACKEND_URL");
  assert(key, "Set MEDUSA_PUBLISHABLE_KEY or NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY");

  const res = await fetch(`${base}/storefront/catalog`, {
    headers: { "x-publishable-api-key": key },
  });
  const errText = res.ok ? "" : await res.text();
  assert(res.ok, `GET /storefront/catalog failed: ${res.status} ${errText.slice(0, 400)}`);

  const body = await res.json();
  const requiredTop = ["artists", "events", "feelings", "occasions", "products", "subfeelings"];
  for (const k of requiredTop) {
    assert(Array.isArray(body[k]), `Missing or non-array catalog.${k}`);
  }

  if (body.products.length > 0) {
    const p = body.products[0];
    assert(typeof p.slug === "string" && p.slug, "product.slug must be non-empty string");
    assert(typeof p.name === "string", "product.name must be string");
    assert(typeof p.priceEgp === "number" && Number.isFinite(p.priceEgp), "product.priceEgp must be finite number");
    assert(typeof p.feelingSlug === "string", "product.feelingSlug must be string");
    assert(p.variantsBySize && typeof p.variantsBySize === "object", "product.variantsBySize must be object");
  }

  console.log(
    `OK /storefront/catalog contract (products=${body.products.length}, feelings=${body.feelings.length}, subfeelings=${body.subfeelings.length})`,
  );

  if (body.products.length > 0) {
    const handle = body.products[0].slug;
    const pdpRes = await fetch(`${base}/storefront/pdp/${encodeURIComponent(handle)}`, {
      headers: { "x-publishable-api-key": key },
    });
    const pdpErr = pdpRes.ok ? "" : await pdpRes.text();
    assert(pdpRes.ok, `GET /storefront/pdp/:handle failed: ${pdpRes.status} ${pdpErr.slice(0, 400)}`);
    const pdp = await pdpRes.json();
    assert(pdp.product && typeof pdp.product.slug === "string", "pdp.product.slug must be string");
    assert(pdp.settings && "delivery" in pdp.settings, "pdp.settings must include delivery");
    assert(Array.isArray(pdp.crossSellProducts), "pdp.crossSellProducts must be array");
    console.log(`OK /storefront/pdp/:handle contract (crossSell=${pdp.crossSellProducts.length})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
