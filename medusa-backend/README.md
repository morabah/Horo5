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

1. Create a Railway project and add **PostgreSQL**. Copy its connection string into `DATABASE_URL` on the Medusa service (use Railway’s guidance for direct vs pooled URLs).
2. Add a **Node** service from this repo with **root directory** `medusa-backend`. Build/start are defined in [`railway.toml`](railway.toml) (`npm ci && npm run build`, `npm run start`). `preDeployCommand` runs `npm run migrate` before each deploy.
3. Set environment variables on the Medusa service (see [`.env.template`](.env.template)):
   - `DATABASE_URL`
   - `MEDUSA_BACKEND_URL` — public `https://` URL of this Railway service (no trailing slash)
   - `STORE_CORS` — Vercel storefront origin(s), comma-separated, e.g. `https://your-app.vercel.app`
   - `ADMIN_CORS` / `AUTH_CORS` — align with Medusa admin and your Vercel origins
   - `JWT_SECRET`, `COOKIE_SECRET`, `MEDUSA_ADMIN_ONBOARDING_TYPE`
4. After the first successful deploy (migrations run automatically), optionally seed the Egypt catalog **once** against production:

```bash
# With production DATABASE_URL and Medusa env loaded (e.g. Railway CLI shell):
npm run seed:egypt
```

## 4) Verification checklist

- `GET /health` returns OK
- Admin can see region `Egypt` with currency `egp`
- Exactly 5 seeded products exist
- Each product has 5 variants (`S/M/L/XL/XXL`)
- Every variant price is `799 EGP`
- Product media URLs resolve
