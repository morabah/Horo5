# Medusa v2 Backend (Railway + Egypt Catalog)

This service sets up Medusa v2 with PostgreSQL, seeds an Egypt region (`egp`), and creates 5 test products with S/M/L/XL/XXL variants priced at `799 EGP`.

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
- 5 products, each with:
  - `metadata.titleEn`
  - `metadata.descriptionEn`
  - size variants `S/M/L/XL/XXL`
  - variant prices: `79900` (`egp` minor units = 799 EGP)
- Product images uploaded from:
  - `../web/public/images/tees/emotions_vibe_1_1774374034307.png`
  - `../web/public/images/tees/zodiac_vibe_1_1774374128029.png`
  - `../web/public/images/tees/fiction_vibe_1_1774374247152.png`
  - `../web/public/images/tees/career_vibe_1_1774374340994.png`
  - `../web/public/images/hero/hero-model.png`

## 3) Deploy on Railway (PostgreSQL + Node)

**If Railway shows “Railpack could not determine how to build the app”:** the service is building from the **repository root** (monorepo) instead of only `medusa-backend`. Fix it in either of these ways:

- **Recommended:** Leave the service **root directory** empty (repo root). The repository includes a root [`Dockerfile`](../Dockerfile) and [`railway.toml`](../railway.toml) so Railway builds Medusa with Docker and runs `npm run migrate` before start. The root [`.dockerignore`](../.dockerignore) excludes other apps and large folders (e.g. `shopify-headless`, `Guidelines `) so the Docker build context stays small and builds are less likely to hit **timeouts** on first `npm ci` / `medusa build`.
- **Alternative:** Set **Root Directory** to **`medusa-backend`** so Railpack detects Node from `package.json`. Set **Custom Config File** to **`/medusa-backend/railway.toml`** if deploy settings are not applied. (Egypt seed images use `../web/public/...`; use the root `Dockerfile` flow if those files must be in the image.)

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
   - `STORE_CORS` — Vercel storefront origin(s), comma-separated, e.g. `https://your-app.vercel.app`
   - `ADMIN_CORS` / `AUTH_CORS` — align with Medusa admin and your Vercel origins
   - `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_ADMIN_ONBOARDING_TYPE`
   - If logs show `http.jwtSecret not found`, **`JWT_SECRET` is missing** in Railway (and often `COOKIE_SECRET`). Add both (e.g. `openssl rand -hex 32` each), then redeploy.
3. After the first successful deploy (migrations run automatically), optionally seed the Egypt catalog **once** against production:

```bash
# With production DATABASE_URL and Medusa env loaded (e.g. Railway CLI shell):
npm run seed:egypt
```

## 4) Local is the source of truth (remote must match)

Treat **your machine + local Postgres** as canonical. **Railway** should run the **same git revision**, **equivalent env**, **the same schema** (migrations), **data produced by the same seed scripts**, and **media** that resolves the same way.

| Layer | What “identical” means | How to align remote |
|--------|-------------------------|---------------------|
| **Code** | Same commit on `main` / deploy branch as local when you cut a release | Push, deploy Railway from that commit; avoid hot-editing production only. |
| **Database schema** | Same as local after `npm run migrate` | Railway `preDeploy` already runs migrate; use one Postgres per env. |
| **Database data** | Same catalog, categories, feelings, etc. as a freshly seeded local DB **plus** any Admin edits you rely on | Run the same scripts against Railway’s DB (from `medusa-backend`, with Railway env): `npm run seed:egypt:public`, `npm run seed:horo-taxonomy:public`. Optional demo categories: `npm run seed:demo-categories:public`. Compare trees: `npm run dump:categories:public` vs local `npm run dump:categories`. For a **full** clone of local data, use Postgres backup/restore or replication (advanced); scripts cover repo-defined seed + taxonomy. |
| **Env vars** | Same *keys* and semantics as [`.env.template`](.env.template); production values differ only where required (URLs, secrets) | Mirror template on Medusa service; `MEDUSA_BACKEND_URL` must be the public Railway URL. |
| **Media** | Files in bucket + URLs in DB point at a **publicly loadable** base (`MEDUSA_BACKEND_URL/store-media` when using the proxy) | Set S3/Railway bucket vars + `S3_USE_STORE_MEDIA_PROXY=true` as needed; run `npm run rewrite:store-media-urls:public` after URL changes. |

**Laptop vs Railway CLI:** Railway’s internal `DATABASE_URL` is not reachable from your Mac. Reference **`DATABASE_PUBLIC_URL`** on the Medusa service and use the `*:public` npm scripts (they prefer it when set). See comments in [`.env.template`](.env.template).

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
- Exactly 5 seeded products exist
- Each product has 5 variants (`S/M/L/XL/XXL`)
- Every variant price is `799 EGP`
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

### First-time or fresh database

1. `npm run migrate`
2. `npm run seed:egypt` (when `DATABASE_URL` points at the target DB)
3. Start Medusa, then run the `web-next` smoke command above
