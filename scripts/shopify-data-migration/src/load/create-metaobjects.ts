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

export async function createMetaobjectEntries(
  client: ShopifyAdminClient,
  entries: MetaobjectEntry[],
  idMap: IdMap,
  dryRun: boolean
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const entry of entries) {
    // Check if already exists in id-map
    if (idMap.metaobjects[entry.handle]) {
      skipped.push(`${entry.type}:${entry.handle}`);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would create ${entry.type} metaobject: ${entry.handle}`);
      created.push(`${entry.type}:${entry.handle} (dry-run)`);
      continue;
    }

    try {
      const result = await client.createMetaobjectEntry(entry.type, entry.fields);
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
