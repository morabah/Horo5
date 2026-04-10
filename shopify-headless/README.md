## HORO Shopify Headless

Custom Next.js storefront connected to Shopify Storefront APIs for catalog, cart, and checkout redirect.

This app currently treats Shopify checkout as the system of record for payment collection. The storefront is responsible for:
- branded browsing and PDP experience
- cart state and checkout redirect
- analytics instrumentation
- signed Shopify webhook intake for paid-order verification

## Required Environment Variables

```bash
NEXT_PUBLIC_SITE_URL=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_STOREFRONT_API_VERSION=2025-01
SHOPIFY_WEBHOOK_SECRET=
```

Optional:

```bash
ORDER_EVENTS_STORE_PATH=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_META_PIXEL_ID=
```

If `ORDER_EVENTS_STORE_PATH` is unset, paid-order webhook events are written to:

```bash
.tmp/shopify-order-events.ndjson
```

This file-backed store is acceptable for local development and early staging. It is not a durable production datastore.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the storefront by modifying files in `src/app` and `src/components`.

## Payment Verification Baseline

Run:

```bash
npm run verify:egypt-payments
```

This checks the minimum environment required to validate an Egypt-ready Shopify checkout path and prints the signed webhook URL that should receive the `orders/paid` webhook.

Important:
- the browser return route is informational only
- paid-order confirmation should come from the signed Shopify webhook
- `checkoutUrl` redirect success must not be treated as proof of payment

## Preview QA

Run:

```bash
npm run qa:preview
```

This verifies core routes, cart API contracts, and an optional PDP smoke test when Shopify env vars are configured.

## Next Recommended Work

1. Prove the actual Egypt payment gateway path inside Shopify checkout.
2. Move paid-order persistence from file storage to a durable datastore.
3. Port the real HORO design system and bilingual shell into this app.
4. Add variant selection, stronger PDP trust UI, and collection/search filtering.
