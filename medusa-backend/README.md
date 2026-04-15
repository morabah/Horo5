# Medusa v2 Backend (Railway + Egypt Catalog)

This service sets up Medusa v2 with PostgreSQL, seeds an Egypt region (`egp`), creates the HORO catalog, and provisions the launch checkout path for Egypt: one live `Standard` shipping option (`60 EGP`), COD via Medusa's system provider, and an optional custom Paymob card provider when its env vars are configured.

**Custom HTTP routes:** Handlers under `src/api/storefront/**` and `src/api/admin/custom/**` should stay thin at the HTTP boundary (parse/validate, auth where applicable) and delegate catalog or taxonomy work to [`src/lib/storefront/catalog.ts`](src/lib/storefront/catalog.ts) and module services—see [`src/api/storefront/catalog/route.ts`](src/api/storefront/catalog/route.ts) and [`src/api/admin/custom/occasions/route.ts`](src/api/admin/custom/occasions/route.ts). File-based routing conventions are summarized in [`src/api/README.md`](src/api/README.md).

## 1) Local setup

1. Copy env values:

```bash
cp .env.template .env
```

2. Update `.env` with your PostgreSQL URL and secrets.

3. Install and run:

```bash
npm ci
npm run dev
```

## 2) Seed Egypt catalog

Run once after database is reachable:

```bash
npm run seed:egypt
```

What this seeds:
- Region: `Egypt` (`eg`, `egp`)
- Store default currency: `egp`
- Store default stock location and fulfillment set for Egypt checkout
- One live `Standard` shipping option priced at `60 EGP`
- Hidden `gift-wrap` add-on product priced at `200 EGP`
- HORO apparel products from the shared fixture catalog, each with:
  - `metadata.titleEn`
  - `metadata.descriptionEn`
  - size variants `S/M/L/XL/XXL`
  - variant prices: **`799`** integer EGP (`currency.decimal_digits = 0` for `egp`). **`medusa db:migrate` does not run `src/migrations/`** in Medusa v2; after `npm run migrate`, run **`npm run migrate:egp-prices`** once per database so `price.amount` and `currency.decimal_digits` match the storefront (see `src/scripts/apply-egp-whole-pound-prices.ts`). **Re-seed is not required** for prices once `price` rows are correct—clear the browser tab’s `sessionStorage` key `horo:lastCatalog` or hard-refresh so Next reloads the catalog from Medusa.
- Product images uploaded from:
  - `../web-next/public/images/tees/emotions_vibe_1_1774374034307.png`
  - `../web-next/public/images/tees/zodiac_vibe_1_1774374128029.png`
  - `../web-next/public/images/tees/fiction_vibe_1_1774374247152.png`
  - `../web-next/public/images/tees/career_vibe_1_1774374340994.png`
  - `../web-next/public/images/hero/hero-model.png`

## 3) Deploy on Railway (PostgreSQL + Node)

**If Railway shows “Railpack could not determine how to build the app”:** the service is building from the **repository root** (monorepo) instead of only `medusa-backend`. Fix it in either of these ways:

- **Recommended:** Leave the service **root directory** empty (repo root). The repository includes a root [`Dockerfile`](../Dockerfile) and [`railway.toml`](../railway.toml) so Railway builds Medusa with Docker and runs `npm run migrate` before start. The root [`.dockerignore`](../.dockerignore) excludes other apps and large folders (e.g. `shopify-headless`, `Guidelines `) so the Docker build context stays small and builds are less likely to hit **timeouts** on first `npm ci` / `medusa build`.
- **Alternative:** Set **Root Directory** to **`medusa-backend`** so Railpack detects Node from `package.json`. Set **Custom Config File** to **`/medusa-backend/railway.toml`** if deploy settings are not applied. (Egypt seed images use `../web-next/public/...`; use the root `Dockerfile` flow if those files must be in the image.)

---

### Connect Railway Postgres to this deployment

Do this in the **same Railway project** where the Medusa app runs.

1. **Add Postgres** (if needed): **New** → **Database** → **PostgreSQL**. Note the **service name** in the canvas (e.g. `Postgres` — yours might differ).
2. **Open your Medusa / API service** (the one that runs `medusa start`).
3. Go to **Variables**.
4. Add **`DATABASE_URL`**:
   - **Recommended:** use a **variable reference** so redeploys always follow the live DB credentials:
     - **Typed reference:** `${{ Postgres.DATABASE_URL }}` — replace `Postgres` with your **exact** Postgres service name from the project graph, **or**
     - Use **“Add reference”** / **“Variable reference”** in the UI and pick the Postgres service → `DATABASE_URL`.
   - **Alternative:** copy **`DATABASE_URL`** from the Postgres service’s **Variables** tab and paste it into the Medusa service (works, but you must update it manually if Railway rotates credentials).
5. **Redeploy** the Medusa service (or push a commit). `preDeploy` runs `npm run migrate` against this URL.
6. **Verify:** open the Postgres **Data** tab or run `npx @railway/cli connect` → `\dt` — you should see tables after a successful migrate. If the DB stays empty, Medusa is still pointing at a different `DATABASE_URL` than the database you are inspecting.

Also set the rest of the Medusa variables (below).

---

1. Ensure **PostgreSQL** exists in the project and **`DATABASE_URL`** on the Medusa service points at it (see **Connect Railway Postgres** above).
2. Set environment variables on the Medusa service (see [`.env.template`](.env.template)):
   - `DATABASE_URL`
   - `MEDUSA_BACKEND_URL` — public `https://` URL of this Railway service (no trailing slash)
   - `STORE_URL` — public storefront URL used for checkout return links
   - `STORE_CORS` — Vercel storefront origin(s), comma-separated, e.g. `https://your-app.vercel.app`
   - `ADMIN_CORS` / `AUTH_CORS` — align with Medusa admin and your Vercel origins
   - `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_ADMIN_ONBOARDING_TYPE`
   - Optional Paymob card checkout:
     - `PAYMOB_API_KEY`
     - `PAYMOB_HMAC_SECRET`
     - `PAYMOB_CARD_INTEGRATION_ID`
     - Configure the Paymob backend callback to `https://YOUR_MEDUSA_DOMAIN/hooks/payment/paymob_paymob`
   - If logs show `http.jwtSecret not found`, **`JWT_SECRET` is missing** in Railway (and often `COOKIE_SECRET`). Add both (e.g. `openssl rand -hex 32` each), then redeploy.
3. After the first successful deploy (migrations run automatically), optionally seed the Egypt catalog **once** against production:

```bash
# With production DATABASE_URL and Medusa env loaded (e.g. Railway CLI shell):
npm run seed:egypt
```

If checkout ever loses COD on Railway, repair the Egypt region payment-provider assignment directly in Medusa instead of patching the storefront:

```bash
npm run ensure:egypt-payment-providers
# or against Railway / DATABASE_PUBLIC_URL
npm run ensure:egypt-payment-providers:public
```

That script re-attaches `pp_system_default` and adds `pp_paymob_paymob` only when the required Paymob env vars are configured.

### Order confirmation email (buyer)

When **`RESEND_API_KEY`** and **`ORDER_CONFIRMATION_FROM`** are set, the subscriber [`src/subscribers/order-confirmation-email.ts`](src/subscribers/order-confirmation-email.ts) runs on **`order.placed`** (same event as `completeCartWorkflow`). It loads the order via the core **Query** API, normalizes the graph row with [`src/lib/normalize-graph-order-for-email.ts`](src/lib/normalize-graph-order-for-email.ts) (nested `items.item` / `items.detail`, `shipping_methods.shipping_method`, and `summary` totals when root money fields are zero), then builds an HTML receipt (line items, totals, shipping method, ship/bill addresses, gift-wrap add-on if present), and sends it to **`order.email`** through [Resend](https://resend.com/)’s HTTP API (no extra npm dependency).

- If those env vars are **missing**, the subscriber **no-ops** (orders still complete).
- If the order has **no valid email**, it logs and skips (guest checkout must persist email on the cart before completion).
- Optional **`ORDER_CONFIRMATION_BCC`**: single address copied on each send.
- **`STORE_URL`**: used for a storefront link to the order success path; keep it aligned with production.

See [`.env.template`](.env.template) for variable names.

#### Find an order by HORO-# or internal id (support / Admin)

Medusa Admin’s global **Orders** search (`q`) only hits fields the core marks as **searchable** (e.g. numeric `display_id`, customer `email`, address-related text). It does **not** match:

- The customer-facing string **`HORO-18`** (that prefix is storefront-only; the DB stores `display_id` as a number).
- The full internal id **`order_…`** for free-text search.

**Workarounds:** search the **numeric** part only (e.g. `18`), or use email/date filters, or call the HORO lookup route below.

**Custom API (store + publishable key + ops secret):** `GET /store/custom/horo-ops/lookup?q=<query>`

Medusa applies **global admin JWT** to **`/admin/*`** before custom route code runs, so ops tooling must not live under `/admin/`. These routes live under **`/store/custom/horo-ops/*`** and require the same **`x-publishable-api-key`** as the storefront, plus **`x-horo-ops-secret`** (or Medusa Admin session if you add a server path that forwards cookies).

- **`q`** examples: `HORO-18`, `18`, `#18`, or `order_01KP…` (full internal id).
- **Auth:** header **`x-publishable-api-key`** (publishable key from Medusa Admin → Settings) **and** **`x-horo-ops-secret`** matching **`HORO_OPS_BACKEND_SECRET`**. In **production**, `HORO_OPS_BACKEND_SECRET` must be set on the Medusa service or these routes return **503**.
- **Response:** `{ matches: [...], friendly: "HORO-18" | null }` — `matches` is capped at 5 orders with `id`, `display_id`, `email`, `created_at`, `status`, `currency_code`, `total`.

Example (`PK` and `HORO_OPS_BACKEND_SECRET` are the same values you use in `web-next/.env.local`):

```bash
curl -sS \
  -H "x-publishable-api-key: PK" \
  -H "x-horo-ops-secret: YOUR_HORO_OPS_BACKEND_SECRET" \
  "https://<your-medusa-host>/store/custom/horo-ops/lookup?q=HORO-18"
```

#### Internal ops dashboard (web-next + Medusa)

Staff use the **Next.js** app (not Medusa Admin UI): open **`/internal/horo-ops`** on the storefront host, sign in with **`HORO_OPS_UI_PASSWORD`**, then the UI loads data via same-origin **`/api/horo-ops/*`**, which calls Medusa with **`x-publishable-api-key`** and **`x-horo-ops-secret`**. Configure both apps from [`.env.template`](.env.template) and [`web-next/.env.example`](../web-next/.env.example).

Medusa exposes a paged summary at **`GET /store/custom/horo-ops/dashboard?skip=&take=`** (same auth as lookup). Aggregates such as **due soon**, **alarms**, and **money collected** are computed **only over the loaded page** of orders (see `meta.note` in the JSON). Tune SLA and windows with **`HORO_OPS_*`** env vars in `.env.template`.

## 4) Local is the source of truth (remote must match)

Treat **your machine + local Postgres** as canonical. **Railway** should run the **same git revision**, **equivalent env**, **the same schema** (migrations), **data produced by the same seed scripts**, and **media** that resolves the same way.

| Layer | What “identical” means | How to align remote |
|--------|-------------------------|---------------------|
| **Code** | Same commit on `main` / deploy branch as local when you cut a release | Push, deploy Railway from that commit; avoid hot-editing production only. |
| **Database schema** | Same as local after `npm run migrate` | Railway `preDeploy` already runs migrate; use one Postgres per env. |
| **Database data** | Same catalog, categories, feelings, etc. as a freshly seeded local DB **plus** any Admin edits you rely on | Run the same scripts against Railway’s DB (from `medusa-backend`, with Railway env): `npm run seed:egypt:public`, `npm run seed:horo-taxonomy:public`. Optional demo categories: `npm run seed:demo-categories:public`. Compare trees: `npm run dump:categories:public` vs local `npm run dump:categories`. For a **full** clone of local data, use Postgres backup/restore or replication (advanced); scripts cover repo-defined seed + taxonomy. |
| **Env vars** | Same *keys* and semantics as [`.env.template`](.env.template); production values differ only where required (URLs, secrets) | Mirror template on Medusa service; `MEDUSA_BACKEND_URL` must be the public Railway URL. |
| **Media** | Files in bucket + URLs in DB point at a **publicly loadable** base (`MEDUSA_BACKEND_URL/store-media` when using the proxy) | Set S3/Railway bucket vars + `S3_USE_STORE_MEDIA_PROXY=true` as needed; run `npm run rewrite:store-media-urls:public` after URL changes. |

**Laptop vs Railway CLI:** Railway’s internal `DATABASE_URL` is not reachable from your Mac. Reference **`DATABASE_PUBLIC_URL`** on the Medusa service and use the `*:public` npm scripts (they run [`scripts/medusa-exec-public-db.sh`](scripts/medusa-exec-public-db.sh), which also **unsets Redis URLs** for that process so `redis.railway.internal` from `railway run` does not break `medusa exec` on your laptop). See [`.env.template`](.env.template).

### Automated parity check (local DB vs Railway DB)

From **`medusa-backend`** (with the [Railway CLI](https://docs.railway.com/develop/cli) linked to the project):

```bash
npm run parity:snapshot:local
npx @railway/cli run npm run parity:snapshot:remote
npm run parity:check
```

This writes **`.parity/local.json`** and **`.parity/railway.json`** (ignored by git), compares the **`snapshot`** block ( **`meta`** is ignored), and exits **`0`** only when both match. On failure it prints counts, product handles, and category handles that exist on only one side.

- **`npm run parity:check:ignore-media`** — same compare but ignores **`productThumbnailHosts`** (localhost vs production hosts are expected to differ until URLs are unified).

A green check means **database-facing catalog data** in the snapshot matches; it does **not** verify the deployed **git commit** (see Railway dashboard) or **`.env`** secrets.

## 5) Verification checklist

- `GET /health` returns OK
- Admin can see region `Egypt` with currency `egp`
- Admin can see the `Standard` Egypt shipping option and the `Egypt Warehouse` stock location
- Region payment providers include `pp_system_default` and `pp_paymob_paymob` only when Paymob env vars are configured
- The seeded HORO apparel catalog is present along with the hidden `gift-wrap` add-on
- Hidden `gift-wrap` exists but does not appear in the storefront catalog DTO
- Apparel products have `S/M/L/XL/XXL` variants priced at `799 EGP`
- Product media URLs resolve

### Storefront DTO routes (HORO Next.js)

After `npm run dev` (or production URL), with **`x-publishable-api-key`** set:

- `GET /storefront/catalog` — products, occasions, events for the storefront
- `GET /storefront/products/:handle` — single product DTO
- `GET /storefront/occasions/:slug` — single occasion

From the monorepo **`web-next`** app (same env as the storefront):

```bash
cd ../web-next
MEDUSA_BACKEND_URL=http://localhost:9000 NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_... npm run smoke:medusa
```

This extends the basic `/health` + `/store/products` check with **`GET /storefront/catalog`**.

### PDP chips vs Admin categories (storefront)

On the product page, the **purple feeling pill** (e.g. Zodiac) comes from primary feeling slugs derived from the product **category** tree and metadata in the storefront DTO. The **white category pills** under the title are **only** the linked product **category** names from **Organize → Categories** (the internal `feelings` root is excluded). They are **not** populated from **`metadata.occasionSlugs`** (that field is still used elsewhere: browse, `primaryOccasionSlug`, etc.). The Next app may cache the product DTO for up to the configured `revalidate` interval after you save.

To print what is stored in the DB for one product (handles, category list, metadata fields, and the resolved **`storefrontPdpTagLabels`** array the PDP uses for those category chips):

```bash
PRODUCT_HANDLE=emotions-raw-nerve npm run inspect:product-pdp
# “Astral Body” in the catalog uses handle zodiac-astral-body:
PRODUCT_HANDLE=zodiac-astral-body npm run inspect:product-pdp
# against Railway / DATABASE_PUBLIC_URL:
PRODUCT_HANDLE=emotions-raw-nerve npm run inspect:product-pdp:public
```

To remove one slug from **`metadata.occasionSlugs`** from the CLI (same effect as editing product Metadata in Admin; optional cleanup when you no longer need those slugs for routing or shop-by-occasion):

```bash
PRODUCT_HANDLE=emotions-raw-nerve OCCASION_SLUG=just-because npm run clear:product-occasion-slug
# Railway / DATABASE_PUBLIC_URL:
PRODUCT_HANDLE=emotions-raw-nerve OCCASION_SLUG=just-because npm run clear:product-occasion-slug:public
```

### Global PDP delivery windows (store metadata)

The storefront reads **`GET /storefront/settings`** (Medusa) for `store.metadata.delivery`. Operators edit **Medusa Admin → Settings → Store → Metadata** and add a `delivery` object (JSON). The Next PDP still **computes date ranges** from “today” using Egypt-local business days; only the **numeric windows and cutoff** come from Medusa.

**Apply the repo default delivery JSON to the store (CLI, merges into existing `store.metadata`):**

```bash
npm run apply:store-delivery-metadata
# Railway / DATABASE_PUBLIC_URL:
npm run apply:store-delivery-metadata:public
```

The canonical JSON file is [`src/scripts/data/store-delivery-defaults.json`](src/scripts/data/store-delivery-defaults.json) (same numbers as the storefront fallback).

Example `metadata` fragment (merge with existing keys; do not remove unrelated metadata):

```json
{
  "delivery": {
    "standardMinDays": 3,
    "standardMaxDays": 5,
    "expressMinDays": 1,
    "expressMaxDays": 2,
    "cutoffHourLocal": 14,
    "cutoffMinuteLocal": 0,
    "standardMaxBusinessDays": 5
  }
}
```

- **`standardMinDays` / `standardMaxDays`:** range passed to the PDP “Standard · …” date line.
- **`expressMinDays` / `expressMaxDays`:** range for the “Express · …” line.
- **`cutoffHourLocal` / `cutoffMinuteLocal`:** same-day ship cutoff (Egypt local), 0–23 / 0–59.
- **`standardMaxBusinessDays`:** optional; if omitted, defaults to **`standardMaxDays`** for the “often arrives by {date}” line.

If `delivery` is missing or invalid, the storefront uses built-in defaults. After changing Store metadata, **`store.updated`** triggers Next on-demand revalidation when `STOREFRONT_REVALIDATE_*` is configured.

**If numbers on the PDP do not change after you edit metadata:** (1) **Value shape** — `delivery` must be a JSON **object** (or a single JSON **string** that parses to an object). Flat keys like `standardMinDays` at the top level of Store metadata are ignored; nest them under `delivery`. (2) **Next cache** — in production, settings are cached up to **5 minutes** unless revalidation is configured. In local `next dev`, settings refetch every request (`revalidate: 0`). (3) **Verify Medusa** — `curl -H "x-publishable-api-key: …" http://localhost:9000/storefront/settings` should echo your `delivery` object.

### Global PDP size guide presets (store + product metadata)

The storefront reads **`GET /storefront/settings`** for **`store.metadata.sizeTables`** (named presets: `regular`, `oversized`, `fitted`, …) and **`store.metadata.defaultSizeTableKey`**. Each preset includes **`measurements`** (size chart rows) and **`fitModels`** (the “Model is …” lines). On each product, set **`metadata.sizeTableKey`** to a preset name **string** (editable in Admin metadata table). If omitted, the store default preset is used; if store data is missing, Next uses built-in `PDP_DEFAULT_SIZE_PRESET`.

**Apply the repo default size-table JSON to the store:**

```bash
npm run apply:size-tables-metadata
# Railway / DATABASE_PUBLIC_URL:
npm run apply:size-tables-metadata:public
```

Canonical file: [`src/scripts/data/size-tables-defaults.json`](src/scripts/data/size-tables-defaults.json). Operators cannot edit the nested `sizeTables` object in the Admin metadata UI; use this script or the Admin API.

### PDP “Illustrated by” artist (native Medusa metadata)

The storefront prefers **`metadata.artist`** on the product (Medusa Admin → Product → Metadata), shaped as JSON:

- `artist`: `{ "name": "…", "avatarUrl": "https://…" }` (`avatarUrl` optional)

If `artist` is missing, the API falls back to **`metadata.artistSlug`** plus the **`storefront_artist`** module (same as before). Run **`npm run backfill:product-artist-metadata`** to copy name/avatar from that module into `metadata.artist` for each product so PDP data lives on the product row. Optional: `DRY_RUN=1` logs only. Single product: `PRODUCT_HANDLE=…`.

### First-time or fresh database

1. `npm run migrate`
2. `npm run seed:egypt` (when `DATABASE_URL` points at the target DB)
3. Start Medusa, then run the `web-next` smoke command above

## 6) Performance optimizations

### Redis (required for production)

Without Redis, Medusa uses in-memory locking and event processing, causing 409 conflicts on concurrent cart operations. See `.env.template` for setup instructions.

When `REDIS_URL` is set, `medusa-config.ts` registers in **`modules`**:
- **`@medusajs/medusa/event-bus-redis`** — async event processing (see [Redis Event Module](https://docs.medusajs.com/resources/infrastructure-modules/event/redis))
- **`@medusajs/medusa/locking`** with **`@medusajs/locking-redis`** as the default provider — distributed locking for cart/order ops

### Database indexes

The migration `Migration20260414000001_performance_indexes` adds indexes to improve checkout performance:

| Table | Index | Purpose |
|-------|-------|---------|
| `cart` | `customer_id`, `created_at`, `completed_at` | Faster customer cart lookups |
| `cart_line_item` | `cart_id`, `variant_id` | Faster cart item queries |
| `product` | `handle`, `created_at` | Faster product lookups by handle |
| `product_variant` | `product_id`, `sku` | Faster variant lookups |

Indexes are applied automatically via `npm run migrate` (Railway `preDeploy` or local).
