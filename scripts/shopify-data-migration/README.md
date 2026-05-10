# HORO Shopify Data Migration Pipeline

Migrates HORO data from Medusa/web-next/static JSON into Shopify Admin according to the locked data model.

## Prerequisites

1. **Shopify metaobject and metafield definitions must already exist.**
   Run the seeder first:
   ```bash
   cd ../shopify-admin-seed
   npm run seed:definitions
   ```

2. **Create a Shopify custom app** with these Admin API scopes:
   - `read_metaobjects`, `write_metaobjects`
   - `read_products`, `write_products`
   - `read_collections`, `write_collections`
   - `read_files`, `write_files` (for image upload)

3. **Copy `.env.example` to `.env`** and fill in your credentials.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SHOPIFY_STORE_DOMAIN` | Yes | Your store domain (e.g., `horo-9109.myshopify.com`) |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Yes | Custom app Admin API token (starts with `shpat_`) |
| `SHOPIFY_API_VERSION` | Yes | API version (e.g., `2025-04`) |
| `MIGRATION_INPUT_DIR` | No | Directory for JSON input files (default: `./input`) |
| `MEDUSA_BACKEND_URL` | No | Medusa storefront API URL (e.g., `http://localhost:9000`) |
| `MEDUSA_ADMIN_API_TOKEN` | No | Medusa publishable API key for storefront access |

When `MEDUSA_BACKEND_URL` is set, the pipeline fetches live data from Medusa and merges it with any JSON input files. Medusa data takes precedence.

## Commands

### Dry-run (default)
Preview what would be created without making any Shopify writes:
```bash
npm run migrate
# or explicitly:
npm run migrate -- --dry-run
```

### Apply
Actually create data in Shopify Admin:
```bash
npm run migrate -- --apply
```

### Scope filtering
Migrate only specific data types:
```bash
npm run migrate -- --scope metaobjects     # Only metaobject entries
npm run migrate -- --scope products         # Only products
npm run migrate -- --scope collections     # Only collections
npm run migrate -- --scope metafields      # Only metafield assignments
npm run migrate -- --scope test-path      # Minimal test data set
```

### Limit
Limit number of items per scope:
```bash
npm run migrate -- --apply --limit 5
```

## JSON Input Format

Place JSON files in `./input/` (or set `MIGRATION_INPUT_DIR`):

### `feelings.json`
```json
[
  {
    "title": "Zodiac",
    "handle": "zodiac",
    "description": "Astrology-inspired designs",
    "tagline": "Wear your sign",
    "accent_color": "#6B5B95",
    "active": true
  }
]
```

### `products.json`
```json
[
  {
    "title": "Cancer Tee",
    "handle": "cancer-tee",
    "description": "For the intuitive Cancer",
    "price": 450,
    "feeling": "zodiac",
    "subfeeling": "cancer",
    "active": true
  }
]
```

See `.env.example` for all supported input files.

## Output

After `--apply`, the script writes:
- `output/id-map.json` — Shopify IDs mapped to source handles
- `output/migration-report.json` — Detailed migration results

## Test Path

Run a minimal migration for quick validation:
```bash
npm run migrate -- --scope test-path --apply --limit 1
```

This creates:
- 1 feeling (Zodiac)
- 1 subfeeling (Cancer)
- 1 artist
- 1 size table
- 1 Cancer product
- Gift Wrap product if present

## Safety

- **Dry-run is the default.** You must pass `--apply` to write to Shopify.
- Products are matched by handle. Existing products are skipped unless `--update-existing` is passed (not yet implemented).
- Missing references are reported, not silently ignored.
- The script exits non-zero on errors so CI can catch failures.

## Next Steps

After migration, manually in Shopify Admin:
1. Configure collections with automated rules
2. Set up discounts and shipping
3. Configure payment providers
4. Review and publish the theme

## Known Limitations

- Order/customer migration is out of scope for Phase 2A.
- Multi-location inventory requires knowing the Shopify location ID; falls back to simple quantity.
- Web-next static defaults extraction (`from-web-next.ts`) is not yet implemented.
