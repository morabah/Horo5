/**
 * Assign metafields to products.
 * Resolves handle references to Shopify GraphQL IDs before assignment.
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

function resolveReferenceValue(
  type: string,
  value: string,
  idMap: IdMap
): { resolved: string | null; missing: string[] } {
  if (!value) return { resolved: value, missing: [] };

  // Single metaobject reference
  if (type === 'metaobject_reference') {
    const gid = idMap.metaobjects[value];
    if (!gid) return { resolved: null, missing: [value] };
    return { resolved: gid, missing: [] };
  }

  // List of metaobject references
  if (type === 'list.metaobject_reference') {
    const handles = value.split(',').map((h) => h.trim()).filter(Boolean);
    const gids: string[] = [];
    const missing: string[] = [];
    for (const h of handles) {
      const gid = idMap.metaobjects[h];
      if (gid) gids.push(gid);
      else missing.push(h);
    }
    if (missing.length > 0) return { resolved: null, missing };
    return { resolved: JSON.stringify(gids), missing: [] };
  }

  // List of product references
  if (type === 'list.product_reference') {
    const handles = value.split(',').map((h) => h.trim()).filter(Boolean);
    const gids: string[] = [];
    const missing: string[] = [];
    for (const h of handles) {
      const gid = idMap.products[h];
      if (gid) gids.push(gid);
      else missing.push(h);
    }
    if (missing.length > 0) return { resolved: null, missing };
    return { resolved: JSON.stringify(gids), missing: [] };
  }

  // Non-reference types: pass through as-is
  return { resolved: value, missing: [] };
}

export async function assignProductMetafields(
  client: ShopifyAdminClient,
  assignments: ProductMetafieldAssignment[],
  idMap: IdMap,
  dryRun: boolean,
  allowMissingReferences: boolean
): Promise<{ assigned: string[]; skipped: string[]; errors: string[]; missingRefs: string[] }> {
  const assigned: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const missingRefs: string[] = [];

  for (const a of assignments) {
    const productId = idMap.products[a.productHandle];
    if (!productId) {
      skipped.push(`${a.productHandle}: product not found in id-map`);
      continue;
    }

    // Resolve reference handles to GraphQL IDs
    const { resolved, missing } = resolveReferenceValue(a.type, a.value, idMap);
    if (resolved === null) {
      const msg = `${a.productHandle}.${a.key}: missing references [${missing.join(', ')}]`;
      missingRefs.push(msg);
      if (!allowMissingReferences) {
        errors.push(msg);
        continue;
      }
      logger.warn(`Skipping ${msg}`);
      skipped.push(msg);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would set ${a.namespace}.${a.key} on ${a.productHandle}`);
      assigned.push(`${a.productHandle}:${a.key} (dry-run)`);
      continue;
    }

    try {
      await client.setProductMetafield(productId, a.namespace, a.key, resolved, a.type);
      assigned.push(`${a.productHandle}:${a.key}`);
      logger.success(`Set ${a.namespace}.${a.key} on ${a.productHandle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${a.productHandle}:${a.key}: ${message}`);
      logger.error(`Failed to set ${a.namespace}.${a.key} on ${a.productHandle}: ${message}`);
    }
  }

  return { assigned, skipped, errors, missingRefs };
}
