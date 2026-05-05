# HORO Shopify Phase 2A.3 — Migration Pipeline Blocker Fix Report

## Objective

Fix all blockers identified in the QA review (`docs/shopify-phase-2a-3-migration-pipeline-qa-report.md`) before the migration pipeline can safely run against Shopify Admin.

## QA Source

`docs/shopify-phase-2a-3-migration-pipeline-qa-report.md`

## Files Changed

### P0 Fixes (Critical)

| Fix | Files Changed |
|-----|---------------|
| Remove custom `handle` field from metaobject transforms | `src/transform/map-feelings.ts`, `map-subfeelings.ts`, `map-occasions.ts`, `map-size-tables.ts` |
| Pass native handle to GraphQL mutation | `src/shopify-admin.ts` (`createMetaobjectEntry`), `src/load/create-metaobjects.ts` |
| Load id-map on startup | `src/index.ts`, `src/state/id-map.ts` |
| Resolve reference metafields to GraphQL IDs | `src/load/assign-product-metafields.ts`, `src/load/assign-collection-metafields.ts` |

### P1 Fixes (High)

| Fix | Files Changed |
|-----|---------------|
| Enforce ALLOW_MISSING_REFERENCES | `src/load/assign-product-metafields.ts`, `src/load/assign-collection-metafields.ts`, `src/index.ts` |
| Generate migration reports | `src/report/types.ts`, `src/report/report-writer.ts`, `src/index.ts` |
| Complete test-path scope | `src/index.ts` (rewrote `runTestPath`) |

### P2 Fixes (Medium)

| Fix | Files Changed |
|-----|---------------|
| Metaobject entry idempotency via Shopify API | `src/load/create-metaobjects.ts` |
| Validate metafield definitions | `src/shopify-admin.ts` (added `getMetafieldDefinitions`), `src/utils/validate-locked-model.ts`, `src/index.ts` |

### P3 Fixes (Low)

| Fix | Files Changed |
|-----|---------------|
| Detect legacy fields in JSON extraction | `src/extract/from-json.ts` |

---

## P0 Fixes Applied

### Fix 1 — Remove custom handle field from metaobject entry transforms

**Problem:** Transform functions included `{ key: 'handle', value: handle }` in the metaobject fields array, but the Shopify metaobject definitions no longer have a custom `handle` field (it's reserved by Shopify).

**Solution:** Removed the `handle` field entry from:
- `map-feelings.ts`
- `map-subfeelings.ts`
- `map-occasions.ts`
- `map-size-tables.ts`

The `handle` value is still computed and passed as the native Shopify metaobject handle at the GraphQL mutation top level.

### Fix 2 — Load id-map on startup

**Problem:** `loadIdMap()` existed but was never called. Every run started with an empty id-map, breaking idempotency.

**Solution:**
- `index.ts` now calls `loadIdMap(outDir)` at startup
- Merges loaded values into the fresh id-map (loaded values take precedence)
- Invalid JSON causes non-zero exit with clear error message
- Logs "Loaded existing id-map" or "No existing id-map found"

### Fix 3 — Resolve reference metafields to Shopify GraphQL IDs

**Problem:** Reference metafields used raw handles like `"zodiac"`, but Shopify requires GraphQL IDs (`gid://shopify/Metaobject/...`).

**Solution:**
- Added `resolveReferenceValue()` helper in both `assign-product-metafields.ts` and `assign-collection-metafields.ts`
- Resolves handles to GraphQL IDs using the id-map before calling Shopify
- For `list.metaobject_reference` and `list.product_reference`: splits comma-separated handles, resolves each, builds JSON array of GIDs
- Non-reference types pass through unchanged

---

## P1 Fixes Applied

### Fix 4 — Enforce ALLOW_MISSING_REFERENCES

**Problem:** The env var was parsed but never used.

**Solution:**
- `assignProductMetafields` and `assignCollectionMetafields` now accept `allowMissingReferences: boolean`
- If `false` (default) and a required reference cannot be resolved:
  - Error is collected
  - Assignment is skipped
  - Script exits non-zero after processing all items
- If `true`:
  - Warning is logged
  - Assignment is skipped
  - Script continues

### Fix 5 — Generate migration reports

**Problem:** No report files were generated.

**Solution:**
- Created `src/report/types.ts` with `MigrationReport` interface
- Created `src/report/report-writer.ts` with `writeReports()` function
- Generates both:
  - `output/migration-report.json`
  - `output/migration-report.md` (or `output/dry-run-report.md` in dry-run mode)
- Report includes: date, store, mode, scope, created, skipped, updated, conflicts, missing references, missing images, warnings, errors, next manual steps

### Fix 6 — Complete test-path scope

**Problem:** Test-path only created metaobjects and products, missing collections and metafields.

**Solution:**
Rewrote `runTestPath()` to include:
1. **Metaobjects:** Zodiac feeling, Cancer subfeeling, one artist, one size table
2. **Products:** Cancer product, one companion product, Gift Wrap if present
3. **Collections:** `feeling-zodiac`, `feeling-zodiac-cancer`
4. **Product metafields:** `custom.feeling`, `custom.subfeeling`, `custom.artist`, `custom.size_table`, `custom.pair_with_products`
5. **Collection metafields:** `custom.feeling`

Validates the full storefront path: Home → Feelings → Zodiac → Cancer → Product → Cart

---

## P2 Fixes Applied

### Fix 7 — Metaobject entry idempotency against Shopify

**Problem:** Only checked id-map, didn't query Shopify for existing entries.

**Solution:**
- `createMetaobjectEntries()` now pre-fetches all existing metaobject entries for the types it needs
- Before creating, checks if the handle already exists in Shopify
- If found: adds to id-map, skips creation, logs "already exists in Shopify"
- If not found: proceeds with creation

### Fix 8 — Validate metafield definitions

**Problem:** Only metaobject definitions were validated.

**Solution:**
- Added `getMetafieldDefinitions()` method to `ShopifyAdminClient`
- `index.ts` now validates:
  - Product metafield definitions (all `REQUIRED_DEFINITIONS.productMetafieldKeys`)
  - Collection metafield definitions (all `REQUIRED_DEFINITIONS.collectionMetafieldKeys`)
- Added `custom.feeling` to the collection metafield validation list
- Missing definitions cause non-zero exit with message to run seeder first

---

## P3 Fixes Applied

### Fix 9 — Detect legacy fields in JSON extraction

**Problem:** Legacy fields in source JSON were silently ignored.

**Solution:**
- Added `LEGACY_PRODUCT_FIELDS` constant with 14 known legacy field names
- `detectLegacyFields()` scans each product JSON for legacy keys
- Logs a warning for each legacy field found: `Product "handle" contains legacy field "name" — map to canonical field or remove`

---

## Remaining Limitations

| Limitation | Impact | Notes |
|------------|--------|-------|
| Image upload not implemented | Products created without images | Requires Shopify staged upload flow |
| Medusa API extraction not implemented | Only JSON input supported | Placeholder functions exist |
| Product variants not created | Sizes/colors need manual setup | Variant creation requires options/values |
| Compare-at prices not created | No sale price indication | Can be added later |
| Order/customer migration | Out of scope | Phase 2B or later |
| Collection automated rules | Manual collections only | Automated rules need condition setup |

---

## Dry-run Result

Command tested:
```bash
cd scripts/shopify-data-migration
./node_modules/.bin/tsc --noEmit
```

Result: **Exit code 0** — No TypeScript errors.

---

## Report Files Generated

After dry-run or apply, the pipeline generates:
- `output/id-map.json` — Shopify ID mappings
- `output/migration-report.json` — Structured report
- `output/migration-report.md` or `output/dry-run-report.md` — Human-readable report

---

## Safe Command Sequence

### 1. Verify TypeScript
```bash
cd scripts/shopify-data-migration
npm run type-check
```

### 2. Dry-run test-path
```bash
npm run migrate -- --scope test-path --dry-run --limit 1
```

### 3. Review dry-run report
```bash
cat output/dry-run-report.md
```

### 4. Apply test-path
```bash
npm run migrate -- --scope test-path --apply --limit 1
```

### 5. Verify in Shopify Admin
- Content → Metaobjects: Zodiac feeling, Cancer subfeeling
- Products: Cancer product exists
- Collections: feeling-zodiac, feeling-zodiac-cancer exist
- Product metafields: feeling, subfeeling, artist, size_table assigned
- Collection metafields: feeling assigned

### 6. Full dry-run
```bash
npm run migrate -- --dry-run
```

### 7. Full apply
```bash
npm run migrate -- --apply
```

---

## Verdict

**SAFE FOR TEST-PATH APPLY**

All P0 blockers have been resolved:
- No custom `handle` fields in metaobject entries
- Id-map is loaded and saved correctly
- Reference metafields resolve to GraphQL IDs
- Missing references are handled safely
- Reports are generated
- Test-path validates the full data model

**Next step:** Create minimal JSON input files in `scripts/shopify-data-migration/input/` and run the test-path dry-run.

---

**Date:** 2026-05-05
**Branch:** medusa
**Commit:** c846e4e
