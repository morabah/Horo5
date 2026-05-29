# HORO Shopify Admin Definition Seeder

Automates creation of Shopify Admin metaobject and metafield definitions from the locked HORO data model.

## What this script does

1. Connects to your Shopify store via the Admin GraphQL API.
2. Checks which metaobject definitions and metafield definitions already exist.
3. Creates missing definitions (if `--apply` is passed).
4. Reports conflicts if an existing definition has a different type than the locked model expects.
5. Generates JSON and Markdown reports in `output/`.

## What this script does NOT do

- Does NOT create products, collections, discounts, or shipping rates.
- Does NOT modify theme code.
- Does NOT modify checkout.
- Does NOT create legacy slug-based fields (e.g., `custom.feeling_slug`).
- Does NOT run automatically in CI — it requires a real Admin API token.

## Setup

### 1. Create a Shopify custom app

1. In your Shopify Admin, go to **Settings → Apps and sales channels → Develop apps**.
2. Click **Create an app**.
3. Name it `HORO Admin Seeder`.

### 2. Configure Admin API permissions

1. In the app, go to **Configuration → Admin API integration**.
2. Enable these scopes:
   - `read_metaobject_definitions`
   - `write_metaobject_definitions`
   - `read_metafield_definitions`
   - `write_metafield_definitions`
3. Save and **Install the app** on your store.
4. Go to the **API credentials** tab and click **Reveal token once** next to Admin API access token.
5. Copy the token (starts with `shpat_`).

### 3. Configure environment

```bash
cd scripts/shopify-admin-seed
cp .env.example .env
```

Edit `.env` and paste:

```env
SHOPIFY_STORE_DOMAIN=horo-9109.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-04
```

> ⚠️ Never commit `.env`. It is already in `.gitignore`.

### 4. Install dependencies

```bash
npm install
```

### 5. Run type check

```bash
npm run type-check
```

## Usage

### Dry run (default — no changes)

Preview what the script would create without touching your store:

```bash
npm run seed:definitions:dry
```

### Apply definitions

Actually create missing definitions in Shopify Admin:

```bash
npm run seed:definitions
```

### Include optional drop metaobject (Phase 2C)

```bash
npm run seed:definitions:all
```

Or manually:

```bash
npx tsx src/index.ts --apply --include-drops
```

### Check-only mode

Verify existing definitions without creating anything:

```bash
npm run check
```

### Verbose output

Add `--verbose` to any command for detailed logging:

```bash
npx tsx src/index.ts --apply --verbose
```

## CLI options

| Flag | Description |
|------|-------------|
| `--dry-run` | (default) Preview changes without creating |
| `--apply` | Actually create definitions |
| `--check` | Verify existing definitions only |
| `--include-drops` | Include optional `drop` metaobject |
| `--verbose` | Detailed logging |
| `--help` | Show help |

### Seed launch content (collections, metaobjects, pages)

After definitions exist, seed taxonomy entries and collections:

```bash
npm run seed:launch-content
npm run seed:launch-content:dry   # preview only
npm run verify:full               # definitions + content counts
```

Creates feelings, subfeelings, occasions, linked collections (`custom.feeling` / `custom.occasion`), and pages (`feelings`, `occasions`, `gifts-hub`). Idempotent — safe to re-run.

**OAuth scopes:** include `read_content`, `write_content` (pages) and `read_publications`, `write_publications` (publish collections to Online Store). Re-authorize the Partner app after updating `SHOPIFY_SCOPES` in `.env`.

### Full launch automation (everything)

```bash
npm run automate:launch
# or step-by-step:
npm run seed:launch-all
npm run patch:theme-local
cd ../../shopify-theme && shopify theme push --theme elegant-textures --allow-live --only config/settings_data.json
```

Runs **content** (taxonomy + collections + pages) then **catalog** (size table, artist, 3 launch products with variants/SKUs/inventory, all product metafields, collection membership), **local theme settings** (`horo_gift_wrap_product`, trust/delivery copy, `horo_incentives_live=false`), then `verify:full`.

**OAuth token cache:** after first browser login, token is saved to `.shopify-oauth-token.json` (gitignored). Re-authorize with `SHOPIFY_FORCE_OAUTH=1 npm run seed:launch-content`.

**Partner app scopes (merchant approval required):** In [Partners](https://partners.shopify.com) → Apps → your app → **API access**, enable and get merchant approval for:

| Scope | Enables |
|-------|---------|
| `write_content` / `read_content` | Hub pages (`feelings`, `occasions`, `gifts-hub`) |
| `read_publications` / `write_publications` | Publish collections to Online Store via API |
| `read_themes` / `write_themes` | Patch `settings_data.json` via Admin API (optional if you use `patch:theme-local` + `shopify theme push`) |

Until `write_content` is approved, create the three pages in **Admin → Pages** with templates `feelings`, `occasions`, `gifts-hub` (handles must match).

| Script | What it does |
|--------|----------------|
| `seed:launch-content` | Feelings, subfeelings, occasions, collections, pages |
| `seed:launch-catalog` | Size table, artist, 3 products, metafields, collections, theme settings |
| `seed:launch-all` | Both + verify |

**Still manual:** product photos, publishing collections to Online Store (if OAuth lacks publications scope), checkout/payment/policy audit.

Uses REST for product variants and theme `settings_data.json`; GraphQL for metafields and collections.

## Idempotency

The script is fully idempotent:

- If a definition already exists with the **exact same type and fields**, it is **skipped**.
- If a definition exists with a **conflicting type** (e.g., `custom.feeling` is `single_line_text_field` instead of `metaobject_reference`), the script **reports a conflict** and exits with an error.
- If a definition exists but is **missing some fields**, the script reports a conflict (fields cannot be added programmatically to existing metaobject definitions — this must be done manually in Shopify Admin).
- Running the script multiple times with `--apply` is safe — nothing will be duplicated.

## Interpreting conflicts

Example conflict:

```
[warn] metafield:custom.feeling (PRODUCT): exists with type "single_line_text_field" but desired type is "metaobject_reference"
```

This means someone already created `custom.feeling` as a text field. You must either:

1. Delete the existing definition in Shopify Admin (this removes data — be careful), or
2. Update the script's locked model to match the existing type (not recommended).

To resolve: go to **Settings → Custom data → Metafields → Products**, find `custom.feeling`, and delete it. Then re-run the script.

## Created definitions

### Metaobject definitions

| Definition | Fields | Phase |
|-----------|--------|-------|
| `feeling` | title, handle, description, tagline, accent_color, hero_image, card_image, manifesto, sort_order, active | Core |
| `subfeeling` | title, handle, parent_feeling, description, hero_image, card_image, sort_order, active | Core |
| `occasion` | title, handle, description, accent_color, hero_image, card_image, is_gift_occasion, price_hint, sort_order, active | Core |
| `artist` | name, slug, style, bio, avatar, portfolio_url, design_count, active | Core |
| `size_table` | name, handle, unit_system, rows (JSON), note | Core |
| `drop` | name, slug, status, teaser, body, launch_at, end_at, hero_image, products, sort_order, active | Optional (2C) |

### Product metafield definitions

See `src/definitions/product-metafields.ts` for the full list.

Key fields: `custom.feeling`, `custom.subfeeling`, `custom.occasions`, `custom.artist`, `custom.story`, `custom.fit_note`, `custom.size_table`, `custom.pair_with_products`, `custom.promo_active`, `custom.promo_ends_at`, and more.

### Collection metafield definitions

See `src/definitions/collection-metafields.ts` for the full list.

Key fields: `custom.feeling`, `custom.occasion`, `custom.editorial_heading`, `custom.hero_image`, `custom.is_gift_occasion`, and more.

### Legacy fields NOT created

The script explicitly does NOT create these legacy fields:

- `custom.feeling_slug` → replaced by `custom.feeling` (metaobject_reference)
- `custom.artist_slug` → replaced by `custom.artist` (metaobject_reference)
- `custom.subfeeling_slug` → replaced by `custom.subfeeling` (metaobject_reference)
- `custom.occasion_slugs` → replaced by `custom.occasions` (list.metaobject_reference)
- `custom.size_table_key` → replaced by `custom.size_table` (metaobject_reference)
- `custom.fit_label` → replaced by `custom.fit_note`
- `custom.related_products` → replaced by `custom.pair_with_products`
- `custom.frequently_bought_with` → replaced by `custom.pair_with_products`
- `custom.promo_show_countdown` → replaced by `custom.promo_active`
- `custom.size_fit_note` → deprecated; use `custom.fit_note`

## Output

After running, two files are written to `output/`:

- `seed-report.json` — Machine-readable report
- `seed-report.md` — Human-readable Markdown summary

Both files are `.gitignore`d and should not be committed.

## Safety

- Token is read from `.env` only — never hardcoded.
- `--dry-run` is the default mode. You must explicitly pass `--apply` to make changes.
- If any conflict is found, the script exits with code 1 and does not create anything.
- If the token is missing or invalid, the script exits before any network call.

## Next steps after seeding

1. Create metaobject entries (e.g., "Zodiac", "Cancer", "Birthday", artist profiles).
2. Assign metaobject references to products via the Shopify Admin product editor.
3. Create collections and assign collection metafields.
4. Create the gift wrap product.
5. Configure free-shipping shipping rate and bundle discount in Admin.
6. Test the validation path: Home → Feelings → Zodiac → Cancer → Product → Cart → Checkout.

## Troubleshooting

### "Cannot find module 'fs' or its corresponding type declarations"

Run `npm install` to install `@types/node`.

### "HTTP 401"

Your Admin API access token is invalid or expired. Generate a new one from the custom app.

### "GraphQL errors: Access denied"

Your custom app is missing required scopes. Re-check the permissions list above.

### "metaobjectDefinitionCreate error: ... already exists"

This should not happen — the script checks for existence first. If it does, the existing definition may have been created between the check and the create call. Re-run the script.

## License

Private — part of the HORO Shopify migration.
