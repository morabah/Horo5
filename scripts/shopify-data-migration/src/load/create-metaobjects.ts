/**
 * Load metaobject entries into Shopify Admin.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export interface MetaobjectEntry {
  type: string;
  handle: string;
  fields: Array<{ key: string; value: string }>;
}

/**
 * Resolve handle references in metaobject entry fields to GraphQL IDs.
 * If a field value matches a handle in idMap.metaobjects, replace it with the GID.
 */
function resolveMetaobjectFields(
  fields: Array<{ key: string; value: string }>,
  idMap: IdMap
): Array<{ key: string; value: string }> {
  return fields.map((f) => {
    const gid = idMap.metaobjects[f.value];
    if (gid) {
      return { key: f.key, value: gid };
    }
    return f;
  });
}

export async function createMetaobjectEntries(
  client: ShopifyAdminClient,
  entries: MetaobjectEntry[],
  idMap: IdMap,
  dryRun: boolean
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  // Pre-fetch existing entries for all types we need
  const typesNeeded = [...new Set(entries.map((e) => e.type))];
  const existingByType = new Map<string, Map<string, string>>();
  if (!dryRun) {
    for (const type of typesNeeded) {
      try {
        const existing = await client.getMetaobjectEntries(type);
        const handleToId = new Map(existing.map((e) => [e.handle, e.id]));
        existingByType.set(type, handleToId);
      } catch (err) {
        logger.warn(`Could not pre-fetch existing ${type} entries: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // Split into non-reference and reference entries
  // Non-reference entries don't depend on other metaobjects
  const nonRefTypes = new Set(['feeling', 'occasion', 'artist', 'size_table']);
  const nonRefEntries = entries.filter((e) => nonRefTypes.has(e.type));
  const refEntries = entries.filter((e) => !nonRefTypes.has(e.type));

  // ── Pass 1: Create non-reference entries ──
  for (const entry of nonRefEntries) {
    if (idMap.metaobjects[entry.handle]) {
      skipped.push(`${entry.type}:${entry.handle}`);
      continue;
    }

    if (!dryRun) {
      const existingHandles = existingByType.get(entry.type);
      if (existingHandles?.has(entry.handle)) {
        const existingId = existingHandles.get(entry.handle)!;
        idMap.metaobjects[entry.handle] = existingId;
        skipped.push(`${entry.type}:${entry.handle} (already exists in Shopify)`);
        logger.info(`${entry.type}:${entry.handle} already exists in Shopify, skipping`);
        continue;
      }
    }

    if (dryRun) {
      logger.dryRun(`Would create ${entry.type} metaobject: ${entry.handle}`);
      created.push(`${entry.type}:${entry.handle} (dry-run)`);
      continue;
    }

    try {
      const result = await client.createMetaobjectEntry(entry.type, entry.handle, entry.fields);
      if (result) {
        idMap.metaobjects[entry.handle] = result.id;
        created.push(`${entry.type}:${entry.handle}`);
        logger.success(`Created ${entry.type} metaobject: ${entry.handle}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${entry.type}:${entry.handle}: ${message}`);
      logger.error(`Failed to create ${entry.type} metaobject ${entry.handle}: ${message}`);
    }
  }

  // ── Pass 2: Create reference entries with resolved IDs ──
  for (const entry of refEntries) {
    if (idMap.metaobjects[entry.handle]) {
      skipped.push(`${entry.type}:${entry.handle}`);
      continue;
    }

    if (!dryRun) {
      const existingHandles = existingByType.get(entry.type);
      if (existingHandles?.has(entry.handle)) {
        const existingId = existingHandles.get(entry.handle)!;
        idMap.metaobjects[entry.handle] = existingId;
        skipped.push(`${entry.type}:${entry.handle} (already exists in Shopify)`);
        logger.info(`${entry.type}:${entry.handle} already exists in Shopify, skipping`);
        continue;
      }
    }

    // Resolve reference handles to GraphQL IDs
    const resolvedFields = resolveMetaobjectFields(entry.fields, idMap);

    if (dryRun) {
      logger.dryRun(`Would create ${entry.type} metaobject: ${entry.handle}`);
      created.push(`${entry.type}:${entry.handle} (dry-run)`);
      continue;
    }

    try {
      const result = await client.createMetaobjectEntry(entry.type, entry.handle, resolvedFields);
      if (result) {
        idMap.metaobjects[entry.handle] = result.id;
        created.push(`${entry.type}:${entry.handle}`);
        logger.success(`Created ${entry.type} metaobject: ${entry.handle}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${entry.type}:${entry.handle}: ${message}`);
      logger.error(`Failed to create ${entry.type} metaobject ${entry.handle}: ${message}`);
    }
  }

  return { created, skipped, errors };
}
