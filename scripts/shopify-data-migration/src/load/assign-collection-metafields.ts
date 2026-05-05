/**
 * Assign metafields to collections.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export interface CollectionMetafieldAssignment {
  collectionHandle: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export async function assignCollectionMetafields(
  client: ShopifyAdminClient,
  assignments: CollectionMetafieldAssignment[],
  idMap: IdMap,
  dryRun: boolean
): Promise<{ assigned: string[]; skipped: string[]; errors: string[] }> {
  const assigned: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const a of assignments) {
    const collectionId = idMap.collections[a.collectionHandle];
    if (!collectionId) {
      skipped.push(`${a.collectionHandle}: collection not found in id-map`);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would set ${a.namespace}.${a.key} on ${a.collectionHandle}`);
      assigned.push(`${a.collectionHandle}:${a.key} (dry-run)`);
      continue;
    }

    try {
      await client.setCollectionMetafield(collectionId, a.namespace, a.key, a.value, a.type);
      assigned.push(`${a.collectionHandle}:${a.key}`);
      logger.success(`Set ${a.namespace}.${a.key} on ${a.collectionHandle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${a.collectionHandle}:${a.key}: ${message}`);
      logger.error(`Failed to set ${a.namespace}.${a.key} on ${a.collectionHandle}: ${message}`);
    }
  }

  return { assigned, skipped, errors };
}
