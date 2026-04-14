# Medusa backend — operator scripts

This file lists the **main npm scripts** in `medusa-backend/`, what each one does, and how to run them **locally** vs **against a remote database** (e.g. Railway Postgres from your laptop).

For full setup, deploy, and catalog notes, see [`README.md`](README.md). For HTTP route layout, see [`src/api/README.md`](src/api/README.md).

---

## Editable config, env, and data files

Use these paths when you need to change **defaults** before running a script, or to align **env** with Railway. Links are relative to the **`medusa-backend/`** folder unless noted.

| What | File | Role |
|------|------|------|
| **Env template** | [`.env.template`](.env.template) | Documented variable names and comments; copy to **`.env`** locally (never commit secrets). Railway sets the same keys on the service. |
| **Runtime Medusa config** | [`medusa-config.ts`](medusa-config.ts) | Database pool, Redis toggles, CORS, S3 file module, Paymob — code + env together. |
| **Admin PDP preset widget** | [`src/admin/widgets/product-size-table-key.tsx`](src/admin/widgets/product-size-table-key.tsx) | Dropdown on product page; requires `VITE_BACKEND_URL` in `.env` (see [`src/admin/README.md`](src/admin/README.md)). |
| **PDP delivery defaults (JSON)** | [`src/scripts/data/store-delivery-defaults.json`](src/scripts/data/store-delivery-defaults.json) | Source for `npm run apply:store-delivery-metadata` → **`store.metadata.delivery`**. |
| **PDP size guide presets (JSON)** | [`src/scripts/data/size-tables-defaults.json`](src/scripts/data/size-tables-defaults.json) | Source for `npm run apply:size-tables-metadata` → **`store.metadata.sizeTables`** + **`defaultSizeTableKey`**. |
| **Storefront PDP fallback** | [`../web-next/src/storefront/data/domain-config.ts`](../web-next/src/storefront/data/domain-config.ts) | `PDP_DEFAULT_DELIVERY_RULES` / `PDP_DEFAULT_SIZE_PRESET` when Medusa has no store metadata; keep delivery numbers in sync with delivery JSON if desired. |
| **Egypt catalog fixtures** | [`src/scripts/data/egypt-products.ts`](src/scripts/data/egypt-products.ts) | Product list / handles for `seed:egypt`. |
| **Feelings taxonomy** | [`src/scripts/data/feelings-taxonomy-data.ts`](src/scripts/data/feelings-taxonomy-data.ts) | Feelings / subfeelings tree for seed + `migrate:feelings-categories`. |
| **Merch events** | [`src/scripts/data/merch-events.ts`](src/scripts/data/merch-events.ts) | Seeded merch events. |
| **Legacy PDP media map** | [`src/scripts/data/legacy-product-media.ts`](src/scripts/data/legacy-product-media.ts) | Maps handles to legacy image paths for seed. |
| **Parity snapshots (generated)** | `.parity/local.json`, `.parity/railway.json` under this package | Created by `parity:snapshot:*` (folder is gitignored); compare with `parity:check`, not usually hand-edited. |

**Store metadata shape** (reference, not a repo file): Medusa Admin cannot edit nested **`delivery`** or **`sizeTables`** objects; use the **`apply:*`** scripts or the Admin API. Delivery fields: [`README.md`](README.md) (*Global PDP delivery windows*). Size presets: same README (*Global PDP size guide presets*).

---

## Local vs remote (`:public`)

| Mode | When to use | Database connection |
|------|-------------|---------------------|
| **Local** | Machine can reach the DB with the URL in **`.env`** `DATABASE_URL` (Docker Postgres on `localhost`, VPN, etc.) | `npm run <script>` |
| **Remote from laptop** | Target is **Railway** (or any host) where the private `DATABASE_URL` is not reachable from your network | `npm run <script>:public` |

**`:public` scripts** (where defined) run [`scripts/medusa-exec-public-db.sh`](scripts/medusa-exec-public-db.sh), which:

- If **`DATABASE_PUBLIC_URL`** is set, exports **`DATABASE_URL`** to that value so `medusa exec` can reach Postgres from outside Railway’s private network.
- **`unset`s `REDIS_URL` and `CACHE_REDIS_URL`** for this process. `npx @railway/cli run …` injects production env, including internal hostnames like **`redis.railway.internal`**, which **do not resolve on your Mac**. Without Redis in env, `medusa-config.ts` skips Redis modules and this one-off uses in-memory event/lock behavior for the script lifetime (fine for CLI maintenance).

**Setup for remote runs:**

1. In Railway (Postgres service → Variables), copy **`DATABASE_PUBLIC_URL`** (or the public connection string your team uses for CLI access).
2. In `medusa-backend/.env` (local only; do not commit secrets), set `DATABASE_PUBLIC_URL=...` **or** export it in the shell for one command.
3. From `medusa-backend/`, run the **`:public`** variant.

**Alternative — Railway injects env for you:**

```bash
cd medusa-backend
npx @railway/cli run npm run apply:store-delivery-metadata:public
```

Link the CLI to your project/service first. Ensure the Medusa service (or linked service) defines **`DATABASE_PUBLIC_URL`** (often a reference to the Postgres plugin’s public URL); otherwise `:public` scripts still use private `DATABASE_URL` and may not connect from your laptop. Prefer running **after** a deploy so the script’s **imported JSON / code** matches what you intend.

If you still see **`getaddrinfo ENOTFOUND redis.railway.internal`**, you are on an older `package.json` before the wrapper script, or Redis vars are being re-exported after the wrapper—pull latest and rerun.

---

## Core lifecycle (not `medusa exec`)

| Script | Role |
|--------|------|
| `npm run dev` | Local Medusa dev server (`medusa develop`). |
| `npm run start` | Production-style server (`medusa start`) after `medusa build`. |
| `npm run build` | Compile Medusa for deployment. |
| `npm run migrate` | Apply Medusa DB migrations (`medusa db:migrate`). |

---

## Catalog, pricing, and checkout

| Script | Role | Local | Remote (from laptop) |
|--------|------|-------|----------------------|
| `seed:egypt` | Seeds Egypt region, shipping, COD path, HORO products, images, etc. (see README). | `npm run seed:egypt` | `npm run seed:egypt:public` |
| `migrate:egp-prices` | Normalizes EGP `price` rows / decimal digits for whole-pound storefront display. Run once per DB after migrate. | `npm run migrate:egp-prices` | Same pattern if you add `:public` or use `DATABASE_PUBLIC_URL` in shell |
| `ensure:egypt-payment-providers` | Ensures Egypt payment providers (e.g. COD) are wired for checkout. | `npm run ensure:egypt-payment-providers` | `npm run ensure:egypt-payment-providers:public` |

---

## Store metadata and storefront PDP

| Script | Role | Local | Remote |
|--------|------|-------|--------|
| `apply:store-delivery-metadata` | Writes **`store.metadata.delivery`** from [`src/scripts/data/store-delivery-defaults.json`](src/scripts/data/store-delivery-defaults.json). Admin UI cannot edit object metadata; use this or the Admin API. | `npm run apply:store-delivery-metadata` | `npm run apply:store-delivery-metadata:public` |
| `apply:size-tables-metadata` | Writes **`store.metadata.sizeTables`** + **`store.metadata.defaultSizeTableKey`** from [`src/scripts/data/size-tables-defaults.json`](src/scripts/data/size-tables-defaults.json). Per product, set **`metadata.sizeTableKey`** (string, e.g. `oversized`) in Admin. | `npm run apply:size-tables-metadata` | `npm run apply:size-tables-metadata:public` |
| `backfill:product-artist-metadata` | Copies artist display data into **`metadata.artist`** on products for PDP. Supports `DRY_RUN=1`, `PRODUCT_HANDLE=…`. | `npm run backfill:product-artist-metadata` | `npm run backfill:product-artist-metadata:public` |

Storefront reads **`GET /storefront/settings`** for delivery + size presets; see README § “Global PDP delivery windows” and “Global PDP size guide presets”.

---

## Product inspection and small metadata edits

| Script | Role | Local | Remote |
|--------|------|-------|--------|
| `inspect:product-pdp` | Prints PDP-related fields for one product (`PRODUCT_HANDLE=…`). | `npm run inspect:product-pdp` | `npm run inspect:product-pdp:public` |
| `clear:product-occasion-slug` | Removes one slug from **`metadata.occasionSlugs`** (`PRODUCT_HANDLE`, `OCCASION_SLUG`). | `npm run clear:product-occasion-slug` | `npm run clear:product-occasion-slug:public` |

---

## Taxonomy / categories (feelings, occasions, HORO tree)

| Script | Role | Local | Remote |
|--------|------|-------|--------|
| `seed:demo-categories` | Ensures demo product categories (legacy/demo flows). | `npm run seed:demo-categories` | `npm run seed:demo-categories:public` |
| `seed:horo-taxonomy` | Ensures HORO taxonomy product categories. | `npm run seed:horo-taxonomy` | `npm run seed:horo-taxonomy:public` |
| `migrate:feelings-categories` | Migrates feelings linkage into product categories. | `npm run migrate:feelings-categories` | `npm run migrate:feelings-categories:public` |
| `audit:feelings-categories` | Audits feeling ↔ category assignments. | `npm run audit:feelings-categories` | `npm run audit:feelings-categories:public` |
| `remove:legacy-taxonomy-feelings` | Removes legacy taxonomy feelings category after migration. | `npm run remove:legacy-taxonomy-feelings` | `npm run remove:legacy-taxonomy-feelings:public` |
| `dump:categories` | Dumps product category tree for debugging. | `npm run dump:categories` | `npm run dump:categories:public` |

---

## Media and storage

| Script | Role | Local | Remote |
|--------|------|-------|--------|
| `diagnose:s3` | Checks S3 / file storage configuration from the running Medusa context. | `npm run diagnose:s3` | Run with remote env (Railway shell / `railway run`) |
| `rewrite:store-media-urls` | Rewrites stored media URLs to match current storage base (migration-style). | `npm run rewrite:store-media-urls` | `npm run rewrite:store-media-urls:public` |

---

## Parity (local DB vs Railway)

| Script | Role |
|--------|------|
| `parity:snapshot:local` | Writes catalog snapshot to `.parity/local.json` using local `DATABASE_URL`. |
| `parity:snapshot:remote` | Writes snapshot to `.parity/railway.json` using **`DATABASE_PUBLIC_URL`** when set (same swap pattern as `:public` scripts). |
| `parity:check` | Compares the two JSON files. |
| `parity:check:ignore-media` | Same comparison, ignoring media URL differences. |

Workflow (from `medusa-backend/`):

```bash
npm run parity:snapshot:local
# Ensure DATABASE_PUBLIC_URL is set, then:
npm run parity:snapshot:remote
npm run parity:check
```

---

## Other

| Script | Role |
|--------|------|
| `sync:local-to-railway` | Bash helper to sync data from local to Railway (see `scripts/sync-local-to-railway.sh`; use with care). |
| `test:unit` / `test:integration:http` / `test:integration:modules` | Jest test suites. |

---

## Quick reference — all `:public` pairs

Run from **`medusa-backend/`** with **`DATABASE_PUBLIC_URL`** set when hitting Railway from your machine:

- `seed:egypt:public`
- `ensure:egypt-payment-providers:public`
- `rewrite:store-media-urls:public`
- `seed:demo-categories:public`
- `dump:categories:public`
- `inspect:product-pdp:public`
- `apply:store-delivery-metadata:public`
- `apply:size-tables-metadata:public`
- `clear:product-occasion-slug:public`
- `backfill:product-artist-metadata:public`
- `migrate:feelings-categories:public`
- `audit:feelings-categories:public`
- `seed:horo-taxonomy:public`
- `remove:legacy-taxonomy-feelings:public`

Scripts without a `:public` alias still work remotely if **`DATABASE_URL`** (or `DATABASE_PUBLIC_URL` exported as `DATABASE_URL`) points at the remote DB when you invoke `medusa exec`.
