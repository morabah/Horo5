/**
 * Assign metafields to collections.
 * Resolves handle references to Shopify GraphQL IDs before assignment.
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

function resolveReferenceValue(
  type: string,
  value: string,
  idMap: IdMap
): { resolved: string | null; missing: string[] } {
  if (!value) return { resolved: value, missing: [] };

  if (type === 'metaobject_reference') {
    const gid = idMap.metaobjects[value];
    if (!gid) return { resolved: null, missing: [value] };
    return { resolved: gid, missing: [] };
  }

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

  return { resolved: value, missing: [] };
}

export async function assignCollectionMetafields(
  client: ShopifyAdminClient,
  assignments: CollectionMetafieldAssignment[],
  idMap: IdMap,
  dryRun: boolean,
  allowMissingReferences: boolean
): Promise<{ assigned: string[]; skipped: string[]; errors: string[]; missingRefs: string[] }> {
  const assigned: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const missingRefs: string[] = [];

  for (const a of assignments) {
    const collectionId = idMap.collections[a.collectionHandle];
    if (!collectionId) {
      skipped.push(`${a.collectionHandle}: collection not found in id-map`);
      continue;
    }

    const { resolved, missing } = resolveReferenceValue(a.type, a.value, idMap);
    if (resolved === null) {
      const msg = `${a.collectionHandle}.${a.key}: missing references [${missing.join(', ')}]`;
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
      logger.dryRun(`Would set ${a.namespace}.${a.key} on ${a.collectionHandle}`);
      assigned.push(`${a.collectionHandle}:${a.key} (dry-run)`);
      continue;
    }

    try {
      await client.setCollectionMetafield(collectionId, a.namespace, a.key, resolved, a.type);
      assigned.push(`${a.collectionHandle}:${a.key}`);
      logger.success(`Set ${a.namespace}.${a.key} on ${a.collectionHandle}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${a.collectionHandle}:${a.key}: ${message}`);
      logger.error(`Failed to set ${a.namespace}.${a.key} on ${a.collectionHandle}: ${message}`);
    }
  }

  return { assigned, skipped, errors, missingRefs };
}
