# Catalog Sync

Catalog sync turns the designer-maintained product sheet plus the local image inbox into the existing `drops/<handle>/product.yaml` tree, then runs the existing drop importer and inventory scripts.

## Runbook

1. Update the Google Sheet tab named `products`.
2. Put product images in `medusa-backend/inbox/<handle>/`.
3. Set `CATALOG_SHEET_CSV_URL` to the public CSV export URL:

   ```text
   https://docs.google.com/spreadsheets/d/<sheet-id>/gviz/tq?tqx=out:csv&sheet=products
   ```

4. Preview locally:

   ```bash
   npm run catalog:sync:dry
   ```

5. Apply when the report is clean:

   ```bash
   npm run catalog:sync
   ```

Use `npm run catalog:sync -- --only=handle-one,handle-two` to scope a run, and `--force` to ignore sync/import stamps.

## Sheet Columns

| Column | Required | Notes |
| --- | --- | --- |
| `handle` | Yes | Unique lowercase slug. This is the primary key and folder name. |
| `status` | Yes | `draft`, `ready`, or `archived`. Only `ready` rows are scaffolded/imported. |
| `title`, `story` | Ready rows | Display title and PDP story. |
| `description` | No | Falls back to `story` in the importer. |
| `feeling`, `subfeeling` | Ready rows | Existing category taxonomy slugs. |
| `occasions` | No | Comma-separated slugs. Missing occasions are created by the importer. |
| `apparelCategory` | No | Slash path, for example `apparel/tops/t-shirts`. |
| `priceEgp` | Ready rows | Whole EGP integer. |
| `originalPriceEgp` | No | Must be greater than `priceEgp` when present. |
| `sizes` | No | Comma list. Defaults to `S,M,L,XL,XXL`. |
| `garmentColor`, `decorationType`, `fitLabel` | No | `decorationType` is `plain`, `graphic`, `embroidered`, or `mixed`. |
| `trustBadges`, `merchandisingBadge`, `stockNote`, `sizeTableKey` | No | PDP metadata. `trustBadges` is comma-separated. |
| `artist` | No | Artist slug. The importer creates a placeholder artist if missing in Medusa. |
| `capsuleSlugs`, `complementarySlugs`, `frequentlyBoughtWithSlugs`, `customersAlsoBoughtSlugs` | No | Comma-separated slugs. |
| `launchAt`, `sunsetAt` | No | ISO datetime, for example `2026-05-01T00:00:00Z`. |
| `imageFolder` | No | Relative folder override. Defaults to `inbox/<handle>`. |
| `stockPerSize` | No | Either uniform `50` or a full map like `S:30,M:60,L:60,XL:40,XXL:20`. |

Draft rows can be incomplete. Ready rows must have all required commerce, taxonomy, and image fields.

## Image Inbox

Each ready row needs an image folder:

```text
medusa-backend/inbox/<handle>/
```

Filename rules:

| Filename pattern | Result |
| --- | --- |
| `main.jpg`, `main.png`, `main.webp` | Required main product image. |
| `lifestyle*.jpg` | Tagged gallery image with `tag: lifestyle`. |
| `flat_lay*.jpg` | Tagged gallery image with `tag: flat_lay`. |
| `proof_fabric*.jpg` | Tagged gallery image with `tag: proof_fabric`. |
| `proof_print*.jpg` | Tagged gallery image with `tag: proof_print`. |
| `proof_wash*.jpg` | Tagged gallery image with `tag: proof_wash`. |
| Any other supported image | Included as an untagged gallery image. |

Supported extensions are `.jpg`, `.jpeg`, `.png`, and `.webp`. Numeric suffixes are fine, for example `lifestyle-1.jpg` and `lifestyle-2.jpg`.

The inbox is staging only and is git-ignored except for `inbox/.gitkeep`. After sync, the generated images live under `drops/<handle>/`, matching the existing importer flow.

## Status Lifecycle

- `draft`: kept in the sheet, skipped by scaffolding/import.
- `ready`: validated, scaffolded into `drops/<handle>/`, imported into Medusa, then stock/inventory is applied when `stockPerSize` is present.
- `archived`: flagged in the report and skipped. Product sunsetting/deletion remains manual.

## Report

`npm run catalog:sync:dry` writes `catalog-sync-report.md`. Read it top-down:

- Summary counts show selected rows, validation errors, scaffold changes, import handles, and stock-map handles.
- Validation rows are keyed by sheet row number.
- Scaffold rows show whether each drop was added, changed, unchanged, or errored, with the image filenames used.
- Dry-run output is written to a temporary folder and never touches Medusa.

Common errors:

- Missing `main.*`: add a main image to the row's image folder.
- Invalid slug: use lowercase letters, numbers, and hyphens.
- Missing stock size: `stockPerSize` maps must include every size in the row's `sizes`.
- Duplicate handle: keep one sheet row per product handle.

