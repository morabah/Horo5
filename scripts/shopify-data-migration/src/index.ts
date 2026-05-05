#!/usr/bin/env node
/**
 * HORO Shopify Data Migration Pipeline
 *
 * Modes:
 *   --dry-run    (default) Preview changes without writing to Shopify
 *   --apply      Actually create/update data in Shopify Admin
 *   --scope      Limit migration scope (metaobjects, products, collections, metafields, test-path)
 *   --limit      Limit number of items per scope
 *   --verbose    Detailed logging
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { assertEnv, Env } from './utils/assert-env.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';
import { createIdMap, saveIdMap, IdMap } from './state/id-map.js';
import { REQUIRED_DEFINITIONS } from './utils/validate-locked-model.js';

import { extractFromJson } from './extract/from-json.js';
import { extractFromMedusa } from './extract/from-medusa.js';
import { extractFromWebNext } from './extract/from-web-next.js';

import { mapFeeling } from './transform/map-feelings.js';
import { mapSubfeeling } from './transform/map-subfeelings.js';
import { mapOccasion } from './transform/map-occasions.js';
import { mapArtist } from './transform/map-artists.js';
import { mapSizeTable } from './transform/map-size-tables.js';
import { mapProduct } from './transform/map-products.js';
import { mapCollection } from './transform/map-collections.js';
import { mapProductMetafields, mapCollectionMetafields } from './transform/map-metafields.js';

import { createMetaobjectEntries, MetaobjectEntry } from './load/create-metaobjects.js';
import { createProducts, ShopifyProductInput } from './load/create-products.js';
import { createCollections, ShopifyCollectionInput } from './load/create-collections.js';
import { assignProductMetafields, ProductMetafieldAssignment } from './load/assign-product-metafields.js';
import { assignCollectionMetafields, CollectionMetafieldAssignment } from './load/assign-collection-metafields.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CliArgs {
  dryRun: boolean;
  apply: boolean;
  scope: string[];
  limit: number;
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const scopeFlags: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scope' && args[i + 1]) {
      scopeFlags.push(args[i + 1]);
      i++;
    }
  }

  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 && args[limitIndex + 1] ? parseInt(args[limitIndex + 1], 10) : Number.MAX_SAFE_INTEGER;

  return {
    dryRun: !args.includes('--apply'),
    apply: args.includes('--apply'),
    scope: scopeFlags.length > 0 ? scopeFlags : ['all'],
    limit: Number.isNaN(limit) ? Number.MAX_SAFE_INTEGER : limit,
    verbose: args.includes('--verbose'),
  };
}

function help(): void {
  console.log(`
HORO Shopify Data Migration Pipeline

Usage:
  npm run migrate -- --dry-run              # Preview changes (default)
  npm run migrate -- --apply                # Apply changes to Shopify
  npm run migrate -- --scope metaobjects    # Migrate only metaobjects
  npm run migrate -- --scope products       # Migrate only products
  npm run migrate -- --scope collections    # Migrate only collections
  npm run migrate -- --scope metafields    # Migrate only metafields
  npm run migrate -- --scope test-path     # Run test-path migration
  npm run migrate -- --limit 1             # Limit items per scope

Options:
  --dry-run       (default) Preview changes without writing
  --apply         Actually create/update data in Shopify Admin
  --scope <name>  Limit scope (can be used multiple times)
  --limit <n>     Limit number of items per scope
  --verbose       Detailed logging

Environment variables (in .env):
  SHOPIFY_STORE_DOMAIN
  SHOPIFY_ADMIN_ACCESS_TOKEN
  SHOPIFY_API_VERSION
  MIGRATION_INPUT_DIR (default: ./input)
`);
}

interface MigrationResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

function mergeResults(a: MigrationResult, b: MigrationResult): MigrationResult {
  return {
    created: [...a.created, ...b.created],
    skipped: [...a.skipped, ...b.skipped],
    errors: [...a.errors, ...b.errors],
  };
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (process.argv.slice(2).includes('--help')) {
    help();
    process.exit(0);
  }

  logger.section('HORO Shopify Data Migration Pipeline');
  logger.info(`Mode: ${args.apply ? 'APPLY' : 'DRY-RUN'}`);
  logger.info(`Scope: ${args.scope.join(', ')}`);
  if (args.limit !== Number.MAX_SAFE_INTEGER) {
    logger.info(`Limit: ${args.limit}`);
  }

  const env = assertEnv();
  const client = new ShopifyAdminClient({
    storeDomain: env.storeDomain,
    accessToken: env.accessToken,
    apiVersion: env.apiVersion,
  });

  // ── Validate definitions exist ──
  logger.section('Validating Shopify definitions');
  const definitions = await client.getMetaobjectDefinitions();
  const defTypes = new Set(definitions.map((d) => d.type));

  const missingDefs = REQUIRED_DEFINITIONS.metaobjectTypes.filter((t) => !defTypes.has(t));
  if (missingDefs.length > 0) {
    logger.error(`Missing metaobject definitions: ${missingDefs.join(', ')}`);
    logger.error('Run the seeder script first: scripts/shopify-admin-seed/');
    process.exit(1);
  }
  logger.success('All required metaobject definitions found');

  // ── Extract data ──
  logger.section('Extracting data');
  const jsonData = extractFromJson(env.migrationInputDir);
  const medusaData = await extractFromMedusa({
    backendUrl: env.medusaBackendUrl,
    adminApiToken: env.medusaAdminApiToken,
    databaseUrl: env.medusaDatabaseUrl,
  });
  const webDefaults = extractFromWebNext();

  const totalResult: MigrationResult = { created: [], skipped: [], errors: [] };
  const idMap = createIdMap();

  // ── Scope: test-path ──
  if (args.scope.includes('test-path')) {
    logger.section('Test-path migration');
    await runTestPath(client, jsonData, idMap, !args.apply, args.limit);
    process.exit(0);
  }

  // ── Scope: metaobjects ──
  if (args.scope.includes('all') || args.scope.includes('metaobjects')) {
    logger.section('Migrating metaobjects');
    const feelings = jsonData.feelings.slice(0, args.limit).map(mapFeeling);
    const subfeelings = jsonData.subfeelings.slice(0, args.limit).map(mapSubfeeling);
    const occasions = jsonData.occasions.slice(0, args.limit).map(mapOccasion);
    const artists = jsonData.artists.slice(0, args.limit).map(mapArtist);
    const sizeTables = jsonData.sizeTables.slice(0, args.limit).map(mapSizeTable);

    const allMetaobjects: MetaobjectEntry[] = [
      ...feelings.map((f) => ({ type: 'feeling', handle: f.handle, fields: f.fields })),
      ...subfeelings.map((s) => ({ type: 'subfeeling', handle: s.handle, fields: s.fields })),
      ...occasions.map((o) => ({ type: 'occasion', handle: o.handle, fields: o.fields })),
      ...artists.map((a) => ({ type: 'artist', handle: a.slug, fields: a.fields })),
      ...sizeTables.map((s) => ({ type: 'size_table', handle: s.handle, fields: s.fields })),
    ];

    const moResult = await createMetaobjectEntries(client, allMetaobjects, idMap, !args.apply);
    totalResult.created.push(...moResult.created);
    totalResult.skipped.push(...moResult.skipped);
    totalResult.errors.push(...moResult.errors);
  }

  // ── Scope: products ──
  if (args.scope.includes('all') || args.scope.includes('products')) {
    logger.section('Migrating products');
    const products = jsonData.products.slice(0, args.limit).map(mapProduct);
    const pResult = await createProducts(
      client,
      products.map((p) => ({ handle: p.input.handle, shopifyInput: p.shopifyInput })),
      idMap,
      !args.apply
    );
    totalResult.created.push(...pResult.created);
    totalResult.skipped.push(...pResult.skipped);
    totalResult.errors.push(...pResult.errors);
  }

  // ── Scope: collections ──
  if (args.scope.includes('all') || args.scope.includes('collections')) {
    logger.section('Migrating collections');
    const collections = jsonData.collections.slice(0, args.limit).map(mapCollection);
    const cResult = await createCollections(
      client,
      collections.map((c) => ({ handle: c.input.handle, shopifyInput: c.shopifyInput })),
      idMap,
      !args.apply
    );
    totalResult.created.push(...cResult.created);
    totalResult.skipped.push(...cResult.skipped);
    totalResult.errors.push(...cResult.errors);
  }

  // ── Scope: metafields ──
  if (args.scope.includes('all') || args.scope.includes('metafields')) {
    logger.section('Migrating metafields');

    // Product metafields
    const productMfAssignments: ProductMetafieldAssignment[] = [];
    for (const p of jsonData.products.slice(0, args.limit)) {
      const metafields = mapProductMetafields({
        feeling: p.feeling,
        subfeeling: p.subfeeling,
        occasions: p.occasions,
        artist: p.artist,
        size_table: p.size_table,
        pair_with_products: p.pair_with_products,
      });
      for (const mf of metafields) {
        productMfAssignments.push({
          productHandle: p.handle,
          namespace: mf.namespace,
          key: mf.key,
          value: mf.value,
          type: mf.type,
        });
      }
    }
    const pmfResult = await assignProductMetafields(client, productMfAssignments, idMap, !args.apply);
    totalResult.created.push(...pmfResult.assigned);
    totalResult.skipped.push(...pmfResult.skipped);
    totalResult.errors.push(...pmfResult.errors);

    // Collection metafields
    const collectionMfAssignments: CollectionMetafieldAssignment[] = [];
    for (const c of jsonData.collections.slice(0, args.limit)) {
      const metafields = mapCollectionMetafields({
        occasion: c.occasion,
      });
      for (const mf of metafields) {
        collectionMfAssignments.push({
          collectionHandle: c.handle,
          namespace: mf.namespace,
          key: mf.key,
          value: mf.value,
          type: mf.type,
        });
      }
    }
    const cmfResult = await assignCollectionMetafields(client, collectionMfAssignments, idMap, !args.apply);
    totalResult.created.push(...cmfResult.assigned);
    totalResult.skipped.push(...cmfResult.skipped);
    totalResult.errors.push(...cmfResult.errors);
  }

  // ── Save ID map ──
  const outDir = path.join(process.cwd(), 'output');
  if (args.apply) {
    saveIdMap(idMap, outDir);
    logger.success(`Saved ID map to ${path.join(outDir, 'id-map.json')}`);
  }

  // ── Summary ──
  logger.section('Summary');
  logger.success(`Created: ${totalResult.created.length}`);
  logger.success(`Skipped: ${totalResult.skipped.length}`);
  if (totalResult.errors.length > 0) {
    logger.error(`Errors: ${totalResult.errors.length}`);
    totalResult.errors.forEach((e) => logger.error(`  ${e}`));
    process.exit(1);
  }

  logger.success('Migration complete.');
}

/**
 * Run a minimal test-path migration.
 */
async function runTestPath(
  client: ShopifyAdminClient,
  data: ReturnType<typeof extractFromJson>,
  idMap: IdMap,
  dryRun: boolean,
  limit: number
): Promise<void> {
  logger.info('Test-path: Creating minimal HORO data set');

  // Find test data
  const zodiac = data.feelings.find((f) => f.handle === 'zodiac' || f.title.toLowerCase().includes('zodiac'));
  const cancer = data.subfeelings.find((s) => s.handle === 'cancer' || s.title.toLowerCase().includes('cancer'));
  const artist = data.artists[0];
  const sizeTable = data.sizeTables[0];
  const cancerProduct = data.products.find((p) => p.handle.includes('cancer') || p.title.toLowerCase().includes('cancer'));
  const giftWrap = data.products.find((p) => p.handle.includes('gift') || p.title.toLowerCase().includes('gift'));

  const entries: MetaobjectEntry[] = [];

  if (zodiac) {
    const mapped = mapFeeling(zodiac);
    entries.push({ type: 'feeling', handle: mapped.handle, fields: mapped.fields });
  }
  if (cancer) {
    const mapped = mapSubfeeling(cancer);
    entries.push({ type: 'subfeeling', handle: mapped.handle, fields: mapped.fields });
  }
  if (artist) {
    const mapped = mapArtist(artist);
    entries.push({ type: 'artist', handle: mapped.slug, fields: mapped.fields });
  }
  if (sizeTable) {
    const mapped = mapSizeTable(sizeTable);
    entries.push({ type: 'size_table', handle: mapped.handle, fields: mapped.fields });
  }

  const limitedEntries = entries.slice(0, limit);
  const moResult = await createMetaobjectEntries(client, limitedEntries, idMap, dryRun);
  logger.success(`Metaobjects: ${moResult.created.length} created, ${moResult.skipped.length} skipped, ${moResult.errors.length} errors`);

  // Products
  const products: Array<{ handle: string; shopifyInput: ShopifyProductInput }> = [];
  if (cancerProduct) {
    const mapped = mapProduct(cancerProduct);
    products.push({ handle: mapped.input.handle, shopifyInput: mapped.shopifyInput });
  }
  if (giftWrap) {
    const mapped = mapProduct(giftWrap);
    products.push({ handle: mapped.input.handle, shopifyInput: mapped.shopifyInput });
  }

  const limitedProducts = products.slice(0, limit);
  const pResult = await createProducts(client, limitedProducts, idMap, dryRun);
  logger.success(`Products: ${pResult.created.length} created, ${pResult.skipped.length} skipped, ${pResult.errors.length} errors`);

  // Save
  if (!dryRun) {
    const outDir = path.join(process.cwd(), 'output');
    saveIdMap(idMap, outDir);
  }

  logger.success('Test-path migration complete.');
}

main().catch((err) => {
  logger.error(`Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
