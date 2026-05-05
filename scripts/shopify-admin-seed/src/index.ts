#!/usr/bin/env node
/**
 * HORO Shopify Admin Definition Seeder
 *
 * Modes:
 *   --dry-run    (default) Show what would be created
 *   --apply      Actually create definitions
 *   --check      Only verify existing definitions, no creation
 *   --include-drops     Include optional drop metaobject
 *   --verbose           Detailed logging
 *   --force-recreate    Delete and recreate conflicting metaobject definitions
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { assertEnv, getOAuthConfig } from './utils/assert-env.js';
import { getAccessTokenViaOAuth } from './utils/oauth.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';
import { CORE_METAOBJECTS, OPTIONAL_METAOBJECTS } from './definitions/metaobjects.js';
import { PRODUCT_METAFIELDS } from './definitions/product-metafields.js';
import { COLLECTION_METAFIELDS } from './definitions/collection-metafields.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CliArgs {
  dryRun: boolean;
  apply: boolean;
  check: boolean;
  includeDrops: boolean;
  verbose: boolean;
  forceRecreate: boolean;
}

interface Result {
  created: string[];
  skipped: string[];
  conflicts: string[];
  errors: string[];
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  return {
    dryRun: !args.includes('--apply'),
    apply: args.includes('--apply'),
    check: args.includes('--check'),
    includeDrops: args.includes('--include-drops'),
    verbose: args.includes('--verbose'),
    forceRecreate: args.includes('--force-recreate'),
  };
}

function help(): void {
  console.log(`
HORO Shopify Admin Definition Seeder

Usage:
  npm run seed:definitions:dry          # Default dry-run
  npm run seed:definitions              # Apply with --apply
  npm run seed:definitions:all          # Apply including drops
  npm run check                         # Verify existing definitions

Options:
  --dry-run         (default) Preview changes without creating
  --apply           Actually create definitions in Shopify Admin
  --check           Verify existing definitions, no creation
  --include-drops   Include optional 'drop' metaobject (Phase 2C)
  --verbose         Detailed logging
  --force-recreate  Delete and recreate conflicting metaobject definitions (data loss!)

Required environment variables (in .env):
  SHOPIFY_STORE_DOMAIN
  SHOPIFY_API_VERSION

  Option A — Static token (Custom App):
    SHOPIFY_ADMIN_ACCESS_TOKEN

  Option B — OAuth (Partner App):
    SHOPIFY_CLIENT_ID
    SHOPIFY_CLIENT_SECRET
    SHOPIFY_SCOPES (optional, defaults to required scopes)
`);
  process.exit(0);
}

function metaobjectKey(def: { type: string }): string {
  return `metaobject:${def.type}`;
}

function metafieldKey(def: { namespace: string; key: string; ownerType?: string }): string {
  return `metafield:${def.namespace}.${def.key}${def.ownerType ? ` (${def.ownerType})` : ''}`;
}

async function seedMetaobjects(
  client: ShopifyAdminClient,
  desired: Array<{ type: string; name: string; fieldDefinitions: Array<{ key: string; name: string; type: string; required?: boolean; description?: string }> }>,
  existing: Array<{ id: string; type: string; name: string; fieldDefinitions: Array<{ key: string; name: string; type: { name: string } }> }>,
  dryRun: boolean,
  forceRecreate: boolean
): Promise<Result> {
  const result: Result = { created: [], skipped: [], conflicts: [], errors: [] };

  for (const def of desired) {
    const key = metaobjectKey(def);
    const existingDef = existing.find((e) => e.type === def.type);

    if (existingDef) {
      // Check field compatibility
      const desiredFields = new Map(def.fieldDefinitions.map((f) => [f.key, f.type]));
      const existingFields = new Map(existingDef.fieldDefinitions.map((f) => [f.key, f.type.name]));

      let conflict = false;
      for (const [fieldKey, desiredType] of desiredFields) {
        const existingType = existingFields.get(fieldKey);
        if (existingType && existingType !== desiredType) {
          result.conflicts.push(
            `${key}: field "${fieldKey}" exists with type "${existingType}" but desired type is "${desiredType}"`
          );
          conflict = true;
        }
      }

      // Check for extra fields in existing that aren't in desired (not a conflict, just a skip)
      for (const [fieldKey] of existingFields) {
        if (!desiredFields.has(fieldKey)) {
          logger.info(`${key}: existing field "${fieldKey}" not in desired definition — ignored`);
        }
      }

      if (!conflict) {
        const missingFields = def.fieldDefinitions.filter((f) => !existingFields.has(f.key));
        if (missingFields.length > 0) {
          if (forceRecreate && !dryRun) {
            logger.warn(`${key}: missing fields [${missingFields.map((f) => f.key).join(', ')}] — force-recreating (deleting existing definition)`);
            try {
              await client.deleteMetaobjectDefinition(existingDef.id);
              logger.info(`${key}: deleted existing definition`);
              // Fall through to creation below
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              result.errors.push(`${key}: failed to delete existing definition: ${message}`);
              logger.error(`${key}: failed to delete existing definition: ${message}`);
              continue;
            }
          } else {
            result.conflicts.push(
              `${key}: missing fields [${missingFields.map((f) => f.key).join(', ')}] — cannot add fields to existing metaobject definition via this script (use --force-recreate to delete and recreate)`
            );
            continue;
          }
        } else {
          result.skipped.push(`${key} (already exists)`);
          continue;
        }
      } else {
        continue;
      }
    }

    if (dryRun) {
      logger.dryRun(`Would create metaobject definition: ${def.type}`);
      result.created.push(`${key} (dry-run)`);
      continue;
    }

    try {
      const created = await client.createMetaobjectDefinition(def);
      if (created) {
        result.created.push(`${key}`);
        logger.success(`Created metaobject definition: ${def.type}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${key}: ${message}`);
      logger.error(`Failed to create metaobject ${def.type}: ${message}`);
    }
  }

  return result;
}

async function seedMetafields(
  client: ShopifyAdminClient,
  desired: Array<{ name: string; namespace: string; key: string; type: string; description?: string }>,
  existing: Array<{ id: string; namespace: string; key: string; type: { name: string }; ownerType: string }>,
  ownerType: 'PRODUCT' | 'COLLECTION',
  dryRun: boolean
): Promise<Result> {
  const result: Result = { created: [], skipped: [], conflicts: [], errors: [] };

  for (const def of desired) {
    const key = metafieldKey({ ...def, ownerType });
    const existingDef = existing.find((e) => e.namespace === def.namespace && e.key === def.key);

    if (existingDef) {
      if (existingDef.type.name !== def.type) {
        result.conflicts.push(
          `${key}: exists with type "${existingDef.type.name}" but desired type is "${def.type}"`
        );
      } else if (existingDef.ownerType !== ownerType) {
        result.conflicts.push(
          `${key}: exists with ownerType "${existingDef.ownerType}" but desired ownerType is "${ownerType}"`
        );
      } else {
        result.skipped.push(`${key} (already exists)`);
      }
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would create metafield definition: ${def.namespace}.${def.key} for ${ownerType}`);
      result.created.push(`${key} (dry-run)`);
      continue;
    }

    try {
      const created = await client.createMetafieldDefinition({
        name: def.name,
        namespace: def.namespace,
        key: def.key,
        type: def.type,
        ownerType,
        description: def.description,
      });
      if (created) {
        result.created.push(`${key}`);
        logger.success(`Created metafield definition: ${def.namespace}.${def.key} for ${ownerType}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push(`${key}: ${message}`);
      logger.error(`Failed to create metafield ${def.namespace}.${def.key}: ${message}`);
    }
  }

  return result;
}

function mergeResults(a: Result, b: Result): Result {
  return {
    created: [...a.created, ...b.created],
    skipped: [...a.skipped, ...b.skipped],
    conflicts: [...a.conflicts, ...b.conflicts],
    errors: [...a.errors, ...b.errors],
  };
}

function writeReports(
  report: {
    date: string;
    store: string;
    apiVersion: string;
    dryRun: boolean;
    apply: boolean;
    includeDrops: boolean;
    created: string[];
    skipped: string[];
    conflicts: string[];
    errors: string[];
    nextSteps: string[];
  }
): void {
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // JSON report
  const jsonPath = path.join(outputDir, 'seed-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  logger.info(`Report written: ${jsonPath}`);

  // Markdown report
  const md = generateMarkdown(report);
  const mdPath = path.join(outputDir, 'seed-report.md');
  fs.writeFileSync(mdPath, md);
  logger.info(`Report written: ${mdPath}`);
}

function generateNextSteps(result: Result): string[] {
  const steps: string[] = [];
  if (result.conflicts.length > 0) {
    steps.push('Resolve conflicts in Shopify Admin before re-running.');
  }
  if (result.errors.length > 0) {
    steps.push('Fix errors and re-run the script.');
  }
  if (result.created.some((c) => !c.includes('dry-run'))) {
    steps.push('Populate metaobject entries (feelings, subfeelings, occasions, artists, size tables) in Shopify Admin.');
    steps.push('Populate product metafields on representative products to verify sections render correctly.');
    steps.push('Run validation path: Home → Feelings → Zodiac → Cancer → Product → Cart → Checkout.');
  }
  if (result.created.length === 0 && result.errors.length === 0 && result.conflicts.length === 0) {
    steps.push('All definitions already exist. Proceed to content population and validation.');
  }
  return steps;
}

function generateMarkdown(report: {
  date: string;
  store: string;
  apiVersion: string;
  dryRun: boolean;
  apply: boolean;
  includeDrops: boolean;
  created: string[];
  skipped: string[];
  conflicts: string[];
  errors: string[];
  nextSteps: string[];
}): string {
  const mode = report.apply ? 'apply' : report.dryRun ? 'dry-run' : 'check';

  return `# HORO Shopify Admin Seed Report

| Property | Value |
|----------|-------|
| Date | ${report.date} |
| Store | ${report.store} |
| API Version | ${report.apiVersion} |
| Mode | ${mode} |
| Include drops | ${report.includeDrops ? 'Yes' : 'No'} |

## Summary

- **Created:** ${report.created.length}
- **Skipped:** ${report.skipped.length}
- **Conflicts:** ${report.conflicts.length}
- **Errors:** ${report.errors.length}

## Created (${report.created.length})

${report.created.map((c) => `- ${c}`).join('\n') || 'None'}

## Skipped (${report.skipped.length})

${report.skipped.map((s) => `- ${s}`).join('\n') || 'None'}

## Conflicts (${report.conflicts.length})

${report.conflicts.map((c) => `- ⚠️ ${c}`).join('\n') || 'None'}

## Errors (${report.errors.length})

${report.errors.map((e) => `- ❌ ${e}`).join('\n') || 'None'}

## Next Steps

${report.nextSteps.map((s) => `- ${s}`).join('\n') || 'None'}
`;
}

async function main(): Promise<void> {
  const args = parseArgs();

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    help();
  }

  logger.setVerbose(args.verbose);

  logger.section('HORO Shopify Admin Definition Seeder');
  logger.info(`Mode: ${args.apply ? 'apply' : args.check ? 'check' : 'dry-run'}`);
  logger.info(`Include drops: ${args.includeDrops}`);

  const env = assertEnv();

  // If OAuth mode, obtain access token via browser flow
  if (env.authMode === 'oauth') {
    logger.section('OAuth Authentication');
    const oauthConfig = getOAuthConfig();
    const tokenResult = await getAccessTokenViaOAuth({
      storeDomain: oauthConfig.storeDomain,
      clientId: oauthConfig.clientId,
      clientSecret: oauthConfig.clientSecret,
      scopes: oauthConfig.scopes,
    });
    env.accessToken = tokenResult.accessToken;
    logger.success(`OAuth token obtained (scope: ${tokenResult.scope})`);
  }

  const client = new ShopifyAdminClient(env);

  // Gather desired definitions
  const desiredMetaobjects = [...CORE_METAOBJECTS];
  if (args.includeDrops) {
    desiredMetaobjects.push(...OPTIONAL_METAOBJECTS);
  }

  // Fetch existing definitions
  logger.section('Fetching existing definitions');
  const existingMetaobjects = await client.getMetaobjectDefinitions();
  logger.info(`Found ${existingMetaobjects.length} existing metaobject definitions`);

  const existingProductMetafields = await client.getMetafieldDefinitions('PRODUCT');
  logger.info(`Found ${existingProductMetafields.length} existing product metafield definitions`);

  const existingCollectionMetafields = await client.getMetafieldDefinitions('COLLECTION');
  logger.info(`Found ${existingCollectionMetafields.length} existing collection metafield definitions`);

  let totalResult: Result = { created: [], skipped: [], conflicts: [], errors: [] };

  // Check-only mode
  if (args.check) {
    logger.section('Check mode — verifying definitions');
    // Re-use seed logic with dryRun=true (we just want to compare)
    const moResult = await seedMetaobjects(client, desiredMetaobjects, existingMetaobjects, true, args.forceRecreate);
    const pmResult = await seedMetafields(client, PRODUCT_METAFIELDS, existingProductMetafields, 'PRODUCT', true);
    const cmResult = await seedMetafields(client, COLLECTION_METAFIELDS, existingCollectionMetafields, 'COLLECTION', true);
    totalResult = mergeResults(mergeResults(moResult, pmResult), cmResult);
  } else {
    // Metaobjects
    logger.section('Processing metaobject definitions');
    const moResult = await seedMetaobjects(client, desiredMetaobjects, existingMetaobjects, !args.apply, args.forceRecreate);
    totalResult = mergeResults(totalResult, moResult);

    // Product metafields
    logger.section('Processing product metafield definitions');
    const pmResult = await seedMetafields(client, PRODUCT_METAFIELDS, existingProductMetafields, 'PRODUCT', !args.apply);
    totalResult = mergeResults(totalResult, pmResult);

    // Collection metafields
    logger.section('Processing collection metafield definitions');
    const cmResult = await seedMetafields(client, COLLECTION_METAFIELDS, existingCollectionMetafields, 'COLLECTION', !args.apply);
    totalResult = mergeResults(totalResult, cmResult);
  }

  // Summary
  logger.section('Summary');
  logger.success(`Created: ${totalResult.created.length}`);
  logger.success(`Skipped: ${totalResult.skipped.length}`);
  if (totalResult.conflicts.length > 0) {
    logger.warn(`Conflicts: ${totalResult.conflicts.length}`);
    totalResult.conflicts.forEach((c) => logger.warn(`  ${c}`));
  }
  if (totalResult.errors.length > 0) {
    logger.error(`Errors: ${totalResult.errors.length}`);
    totalResult.errors.forEach((e) => logger.error(`  ${e}`));
  }

  // Write reports
  const reportData = {
    date: new Date().toISOString(),
    store: env.storeDomain,
    apiVersion: env.apiVersion,
    dryRun: args.dryRun && !args.apply,
    apply: args.apply,
    includeDrops: args.includeDrops,
    created: totalResult.created,
    skipped: totalResult.skipped,
    conflicts: totalResult.conflicts,
    errors: totalResult.errors,
    nextSteps: generateNextSteps(totalResult),
  };

  writeReports(reportData);

  // Exit code
  if (totalResult.conflicts.length > 0 || totalResult.errors.length > 0) {
    logger.error('\nExiting with errors. Review conflicts and errors above.');
    process.exit(1);
  }

  logger.success('\nDone.');
}

main().catch((err) => {
  logger.error(`Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
