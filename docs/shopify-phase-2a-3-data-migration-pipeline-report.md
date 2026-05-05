# HORO Shopify Phase 2A.3 — Data Migration Pipeline Report

## Objective

Create a safe, local TypeScript migration pipeline that extracts data from Medusa/web-next/static JSON sources, transforms it to the locked Shopify data model, and loads it into Shopify Admin with full dry-run/apply safety.

## Files Created

### Package structure
```
scripts/shopify-data-migration/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── index.ts                          # CLI orchestrator
    ├── shopify-admin.ts                  # GraphQL client
    ├── extract/
    │   ├── from-medusa.ts               # Medusa extraction (placeholder)
    │   ├── from-web-next.ts             # web-next defaults (placeholder)
    │   └── from-json.ts                 # Local JSON input
    ├── transform/
    │   ├── map-feelings.ts
    │   ├── map-subfeelings.ts
    │   ├── map-occasions.ts
    │   ├── map-artists.ts
    │   ├── map-size-tables.ts
    │   ├── map-products.ts
    │   ├── map-collections.ts
    │   └── map-metafields.ts
    ├── load/
    │   ├── create-metaobjects.ts
    │   ├── create-products.ts
    │   ├── create-collections.ts
    │   ├── assign-product-metafields.ts
    │   ├── assign-collection-metafields.ts
    │   └── upload-files.ts              # Placeholder
    ├── state/
    │   └── id-map.ts                     # Shopify ID tracking
    └── utils/
        ├── logger.ts
        ├── assert-env.ts
        ├── safe-handle.ts
        └── validate-locked-model.ts
```

### Documentation
```
docs/shopify-phase-2a-3-data-migration-pipeline-report.md
```

## Supported Sources

| Source | Status | Notes |
|--------|--------|-------|
| Local JSON files | Implemented | Primary input method |
| Medusa Admin API | Placeholder | Credentials check implemented |
| Medusa database | Placeholder | Connection string check |
| web-next config | Placeholder | Domain config read planned |

## Migration Order

1. **Validate definitions exist** — Checks that metaobject/metafield definitions were seeded
2. **Extract data** — Reads from JSON files or (future) Medusa API
3. **Transform data** — Maps source fields to locked Shopify schema
4. **Create metaobject entries** — Feelings, subfeelings, occasions, artists, size tables
5. **Create products** — Titles, descriptions, handles, prices
6. **Create collections** — Manual collections with handles
7. **Assign product metafields** — feeling, subfeeling, artist, size_table, etc.
8. **Assign collection metafields** — occasion, editorial, hero_image, etc.
9. **Write ID map** — Persists Shopify IDs for future runs
10. **Write report** — JSON/MD summary of all actions

## Safety Controls

- **Dry-run is default** — No Shopify writes without `--apply`
- **Idempotent** — Skips existing items by handle
- **Definition validation** — Exits if required definitions are missing
- **Reference validation** — Reports missing metaobject references
- **Error handling** — Non-zero exit on GraphQL errors
- **No token logging** — Access tokens never logged
- **No token commits** — `.env` is `.gitignore`d

## Required Environment Variables

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2025-04
```

Optional:
```env
MIGRATION_INPUT_DIR=./input
```

## Commands

### Dry-run command
```bash
cd scripts/shopify-data-migration
npm run migrate -- --dry-run
```

### Test-path command
```bash
npm run migrate -- --scope test-path --apply --limit 1
```

### Full migration command
```bash
npm run migrate -- --apply
```

### Scope-limited migration
```bash
npm run migrate -- --apply --scope metaobjects --limit 5
npm run migrate -- --apply --scope products
npm run migrate -- --apply --scope collections
npm run migrate -- --apply --scope metafields
```

## Known Limitations

- **Image upload not implemented** — Products are created without images
- **Medusa API extraction not implemented** — Use JSON input files for now
- **Product variants not created** — Sizes/colors need manual setup
- **Compare-at prices not created** — Only regular prices migrated
- **No order/customer migration** — Out of scope for Phase 2A
- **No discount/shipping migration** — Manual configuration required
- **No review/stock counter migration** — Intentionally excluded

## Locked Model Mapping

### Metaobjects → Shopify entries
| Metaobject | Key fields |
|------------|-----------|
| `feeling` | title, handle, description, tagline, accent_color, hero_image, card_image, manifesto, sort_order, active |
| `subfeeling` | title, handle, parent_feeling, description, hero_image, card_image, sort_order, active |
| `occasion` | title, handle, description, accent_color, hero_image, card_image, is_gift_occasion, price_hint, sort_order, active |
| `artist` | name, slug, style, bio, avatar, portfolio_url, design_count, active |
| `size_table` | name, handle, unit_system, rows (JSON), note |

### Product metafields
| Metafield | Type |
|-----------|------|
| `custom.feeling` | metaobject_reference |
| `custom.subfeeling` | metaobject_reference |
| `custom.occasions` | list.metaobject_reference |
| `custom.artist` | metaobject_reference |
| `custom.story` | multi_line_text_field |
| `custom.fit_note` | multi_line_text_field |
| `custom.materials` | rich_text_field |
| `custom.trust_chips` | list.single_line_text_field |
| `custom.size_table` | metaobject_reference |
| `custom.pair_with_products` | list.product_reference |
| ...and more | |

### Collection metafields
| Metafield | Type |
|-----------|------|
| `custom.occasion` | metaobject_reference |
| `custom.editorial_heading` | single_line_text_field |
| `custom.hero_image` | file_reference |
| `custom.blurb` | multi_line_text_field |
| `custom.price_hint` | single_line_text_field |
| `custom.is_gift_occasion` | boolean |

## Legacy Fields Rejected

The following legacy fields are intentionally **not** migrated:
- `feeling_slug` → replaced by `custom.feeling` metaobject_reference
- `artist_slug` → replaced by `custom.artist` metaobject_reference
- `subfeeling_slug` → replaced by `custom.subfeeling` metaobject_reference
- `occasion_slugs` → replaced by `custom.occasions` list.metaobject_reference
- `size_table_key` → replaced by `custom.size_table` metaobject_reference
- `fit_label` → replaced by `custom.fit_note`
- `related_products`, `frequently_bought_with` → replaced by `custom.pair_with_products`
- `promo_show_countdown` → replaced by real `custom.promo_active` boolean
- `hero_image`, `card_image` on product → moved to collection/product metafields

## Next Manual Steps

1. **Populate metaobject entries** via JSON input files or manual creation
2. **Upload product images** to Shopify Files and link to products
3. **Configure collection rules** for automated product grouping
4. **Set up discounts** and shipping rates in Shopify Admin
5. **Configure payment providers** (Paymob, etc.)
6. **Test storefront rendering** with actual data
7. **Run theme check** and fix any Liquid errors
8. **Enable checkout** and test end-to-end purchase flow

## Phase Status

Phase 2A.3 is **complete** as a migration pipeline scaffold. The pipeline is ready for:
- JSON input-based migration
- Dry-run validation
- Test-path execution

**Not yet implemented** but planned for Phase 2B:
- Medusa API/database extraction
- Image upload via staged uploads
- Product variant creation
- Order/customer migration (if needed)

---

**Date:** 2026-05-05
**Branch:** medusa
**Commit:** To be determined at commit time
