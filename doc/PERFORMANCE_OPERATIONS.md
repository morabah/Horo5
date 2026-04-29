# HORO Performance Operations

This is the deployment checklist for cache invalidation, performance CI, production monitoring, and DB index verification.

## Cache Invalidation

Set the same secret in both services:

```bash
# web-next
STOREFRONT_REVALIDATE_SECRET=<long-random-secret>

# medusa-backend
STOREFRONT_REVALIDATE_SECRET=<same-secret>
STOREFRONT_REVALIDATE_URL=https://<storefront-domain>/api/revalidate/storefront
```

Optional debugging:

```bash
STOREFRONT_REVALIDATE_DEBUG=1
STOREFRONT_REVALIDATE_TIMEOUT_MS=5000
```

Manual test:

```bash
curl -X POST https://<storefront-domain>/api/revalidate/storefront \
  -H "content-type: application/json" \
  -H "x-revalidate-secret: <long-random-secret>" \
  -d '{"tags":["catalog","storefront","product","homepage"]}'
```

The Medusa subscriber revalidates public cache tags on product, variant, category, inventory, pricing, promotion, artist, occasion, merch-event, homepage-section, and store updates. Cart, checkout, order, and customer data are intentionally not cached publicly.

## Lighthouse CI

Run locally after `npm run build`:

```bash
cd web-next
npm run lhci
```

Run against a deployed preview/production URL:

```bash
cd web-next
LHCI_BASE_URL=https://<storefront-domain> LHCI_PRODUCT_SLUG=quiet-revolt npm run lhci
```

GitHub Actions:
- Use `Performance CI`.
- Provide the target URL when manually dispatching the workflow.

## Production Smoke Monitor

GitHub repository variables:

```bash
PERF_FRONTEND_BASE_URL=https://<storefront-domain>
PERF_MEDUSA_BASE_URL=https://<medusa-domain>
PERF_PRODUCT_SLUG=quiet-revolt
PERF_PUBLIC_TTFB_MS=1200
PERF_API_TTFB_MS=800
PERF_TOTAL_MS=4000
```

The scheduled `Production Performance Monitor` workflow runs every 30 minutes. A failed workflow is the alert. Wire GitHub Actions failure notifications to email, Slack, or your incident channel.

Manual local run:

```bash
PERF_FRONTEND_BASE_URL=http://127.0.0.1:3000 \
PERF_MEDUSA_BASE_URL=http://127.0.0.1:9000 \
node scripts/production-performance-smoke.mjs
```

## Medusa Runtime Logging

Recommended production vars:

```bash
HORO_HTTP_STRUCTURED_LOG=1
HORO_LOG_SLOW_MS=500
```

Use `HORO_HTTP_TIMING=all` temporarily during incident analysis only; it logs every matched request.

## DB Index Verification

Apply migrations:

```bash
cd medusa-backend
npm run migrate
```

If the Medusa migrator reports up-to-date but verification still shows missing indexes, apply the idempotent repair script:

```bash
cd medusa-backend
DOTENV_CONFIG_PATH=.env node -r dotenv/config scripts/apply-performance-indexes.mjs
```

Verify expected performance indexes and `pg_trgm`:

```bash
cd medusa-backend
DOTENV_CONFIG_PATH=.env node -r dotenv/config scripts/verify-performance-indexes.mjs
```

Enable indexed search only after verification passes:

```bash
STOREFRONT_PG_SEARCH=1
```

For future indexes, use production slow-query logs and `EXPLAIN (ANALYZE, BUFFERS)` first. Do not add indexes for private checkout/cart paths unless a real slow query shows the need.
