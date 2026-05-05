/**
 * Load products into Shopify Admin.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export interface ShopifyProductInput {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status: 'ACTIVE' | 'DRAFT';
}

export async function createProducts(
  client: ShopifyAdminClient,
  products: Array<{ handle: string; shopifyInput: ShopifyProductInput }>,
  idMap: IdMap,
  dryRun: boolean
): Promise<{ created: string[]; skipped: string[]; errors: string[] }> {
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const product of products) {
    // Check if already exists
    if (idMap.products[product.handle]) {
      skipped.push(product.handle);
      continue;
    }

    if (dryRun) {
      logger.dryRun(`Would create product: ${product.shopifyInput.title} (${product.handle})`);
      created.push(`${product.handle} (dry-run)`);
      continue;
    }

    try {
      const existing = await client.getProductByHandle(product.handle);
      if (existing) {
        idMap.products[product.handle] = existing.id;
        skipped.push(`${product.handle} (already exists)`);
        logger.info(`Product ${product.handle} already exists, skipping`);
        continue;
      }

      const result = await client.createProduct(product.shopifyInput);
      if (result) {
        idMap.products[product.handle] = result.id;
        created.push(product.handle);
        logger.success(`Created product: ${product.shopifyInput.title}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${product.handle}: ${message}`);
      logger.error(`Failed to create product ${product.handle}: ${message}`);
    }
  }

  return { created, skipped, errors };
}
