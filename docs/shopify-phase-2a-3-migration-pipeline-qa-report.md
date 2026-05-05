# HORO Shopify Phase 2A.3 — Migration Pipeline QA Report

## Objective

Review `scripts/shopify-data-migration/` for safety, idempotency, locked data model compliance, and test-path readiness before any Shopify write operations.

## Files Reviewed

- `package.json`
- `README.md`
- `.env.example`
- `src/index.ts`
- `src/shopify-admin.ts`
- `src/extract/from-json.ts`
- `src/extract/from-medusa.ts`
- `src/extract/from-web-next.ts`
- `src/transform/map-feelings.ts`
- `src/transform/map-subfeelings.ts`
- `src/transform/map-occasions.ts`
- `src/transform/map-artists.ts`
- `src/transform/map-size-tables.ts`
- `src/transform/map-products.ts`
- `src/transform/map-collections.ts`
- `src/transform/map-metafields.ts`
- `src/load/create-metaobjects.ts`
- `src/load/create-products.ts`
- `src/load/create-collections.ts`
- `src/load/assign-product-metafields.ts`
- `src/load/assign-collection-metafields.ts`
- `src/load/upload-files.ts`
- `src/state/id-map.ts`
- `src/utils/assert-env.ts`
- `src/utils/logger.ts`
- `src/utils/safe-handle.ts`
- `src/utils/validate-locked-model.ts`
- Reference: `docs/shopify-final-admin-data-model-lock.md`
- Reference: `docs/shopify-phase-2a-1b-data-model-liquid-compatibility-report.md`

---

## Safety Review

### 1. Dry-run mode performs no Shopify writes

**Status: PASS**

Every load function (`createMetaobjectEntries`, `createProducts`, `createCollections`, `assignProductMetafields`, `assignCollectionMetafields`) checks the `dryRun` parameter before calling the GraphQL client. The `index.ts` passes `!args.apply` as `dryRun`, so default mode is read-only.

### 2. --apply is required for writes

**Status: PASS**

`parseArgs()` sets `dryRun: !args.includes('--apply')`. Default is `true` (dry-run). No write path executes without `--apply`.

### 3. Legacy fields are rejected or mapped safely

**Status: PARTIAL — NEEDS FIX**

The transform layer (`map-metafields.ts`) maps only canonical locked-model fields. Legacy fields (`feeling_slug`, `artist_slug`, `subfeeling_slug`, etc.) are not present in the `JsonProducts` interface, so they would be silently ignored if present in the input JSON.

**Problem:** There is no explicit validation or rejection logic. A source JSON with `feeling_slug` would be silently dropped without warning. The extraction layer should detect and report legacy fields.

### 4. Product handle is used as unique key

**Status: PASS**

`create-products.ts` uses `client.getProductByHandle()` to check for existing products before creation. The `id-map` is keyed by handle. Skips are logged when a product already exists.

### 5. Metaobjects are created before product metafields

**Status: PASS — for full migration**

In `index.ts`, the scope execution order is:
1. `metaobjects`
2. `products`
3. `collections`
4. `metafields`

**Caveat:** If a user runs `--scope metafields` alone on a fresh store with an empty id-map, all product metafield assignments will be skipped because neither metaobjects nor products exist in the id-map. This is safe (skips, doesn't crash) but will produce a report full of skips.

### 6. Products are created before pair_with_products references

**Status: PASS**

Products scope runs before metafields scope. `pair_with_products` is assigned in the metafield phase.

**Critical caveat:** The `pair_with_products` metafield value is currently a comma-separated string of product **handles**, but Shopify's `list.product_reference` metafield type requires **GraphQL product IDs** (`gid://shopify/Product/...`). This will fail on apply. See "Full migration blockers" below.

### 7. Id-map is written and reused

**Status: PARTIAL — NEEDS FIX**

- `saveIdMap()` is called at the end of apply mode. **PASS**
- `loadIdMap()` is defined in `id-map.ts` but **never called** in `index.ts`. **FAIL**

On every run, the id-map starts empty. This means:
- Already-created products/collections are re-fetched via `getProductByHandle` / `getCollectionByHandle` (safe, just slower)
- Already-created metaobjects are NOT checked on Shopify side — only the id-map is checked. On second run, the id-map is empty, so the script will attempt to create duplicate metaobject entries and fail with userErrors.

### 8. Missing references stop the migration unless explicit allow flag is passed

**Status: FAIL — NEEDS FIX**

The `assertEnv()` function parses `ALLOW_MISSING_REFERENCES` from `.env`, but this flag is **never used** in any load function.

Current behavior: Missing references are skipped with a log message (`"product not found in id-map"`). The script continues and exits with the count of skips. It does NOT stop.

Required behavior: If `ALLOW_MISSING_REFERENCES=false` (default), the script should exit non-zero when required references are missing.

### 9. Admin token is never logged

**Status: PASS**

The token is passed in the `X-Shopify-Access-Token` header but never logged. `logger.info()` only logs GraphQL query snippets (first 60 chars). The `.env` file is `.gitignore`d.

### 10. Reports are generated

**Status: FAIL — NEEDS FIX**

The README claims `output/migration-report.json` and `output/migration-report.md` are generated. The code only writes `output/id-map.json`.

No report file summarizing created/skipped/errors/conflicts is generated.

### 11. Test-path scope imports correct data

**Status: PARTIAL — NEEDS FIX**

The `runTestPath()` function correctly identifies:
- Zodiac feeling
- Cancer subfeeling
- First artist
- First size table
- Cancer product
- Gift Wrap product

**Missing from test-path:**
- Collections are NOT created in the test path. The spec requires collections (e.g., `feeling-zodiac`, `feeling-zodiac-cancer`) to be part of the test path.
- Collection metafields are NOT assigned.
- Product metafields are NOT assigned.

The test-path only creates metaobjects and products, missing the metafield linkage that validates the full data model.

---

## Idempotency Review

### Metaobject entries

**Status: FAIL — NEEDS FIX**

`createMetaobjectEntries` checks `idMap.metaobjects[entry.handle]` to skip duplicates. But since `loadIdMap()` is never called, the id-map is empty on every run. The script does NOT query Shopify for existing metaobject entries before creating.

**Risk:** Running `--apply` twice will attempt to create duplicate metaobject entries. Shopify will either:
- Return a userError for duplicate handle
- Or create duplicates with auto-generated unique handles

Either way, the id-map becomes inconsistent.

### Products

**Status: PASS**

`createProducts` calls `client.getProductByHandle()` before creation. Duplicate handles are detected via Shopify API and skipped safely.

### Collections

**Status: PASS**

`createCollections` calls `client.getCollectionByHandle()` before creation. Duplicate handles are detected via Shopify API and skipped safely.

### Metafields

**Status: PARTIAL**

`assignProductMetafields` and `assignCollectionMetafields` use `productUpdate` / `collectionUpdate` with metafields. Shopify overwrites existing metafield values on update. This is idempotent in the sense that re-running produces the same final state, but it does perform a write each time.

**Missing:** No check to skip metafields that already have the correct value.

---

## Locked Model Compliance

### Metaobject fields

**Status: FAIL — CRITICAL**

The locked data model (`docs/shopify-final-admin-data-model-lock.md`) and the seeder script (`shopify-admin-seed`) both removed the custom `handle` field from metaobject definitions because `handle` is reserved by Shopify (auto-generated from title).

**However, the transform functions still include a `handle` field:**

- `map-feelings.ts` line 33: `{ key: 'handle', value: handle }`
- `map-subfeelings.ts` line 26: `{ key: 'handle', value: handle }`
- `map-occasions.ts` line 28: `{ key: 'handle', value: handle }`
- `map-artists.ts` line 26: `{ key: 'slug', value: slug }` — This is OK, `slug` is a custom field in artist
- `map-size-tables.ts` line 23: `{ key: 'handle', value: handle }`

When creating a metaobject entry, Shopify will reject any field key that does not exist in the definition. Since `feeling`, `subfeeling`, `occasion`, and `size_table` definitions no longer have a `handle` field, the `metaobjectCreate` mutation will fail with a userError.

### Product metafield types

**Status: PASS**

`map-metafields.ts` uses the correct types:
- `metaobject_reference` for `feeling`, `subfeeling`, `artist`, `size_table`
- `list.metaobject_reference` for `occasions`
- `list.product_reference` for `pair_with_products`
- `multi_line_text_field`, `rich_text_field`, `url`, `boolean`, `date_time`, `number_integer`, etc.

### Collection metafield types

**Status: PASS**

Correct types are used for all collection metafields.

### `validate-locked-model.ts` missing metafield

**Status: NEEDS FIX**

`REQUIRED_DEFINITIONS.collectionMetafieldKeys` does not include `custom.feeling`, but the locked model (`docs/shopify-final-admin-data-model-lock.md` §3) defines `custom.feeling` for collections as well as products.

---

## Test-Path Readiness

### What works

- Dry-run mode is safe
- Scope filtering works
- Test-path correctly identifies Zodiac, Cancer, artist, size table, and products
- Handle-based idempotency for products and collections

### What blocks test-path apply

1. **`handle` field in metaobject entries** — Will cause `metaobjectCreate` to fail
2. **`loadIdMap` not called** — Second test-path run will attempt duplicates
3. **No report generation** — Can't verify what was done
4. **Test-path doesn't create collections or assign metafields** — Doesn't validate the full data model linkage

---

## Full Migration Blockers

### Blocker 1: `handle` field sent in metaobject entries (CRITICAL)

**File:** `src/transform/map-feelings.ts`, `map-subfeelings.ts`, `map-occasions.ts`, `map-size-tables.ts`
**Issue:** These files include `{ key: 'handle', value: ... }` in the fields array, but the metaobject definitions no longer have a `handle` field.
**Fix:** Remove the `handle` field line from all four transform functions.

### Blocker 2: `loadIdMap` never called (CRITICAL)

**File:** `src/index.ts`
**Issue:** The id-map is never loaded from disk, so idempotency breaks for metaobject entries on re-runs.
**Fix:** Call `loadIdMap(outDir)` at the start of `main()` and merge loaded values into the fresh id-map.

### Blocker 3: Metaobject reference values are handles, not GraphQL IDs (CRITICAL)

**File:** `src/transform/map-metafields.ts`, `src/load/assign-product-metafields.ts`
**Issue:** Product metafields of type `metaobject_reference` and `list.metaobject_reference` are assigned string values like `"zodiac"` or `"cancer"`. Shopify requires the GraphQL ID (`gid://shopify/Metaobject/...`) for these metafield types.

**Also affects:** `pair_with_products` (`list.product_reference`) uses product handles instead of product GraphQL IDs.

**Fix:** The load layer must resolve handles to GraphQL IDs using the id-map before calling `setProductMetafield`.

### Blocker 4: No report generation (HIGH)

**File:** `src/index.ts`
**Issue:** No `migration-report.json` or `migration-report.md` is written.
**Fix:** After migration completes, write a structured report with date, mode, scope, created/skipped/errors/conflicts lists, and next steps.

### Blocker 5: `ALLOW_MISSING_REFERENCES` parsed but not enforced (HIGH)

**File:** `src/utils/assert-env.ts`, `src/load/assign-product-metafields.ts`
**Issue:** The env var is read but never checked. Missing references are silently skipped.
**Fix:** If `allowMissingReferences` is false and a required reference is missing, the script should exit non-zero.

### Blocker 6: Test-path missing collections and metafields (MEDIUM)

**File:** `src/index.ts` `runTestPath()`
**Issue:** Test-path doesn't create collections or assign metafields, so it doesn't validate the full data model.
**Fix:** Add collection creation and metafield assignment to the test-path.

### Blocker 7: Metaobject entry idempotency not verified against Shopify (MEDIUM)

**File:** `src/load/create-metaobjects.ts`
**Issue:** Only checks id-map, doesn't query Shopify for existing entries.
**Fix:** Before creating, query `client.getMetaobjectEntries(type)` to check for existing handles.

### Blocker 8: No metafield definition validation (MEDIUM)

**File:** `src/utils/validate-locked-model.ts`, `src/index.ts`
**Issue:** Only metaobject definitions are validated. Metafield definitions are not checked.
**Fix:** Add `client.getMetafieldDefinitions('PRODUCT')` and `client.getMetafieldDefinitions('COLLECTION')` calls to validate required metafield definitions exist.

### Blocker 9: `custom.feeling` missing from collection metafield validation list (LOW)

**File:** `src/utils/validate-locked-model.ts`
**Issue:** `collectionMetafieldKeys` doesn't include `custom.feeling`.
**Fix:** Add `'custom.feeling'` to the array.

---

## Required Fixes Before Apply

| Priority | Fix | Files |
|----------|-----|-------|
| **P0** | Remove `handle` field from metaobject entry transforms | `map-feelings.ts`, `map-subfeelings.ts`, `map-occasions.ts`, `map-size-tables.ts` |
| **P0** | Call `loadIdMap()` on startup | `src/index.ts` |
| **P0** | Resolve handles to GraphQL IDs for `metaobject_reference` and `product_reference` metafields | `assign-product-metafields.ts`, `map-metafields.ts` |
| **P1** | Generate `migration-report.json` and `migration-report.md` | `src/index.ts` |
| **P1** | Enforce `ALLOW_MISSING_REFERENCES` | `assign-product-metafields.ts`, `assign-collection-metafields.ts` |
| **P1** | Add collection creation and metafield assignment to test-path | `src/index.ts` |
| **P2** | Add metaobject entry existence check via Shopify API | `create-metaobjects.ts` |
| **P2** | Validate metafield definitions exist | `src/index.ts`, `validate-locked-model.ts` |
| **P2** | Add `custom.feeling` to collection metafield validation | `validate-locked-model.ts` |
| **P3** | Add legacy field detection to extraction layer | `from-json.ts` |

---

## Recommended Command Sequence

### 1. Fix all blockers
Apply the fixes listed above. Verify TypeScript compiles.

### 2. Run dry-run on test-path
```bash
cd scripts/shopify-data-migration
npm run migrate -- --scope test-path --dry-run --limit 1
```

### 3. Verify dry-run report
Check `output/dry-run-report.md` (after implementing report generation) for:
- No `handle` field errors
- All expected items listed as "Would create"
- No missing reference warnings

### 4. Run test-path apply
```bash
npm run migrate -- --scope test-path --apply --limit 1
```

### 5. Verify in Shopify Admin
- **Content → Metaobjects:** Zodiac feeling, Cancer subfeeling, artist, size table exist
- **Products:** Cancer product and Gift Wrap product exist
- **Collections:** `feeling-zodiac`, `feeling-zodiac-cancer` exist with products assigned
- **Product metafields:** Cancer product has `custom.feeling = Zodiac`, `custom.subfeeling = Cancer`

### 6. Run full dry-run
```bash
npm run migrate -- --dry-run
```

### 7. Run full apply
```bash
npm run migrate -- --apply
```

---

## Verdict

**DO NOT RUN --apply YET.**

The pipeline architecture is solid and the dry-run mode is safe, but there are **3 critical blockers** that will cause the apply mode to fail or produce corrupt data:

1. **`handle` field in metaobject entries** — Will cause GraphQL userErrors on every metaobject creation
2. **No id-map loading** — Will break idempotency and cause duplicate creation attempts
3. **Handle strings instead of GraphQL IDs in metafields** — Will cause metafield assignment failures for all `metaobject_reference` and `product_reference` fields

**Recommendation:** Fix all P0 and P1 blockers, re-run dry-run to confirm clean output, then proceed with test-path apply.

---

**Date:** 2026-05-05
**Branch:** medusa
**Reviewer:** Cascade QA Engineer
