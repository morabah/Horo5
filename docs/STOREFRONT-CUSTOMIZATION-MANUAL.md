# HORO Storefront Customization Manual

A practical guide for operators and developers to customize the HORO web app without writing code (where possible) and with minimal code changes (where needed).

---

## Quick Reference: All CLI Commands

All commands run from `medusa-backend/`. For Railway (production), append `:public` to the command name.

| Task | Local | Railway (production) |
|------|-------|----------------------|
| Run migrations | `npm run migrate` | Auto on deploy |
| Seed full Egypt catalog | `npm run seed:egypt` | `npm run seed:egypt:public` |
| Fix EGP prices | `npm run migrate:egp-prices` | — |
| Fix payment providers | `npm run ensure:egypt-payment-providers` | `npm run ensure:egypt-payment-providers:public` |
| Seed homepage sections | `npm run seed:homepage-sections` | `npm run seed:homepage-sections:public` |
| Seed incentives (free shipping) | `npm run seed:incentives` | `npm run seed:incentives:public` |
| Seed HORO taxonomy | `npm run seed:horo-taxonomy` | `npm run seed:horo-taxonomy:public` |
| Seed demo categories | `npm run seed:demo-categories` | `npm run seed:demo-categories:public` |
| Apply delivery windows | `npm run apply:store-delivery-metadata` | `npm run apply:store-delivery-metadata:public` |
| Apply size tables | `npm run apply:size-tables-metadata` | `npm run apply:size-tables-metadata:public` |
| Backfill artist metadata | `npm run backfill:product-artist-metadata` | `npm run backfill:product-artist-metadata:public` |
| Inspect PDP fields | `npm run inspect:product-pdp` | `npm run inspect:product-pdp:public` |
| Inspect payment providers | `npm run inspect:egypt-payment-providers` | `npm run inspect:egypt-payment-providers:public` |
| Inspect incentives | `npm run inspect:incentives` | — |
| Clear occasion slug | `npm run clear:product-occasion-slug` | `npm run clear:product-occasion-slug:public` |
| Dump category tree | `npm run dump:categories` | `npm run dump:categories:public` |
| Migrate feelings → categories | `npm run migrate:feelings-categories` | `npm run migrate:feelings-categories:public` |
| Audit feeling assignments | `npm run audit:feelings-categories` | `npm run audit:feelings-categories:public` |
| Rewrite media URLs | `npm run rewrite:store-media-urls` | `npm run rewrite:store-media-urls:public` |
| Diagnose S3 | `npm run diagnose:s3` | — |
| Check local vs Railway parity | `npm run parity:snapshot:local` then `npm run parity:check` | `npx @railway/cli run npm run parity:snapshot:remote` |
| Remove legacy taxonomy | `npm run remove:legacy-taxonomy-feelings` | `npm run remove:legacy-taxonomy-feelings:public` |
| Audit product taxonomy (TSV) | `npx medusa exec ./src/scripts/audit-product-taxonomy.ts` | — |
| Preview order confirmation email | `npm run preview:order-confirmation-email` | — |
| Sync promo labels (placeholder) | `npx medusa exec ./src/scripts/sync-promo-labels-placeholder.ts` | — |
| Seed Medusa demo data (EUR) | `npx medusa exec ./src/scripts/seed.ts` | — |

---

## 1. Homepage Layout & Content

### What it is

The homepage is a vertical stack of **sections**. Each section is one visual block (hero banner, trust ribbon, product grid, etc.). The `homepage_section` module in Medusa controls:

- **Which sections appear** (`active` field)
- **What order they appear in** (`sort_order`, lower = higher on page)
- **What text, images, and links each section shows** (localized `_en`/`_ar` fields)

### Current default sections (in order)

| Key | Type | What it shows |
|-----|------|---------------|
| `hero` | `hero` | Full-width hero banner with headline, CTA buttons, hero image |
| `trust_ribbon` | `trust_ribbon` | Horizontal strip: Artist-made, Printed in Egypt, COD, 14-day exchange |
| `founding_drop` | `founding_drop` | Product grid with "Start with the first pieces" heading |
| `feeling_grid` | `feeling_grid` | Feeling cards grid (Shop by Feeling) |
| `gift_block` | `gift_block` | Gift-ready promotional block |

### Available section types (can be activated)

| Type | Component | Description |
|------|-----------|-------------|
| `hero` | `HomeHeroWearMean` | Hero banner with headline + CTA |
| `trust_ribbon` | `HomeTrustRibbon` | Trust badges strip |
| `primary_routes` | `HomePrimaryRoutes` | Navigation cards |
| `founding_drop` | `HomeStartHere` | Product grid |
| `featured_piece` | `HomeFeaturedPiece` | Single featured product |
| `feeling_grid` | `HomeFeelingCards` | Feeling cards |
| `occasion_grid` | `HomeOccasionCards` | Occasion cards |
| `gift_block` | `HomeGiftBlock` | Gift promotional block |
| `why_horo` | `HomeWhyHoro` | Brand story block |
| `first_drop_circle` | `HomeFirstDropCircle` | Circular featured product |
| `proof_strip` | — | Proof/badge strip |
| `seen_on_you` | `HomeSeenOnYou` | Customer photos |
| `artist_spotlight` | `HomeArtistSpotlight` | Featured artist |

### How to edit homepage content

#### Option A: Edit the seed script and re-run (version-controlled)

1. Edit `medusa-backend/src/scripts/seed-homepage-sections.ts` — modify the `DEFAULT_SECTIONS` array
2. Run:

```bash
cd medusa-backend
npm run seed:homepage-sections
# For Railway:
npm run seed:homepage-sections:public
```

The script **upserts** by `key` — updates existing rows, creates missing ones.

#### Option B: Direct SQL (quick one-off changes)

```sql
-- Change the hero headline
UPDATE storefront_homepage_section
SET title_en = 'NEW HEADLINE', title_ar = 'عنوان جديد'
WHERE key = 'hero';

-- Change CTA button text and link
UPDATE storefront_homepage_section
SET primary_cta_label_en = 'Browse Collection',
    primary_cta_href = '/products?sort=newest'
WHERE key = 'hero';

-- Reorder: move feeling_grid above founding_drop
UPDATE storefront_homepage_section SET sort_order = 15 WHERE key = 'feeling_grid';

-- Hide a section without deleting
UPDATE storefront_homepage_section SET active = false WHERE key = 'gift_block';

-- Show a hidden section
UPDATE storefront_homepage_section SET active = true WHERE key = 'why_horo';
```

For Railway: use `npx @railway/cli connect` or the Railway dashboard DB console.

#### Option C: Medusa Admin (limited)

Medusa Admin does not yet have a dedicated homepage-sections UI. Use Option A or B above.

### How to add a brand-new section type

This requires code changes in 4 files + 1 new component file:

1. **Add enum value** to `medusa-backend/src/modules/homepage-section/models/homepage-section.ts` — add your type to the `.enum([...])` array
2. **Add DTO type** to `medusa-backend/src/lib/storefront/homepage.ts` — add to `StorefrontHomepageSectionType`
3. **Add frontend type** to `web-next/src/storefront/data/catalog-types.ts` — add to the `type` union
4. **Create React component** — e.g. `web-next/src/storefront/components/HomeMySection.tsx` with `'use client';` directive
5. **Register mapping** in `web-next/src/storefront/pages/Home.tsx` — add entry to `HOME_SECTION_COMPONENTS`
6. **Run migration**: `cd medusa-backend && npx medusa db:migrate`
7. **Insert DB row** via SQL or add to seed script and re-run

### Section field reference

| DB column | UI effect | Example |
|-----------|-----------|---------|
| `key` | Unique ID, maps to React component | `"hero"` |
| `type` | Fallback component if key not in mapping | `"hero"` |
| `sort_order` | Position on page (lower = higher) | `0` = top |
| `active` | Show/hide without deleting | `true` / `false` |
| `eyebrow_en/ar` | Small label above title | `"FOUNDING DROP"` |
| `title_en/ar` | Main heading | `"WEAR WHAT YOU FEEL"` |
| `body_en/ar` | Subtitle/description | `"Artist-made tees · Printed in Egypt"` |
| `primary_cta_label_en/ar` | Main button text | `"Shop the Founding Drop"` |
| `primary_cta_href` | Main button link | `"/products"` |
| `secondary_cta_label_en/ar` | Second button text | `"Shop by Feeling"` |
| `secondary_cta_href` | Second button link | `"/feelings"` |
| `image_src` | Image URL | `"/images/heroes/home-hero.png"` |
| `image_alt_en/ar` | Image alt text | `"Model wearing HORO tee"` |
| `accent` | Color accent | `"#FF6B35"` |
| `payload` | Extra JSON for specific sections | Trust ribbon items, grid config |

---

## 2. Product Catalog & Pricing

### Seed the full Egypt catalog

```bash
cd medusa-backend
npm run seed:egypt
```

This creates:
- Egypt region (`eg`, `egp`)
- Store default currency: `egp`
- Stock location + fulfillment set
- Standard shipping option (60 EGP)
- Hidden `gift-wrap` add-on (200 EGP)
- HORO apparel products with S/M/L/XL/XXL variants at 799 EGP each
- Product images from `web-next/public/images/`

### Fix EGP prices (whole-pound alignment)

After seeding, run once:

```bash
npm run migrate:egp-prices
```

This ensures `price.amount` and `currency.decimal_digits` match the storefront expectations. After running, clear browser `sessionStorage` key `horo:lastCatalog` or hard-refresh.

### Edit product content

Use **Medusa Admin** (http://localhost:7001) to:
- Edit product titles, descriptions, images
- Change variant prices
- Manage inventory

Or use the Medusa Admin API for bulk operations.

### Product metadata fields (storefront-specific)

These are set in Medusa Admin → Product → Metadata:

| Metadata key | Purpose | Example value |
|-------------|---------|---------------|
| `titleEn` | English product title override | `"Emotions — Raw Nerve"` |
| `descriptionEn` | English description override | `"Bold emotional graphic tee"` |
| `artistSlug` | Links to artist module | `"ahmed-hassan"` |
| `artist` | Inline artist data (preferred) | `{"name":"Ahmed","avatarUrl":"https://..."}` |
| `occasionSlugs` | Occasion routing | `["just-because","birthday"]` |
| `primaryOccasionSlug` | Primary occasion | `"just-because"` |
| `primaryFeelingSlug` | Primary feeling | `"mood"` |
| `sizeTableKey` | Size guide preset | `"regular"` / `"oversized"` / `"fitted"` |
| `hidden` | Hide from catalog | `true` (used for gift-wrap add-on) |
| `media.gallery` | PDP proof gallery | JSON array (see below) |

### PDP proof gallery

Set `metadata.media.gallery` as a JSON array:

```json
[
  { "url": "https://cdn.example.com/fabric.jpg", "tag": "proof_fabric" },
  { "url": "https://cdn.example.com/print.jpg", "tag": "proof_print" },
  { "url": "https://cdn.example.com/wash.jpg", "tag": "proof_wash" }
]
```

Supported tags: `proof_fabric`, `proof_print`, `proof_wash`, `lifestyle`, `flat_lay`. Only `proof_*` tags render in the PDP proof strip.

### Inspect PDP fields for a product

```bash
PRODUCT_HANDLE=emotions-raw-nerve npm run inspect:product-pdp
# Railway:
PRODUCT_HANDLE=emotions-raw-nerve npm run inspect:product-pdp:public
```

### Remove an occasion slug from a product

```bash
PRODUCT_HANDLE=emotions-raw-nerve OCCASION_SLUG=just-because npm run clear:product-occasion-slug
# Railway:
PRODUCT_HANDLE=emotions-raw-nerve OCCASION_SLUG=just-because npm run clear:product-occasion-slug:public
```

### Backfill artist metadata

Copies artist name/avatar from the `storefront_artist` module into `metadata.artist` on each product:

```bash
# Dry run first:
DRY_RUN=1 npm run backfill:product-artist-metadata

# Single product:
PRODUCT_HANDLE=emotions-raw-nerve npm run backfill:product-artist-metadata

# All products:
npm run backfill:product-artist-metadata
# Railway:
npm run backfill:product-artist-metadata:public
```

---

## 3. Delivery Windows (PDP "Arrives by" dates)

### What it controls

The PDP shows delivery date ranges like "Standard · 3–7 business days". The numeric windows come from `store.metadata.delivery` in Medusa.

### Apply default delivery windows

```bash
npm run apply:store-delivery-metadata
# Railway:
npm run apply:store-delivery-metadata:public
```

This merges the values from `medusa-backend/src/scripts/data/store-delivery-defaults.json` into `store.metadata.delivery`:

```json
{
  "standardMinDays": 3,
  "standardMaxDays": 7,
  "expressMinDays": 2,
  "expressMaxDays": 4,
  "cutoffHourLocal": 18,
  "cutoffMinuteLocal": 0,
  "standardMaxBusinessDays": 7
}
```

### Edit delivery windows

**Option A:** Edit `src/scripts/data/store-delivery-defaults.json` and re-run `npm run apply:store-delivery-metadata`.

**Option B:** In Medusa Admin → Settings → Store → Metadata, edit the `delivery` JSON object. Must be nested under `delivery` (flat keys at top level are ignored).

### Troubleshooting: PDP numbers don't change

1. **Value shape** — `delivery` must be a JSON **object** nested under `delivery` key, not flat at top level
2. **Next cache** — production caches up to 5 minutes; local `next dev` refetches every request
3. **Verify Medusa** — `curl -H "x-publishable-api-key: …" http://localhost:9000/storefront/settings` should show your `delivery` object

---

## 4. Size Guide Presets (PDP size tables)

### What it controls

The PDP size guide shows measurement tables and "Model is 172cm, wearing M" fit notes. These come from `store.metadata.sizeTables` (named presets) and `store.metadata.defaultSizeTableKey`.

Available presets: `regular`, `oversized`, `fitted`.

### Apply default size tables

```bash
npm run apply:size-tables-metadata
# Railway:
npm run apply:size-tables-metadata:public
```

Source file: `medusa-backend/src/scripts/data/size-tables-defaults.json`

### Assign a preset to a product

In Medusa Admin → Product → Metadata, set `sizeTableKey` to a preset name:

- `"regular"` — standard fit
- `"oversized"` — oversized fit
- `"fitted"` — slim fit

If omitted, the store default (`defaultSizeTableKey`) is used.

### Edit size table data

**Option A:** Edit `src/scripts/data/size-tables-defaults.json` and re-run `npm run apply:size-tables-metadata`.

**Option B:** Use the Medusa Admin API to update `store.metadata.sizeTables` directly (the Admin metadata UI cannot edit nested objects).

---

## 5. Free Shipping Incentive (Mini-Cart Progress Bar)

### What it controls

The mini-cart shows a progress bar: "Add X EGP more for free shipping". The threshold comes from a Medusa Promotion.

### Seed the default incentive

```bash
npm run seed:incentives
# Railway:
npm run seed:incentives:public
```

Default: free shipping at **1,500 EGP**. Override:

```bash
FREE_SHIPPING_THRESHOLD_EGP=1200 npm run seed:incentives
```

The script is **idempotent** — skips if the promotion already exists with a valid subtotal rule.

### Change the threshold

```bash
FREE_SHIPPING_THRESHOLD_EGP=2000 npm run seed:incentives
```

This creates a new promotion code `HORO_FREE_SHIPPING_2000`. You may want to deactivate the old one in Medusa Admin → Promotions.

### Inspect current incentives

```bash
npm run inspect:incentives
```

---

## 6. Payment Providers (COD + Paymob Card)

### How it works

The Egypt region has payment providers assigned:
- **`pp_system_default`** — Cash on Delivery (COD), always active
- **`pp_paymob_paymob`** — Paymob card payments, only when env vars are configured

### Fix missing payment providers

If checkout loses COD on Railway:

```bash
npm run ensure:egypt-payment-providers
# Railway:
npm run ensure:egypt-payment-providers:public
```

### Inspect current providers

```bash
npm run inspect:egypt-payment-providers
# Railway:
npm run inspect:egypt-payment-providers:public
```

### Enable Paymob card payments

Set these env vars on the Medusa service:

```
PAYMOB_API_KEY=...
PAYMOB_HMAC_SECRET=...
PAYMOB_CARD_INTEGRATION_ID=...
```

Then run `npm run ensure:egypt-payment-providers` to attach the provider to the Egypt region.

Configure the Paymob backend callback to: `https://YOUR_MEDUSA_DOMAIN/hooks/payment/paymob_paymob`

---

## 7. Feelings & Occasions Taxonomy

### Seed the HORO taxonomy (feelings + occasions as product categories)

```bash
npm run seed:horo-taxonomy
# Railway:
npm run seed:horo-taxonomy:public
```

### Migrate legacy feelings to product categories

```bash
npm run migrate:feelings-categories
# Railway:
npm run migrate:feelings-categories:public
```

### Audit feeling category assignments

Fails (exit 1) if any product has zero or multiple feeling-branch category assignments:

```bash
npm run audit:feelings-categories
# Railway:
npm run audit:feelings-categories:public
```

### Dump category tree

```bash
npm run dump:categories
# Railway:
npm run dump:categories:public
```

### Remove legacy taxonomy

```bash
npm run remove:legacy-taxonomy-feelings
# Railway:
npm run remove:legacy-taxonomy-feelings:public
```

### PDP chips vs Admin categories

- **Purple feeling pill** (e.g. "Zodiac") → derived from product category tree + metadata
- **White category pills** under title → linked product categories from Medusa Admin → Organize → Categories (internal `feelings` root is excluded)
- These are **not** populated from `metadata.occasionSlugs` (that field is used for routing and `primaryOccasionSlug`)

---

## 8. Media & Images

### Rewrite storage URLs to store-media proxy

When moving from direct S3 URLs to the `/store-media` proxy:

```bash
npm run rewrite:store-media-urls
# Railway:
npm run rewrite:store-media-urls:public
```

Set `MEDUSA_BACKEND_URL` (no trailing slash). Optional: `S3_URL_REWRITE_HOST_SUBSTRING=storageapi.dev`.

### Diagnose S3 issues

```bash
npm run diagnose:s3
```

---

## 9. Order Confirmation Emails

### Enable

Set these env vars on the Medusa service:

```
RESEND_API_KEY=re_xxx...
ORDER_CONFIRMATION_FROM=HORO <hello@horotees.com>
```

Optional:
- `ORDER_CONFIRMATION_BCC` — address copied on every send
- `STORE_URL` — used for storefront link in the email

If these vars are **missing**, the subscriber no-ops (orders still complete normally).

### Preview the email template

```bash
npm run preview:order-confirmation-email
```

---

## 10. Order Lookup (Ops/Support)

### API lookup

```bash
curl -sS \
  -H "x-publishable-api-key: YOUR_PK" \
  -H "x-horo-ops-secret: YOUR_HORO_OPS_BACKEND_SECRET" \
  "https://<medusa-host>/store/custom/horo-ops/lookup?q=HORO-18"
```

Search by: `HORO-18`, `18`, `#18`, or full internal id `order_01KP…`.

### Internal ops dashboard

Open `/internal/horo-ops` on the storefront, sign in with `HORO_OPS_UI_PASSWORD`.

---

## 11. Local ↔ Railway Parity

### Check parity

```bash
# From medusa-backend/:
npm run parity:snapshot:local
npx @railway/cli run npm run parity:snapshot:remote
npm run parity:check

# Ignore media URL differences:
npm run parity:check:ignore-media
```

### Full sync (advanced)

```bash
npm run sync:local-to-railway
```

---

## 12. First-Time / Fresh Database Setup

```bash
cd medusa-backend

# 1. Copy env
cp .env.template .env
# Edit .env with your PostgreSQL URL and secrets

# 2. Install
npm ci

# 3. Run migrations
npm run migrate

# 4. Seed the Egypt catalog
npm run seed:egypt

# 5. Fix EGP prices
npm run migrate:egp-prices

# 6. Seed homepage sections
npm run seed:homepage-sections

# 7. Seed incentives
npm run seed:incentives

# 8. Seed taxonomy
npm run seed:horo-taxonomy

# 9. Apply delivery windows
npm run apply:store-delivery-metadata

# 10. Apply size tables
npm run apply:size-tables-metadata

# 11. Backfill artist metadata
npm run backfill:product-artist-metadata

# 12. Start Medusa
npm run dev

# 13. Verify
curl http://localhost:9000/health
```

---

## 13. Storefront CORS & Environment (web-next)

### Required env vars for web-next

| Variable | Purpose |
|----------|---------|
| `MEDUSA_BACKEND_URL` | Medusa API URL (server-side) |
| `MEDUSA_PUBLISHABLE_KEY` | Medusa publishable key (server-side) |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Medusa publishable key (client-side) |
| `NEXT_PUBLIC_SITE_URL` | Public storefront URL |

### CORS for checkout

Medusa's `STORE_CORS` and `AUTH_CORS` must include the **exact** storefront origin. `http://127.0.0.1:3005` and `http://localhost:3005` are **different** origins.

### Verify storefront connectivity

```bash
cd web-next
MEDUSA_BACKEND_URL=http://localhost:9000 NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... npm run smoke:medusa
```

---

## 14. Audit Product Taxonomy (Advanced)

### What it does

Prints a TSV (tab-separated) report of every product's feeling/subfeeling assignments, category health, and invalid occasion slugs. Useful for finding products with missing or duplicate feeling categories.

### Run

```bash
npx medusa exec ./src/scripts/audit-product-taxonomy.ts
```

Output columns: `handle`, `derivedFeeling`, `derivedSub`, `category_ok`, `occasionSlugs`, `invalid_occasions`

`category_ok` values:
- `yes` — exactly one feelings-branch category
- `missing_categories` — no categories at all
- `no_feelings_branch` — categories exist but none under the feelings root
- `multiple_branches` — linked to more than one feelings branch (ambiguous)

---

## 15. Medusa Demo Seed (EUR, not for HORO production)

### What it does

`seed.ts` is the **default Medusa v2 demo seed** — it creates European regions (EUR/USD), demo products (Medusa T-Shirt, Sweatshirt, etc.), and a European warehouse. **Do not use this for the HORO Egypt storefront.** Use `npm run seed:egypt` instead.

### When to use it

Only for a clean Medusa sandbox or testing Medusa core features without HORO customizations.

```bash
npx medusa exec ./src/scripts/seed.ts
```

---

## 16. Sync Promo Labels (Placeholder)

### What it does

`sync-promo-labels-placeholder.ts` is an intentionally empty placeholder script. It exists as a hook point for future wiring of `product.metadata.promoLabel` from Medusa Promotions or an external sheet.

```bash
npx medusa exec ./src/scripts/sync-promo-labels-placeholder.ts
# Currently a no-op
```

---

## 17. Adding a New Page (Developer Guide)

1. Create `web-next/src/storefront/pages/MyPage.tsx` with `'use client';` at the top
2. Create a route in the Next.js App Router (e.g. `web-next/src/app/(main)/my-page/page.tsx`)
3. Import and render your page component
4. If the page uses Medusa data, add a server fetch in the route's server component and pass as props

### Required directive for client components

Any file using React hooks (`useState`, `useEffect`, `useRef`, etc.) or `react-router-dom` must start with:

```tsx
'use client';
```

---

## 18. Common Pitfalls & Safety Rules

### ⚠️ Always dry-run before bulk changes

Scripts that modify products (`backfill:product-artist-metadata`, `clear:product-occasion-slug`, etc.) support `DRY_RUN=1` or single-product filters. Use them first:

```bash
# Safe: preview what would change
DRY_RUN=1 npm run backfill:product-artist-metadata
PRODUCT_HANDLE=emotions-raw-nerve npm run backfill:product-artist-metadata

# Safe: preview single product PDP fields before editing
PRODUCT_HANDLE=emotions-raw-nerve npm run inspect:product-pdp
```

### ⚠️ Never run `seed.ts` on a HORO production DB

`seed.ts` creates European demo data (EUR, Medusa-branded products). Use `seed:egypt` for HORO.

### ⚠️ Idempotent scripts are safe to re-run

These scripts upsert or skip existing data — running them twice won't duplicate:
- `seed:egypt`, `seed:homepage-sections`, `seed:incentives`, `seed:horo-taxonomy`, `seed:demo-categories`
- `apply:store-delivery-metadata`, `apply:size-tables-metadata`
- `ensure:egypt-payment-providers`
- `backfill:product-artist-metadata` (skips products that already have `metadata.artist.name`)

### ⚠️ EGP prices must be whole pounds

EGP has `decimal_digits = 0`. After seeding or changing prices, always run:

```bash
npm run migrate:egp-prices
```

Then clear browser `sessionStorage` key `horo:lastCatalog` or hard-refresh.

### ⚠️ Store metadata must nest under the right key

- Delivery windows → `store.metadata.delivery` (not flat at top level)
- Size tables → `store.metadata.sizeTables` + `store.metadata.defaultSizeTableKey`
- Homepage sections → `store.metadata.homepage.sectionsEnabled` (fallback only; prefer `homepage_section` module)

Flat keys like `standardMinDays` at the top level of Store metadata are **ignored** by the storefront.

### ⚠️ CORS origins must match exactly

`STORE_CORS` and `AUTH_CORS` in Medusa must include the **exact** storefront origin:
- `http://127.0.0.1:3005` ≠ `http://localhost:3005`
- Production: `https://your-app.vercel.app` (no trailing slash)

If checkout fails with CORS errors, check both `STORE_CORS` and `AUTH_CORS`.

### ⚠️ After editing Medusa data, clear Next.js cache

- **Local dev** (`next dev`): cache refetches every request — no action needed
- **Production**: ISR cache up to 5 minutes, or trigger revalidation via `store.updated` / `homepage_section.*` events
- **Browser**: clear `sessionStorage` key `horo:lastCatalog` or hard-refresh

### ⚠️ Railway CLI requires `DATABASE_PUBLIC_URL`

Railway's internal `DATABASE_URL` is not reachable from your Mac. All `:public` scripts use `DATABASE_PUBLIC_URL` via `scripts/medusa-exec-public-db.sh`, which also unsets Redis URLs so `redis.railway.internal` doesn't break `medusa exec`.

### ⚠️ Missing env vars cause silent failures

| Missing var | Symptom |
|-------------|--------|
| `JWT_SECRET` / `COOKIE_SECRET` | Logs: `http.jwtSecret not found`; admin auth breaks |
| `MEDUSA_BACKEND_URL` | Storefront can't reach Medusa API |
| `MEDUSA_PUBLISHABLE_KEY` | Storefront API calls return 401 |
| `RESEND_API_KEY` / `ORDER_CONFIRMATION_FROM` | Order confirmation emails silently skipped |
| `HORO_OPS_BACKEND_SECRET` | Ops lookup routes return 503 |
| `PAYMOB_*` | Card checkout unavailable (COD still works) |
| `REDIS_URL` | 409 conflicts on concurrent cart operations in production |

---

## Appendix: File Map

| Area | Key files |
|------|-----------|
| Homepage sections (model) | `medusa-backend/src/modules/homepage-section/models/homepage-section.ts` |
| Homepage sections (service) | `medusa-backend/src/modules/homepage-section/service.ts` |
| Homepage sections (DTO) | `medusa-backend/src/lib/storefront/homepage.ts` |
| Homepage sections (seed) | `medusa-backend/src/scripts/seed-homepage-sections.ts` |
| Homepage sections (API) | `medusa-backend/src/api/storefront/homepage/route.ts` |
| Homepage sections (frontend type) | `web-next/src/storefront/data/catalog-types.ts` |
| Homepage sections (renderer) | `web-next/src/storefront/pages/Home.tsx` |
| Storefront server fetch | `web-next/src/lib/storefront-server.ts` |
| Delivery defaults | `medusa-backend/src/scripts/data/store-delivery-defaults.json` |
| Size table defaults | `medusa-backend/src/scripts/data/size-tables-defaults.json` |
| Egypt catalog seed | `medusa-backend/src/scripts/seed-egypt-catalog.ts` |
| Incentives seed | `medusa-backend/src/scripts/seed-incentives.ts` |
| Feelings taxonomy data | `medusa-backend/src/scripts/data/feelings-taxonomy-data.ts` |
| Product fixture data | `medusa-backend/src/scripts/data/egypt-products.ts` |
| ISR revalidation subscriber | `medusa-backend/src/subscribers/storefront-revalidate.ts` |
| Order confirmation email | `medusa-backend/src/subscribers/order-confirmation-email.ts` |
