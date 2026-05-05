/**
 * Load collections into Shopify Admin.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export interface ShopifyCollectionInput {
  title: string;
  descriptionHtml?: string;
  handle: string;
}

export async function createCollections(
  client: ShopifyAdminClient,
  collections: Array<{ handle: string; shopifyInput: ShopifyCollectionInput }>,
  idMap: IdMap,
  dryRun: boolean
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const collection of collections) {
    if (idMap.collections[collection.handle]) {
      skipped.push(collection.handle);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would create collection: ${collection.shopifyInput.title} (${collection.handle})`);
      created.push(`${collection.handle} (dry-run)`);
      continue;
    }

    try {
      const existing = await client.getCollectionByHandle(collection.handle);
      if (existing) {
        idMap.collections[collection.handle] = existing.id;
        skipped.push(`${collection.handle} (already exists)`);
        logger.info(`Collection ${collection.handle} already exists, skipping`);
        continue;
      }

      const result = await client.createCollection(collection.shopifyInput);
      if (result) {
        idMap.collections[collection.handle] = result.id;
        created.push(collection.handle);
        logger.success(`Created collection: ${collection.shopifyInput.title}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${collection.handle}: ${message}`);
      logger.error(`Failed to create collection ${collection.handle}: ${message}`);
    }
  }

  return { created, skipped, errors };
}
