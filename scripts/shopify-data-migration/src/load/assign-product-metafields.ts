/**
 * Assign metafields to products.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export interface ProductMetafieldAssignment {
  productHandle: string;
  namespace: string;
  key: string;
  value: string;
  type: string;
}

export async function assignProductMetafields(
  client: ShopifyAdminClient,
  assignments: ProductMetafieldAssignment[],
  idMap: IdMap,
  dryRun: boolean
): Promise<{ assigned: string[]; skipped: string[]; errors: string[] }> {
  const assigned: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const a of assignments) {
    const productId = idMap.products[a.productHandle];
    if (!productId) {
      skipped.push(`${a.productHandle}: product not found in id-map`);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would set ${a.namespace}.${a.key} on ${a.productHandle}`);
      assigned.push(`${a.productHandle}:${a.key} (dry-run)`);
      continue;
    }

    try {
      await client.setProductMetafield(productId, a.namespace, a.key, a.value, a.type);
      assigned.push(`${a.productHandle}:${a.key}`);
      logger.success(`Set ${a.namespace}.${a.key} on ${a.productHandle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${a.productHandle}:${a.key}: ${message}`);
      logger.error(`Failed to set ${a.namespace}.${a.key} on ${a.productHandle}: ${message}`);
    }
  }

  return { assigned, skipped, errors };
}
