/**
 * Load products into Shopify Admin.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';
import { uploadFiles } from './upload-files.js';

export interface ShopifyProductInput {
  title: string;
  descriptionHtml?: string;
  vendor?: string;
  productType?: string;
  tags?: string[];
  status: 'ACTIVE' | 'DRAFT';
  variants?: Array<{
    price: string;
    compareAtPrice?: string;
    sku?: string;
    inventoryQuantities?: Array<{ locationId?: string; availableQuantity: number }>;
    options?: string[];
  }>;
  options?: string[];
}

export interface ProductWithImages {
  handle: string;
  shopifyInput: ShopifyProductInput;
  images?: string[];
  imageAlts?: string[];
}

export async function createProducts(
  client: ShopifyAdminClient,
  products: ProductWithImages[],
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
      if (product.images && product.images.length > 0) {
        logger.dryRun(`  with ${product.images.length} images`);
      }
      if (product.shopifyInput.variants && product.shopifyInput.variants.length > 0) {
        logger.dryRun(`  with ${product.shopifyInput.variants.length} variants`);
      }
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

        // Upload and attach images
        if (product.images && product.images.length > 0) {
          const imageJobs = product.images.map((url, i) => ({
            sourceUrl: url,
            alt: product.imageAlts?.[i] ?? `${product.shopifyInput.title} — image ${i + 1}`,
          }));
          const uploadResult = await uploadFiles(client, imageJobs, idMap, false);
          if (uploadResult.uploaded.length > 0) {
            const media = uploadResult.uploaded.map((u) => ({
              mediaContentType: 'IMAGE' as const,
              originalSource: u.sourceUrl,
              alt: imageJobs.find((j) => j.sourceUrl === u.sourceUrl)?.alt ?? '',
            }));
            try {
              await client.productAppendMedia(result.id, media);
              logger.success(`Attached ${media.length} images to ${product.handle}`);
            } catch (mediaErr) {
              const msg = mediaErr instanceof Error ? mediaErr.message : String(mediaErr);
              logger.warn(`Failed to attach images to ${product.handle}: ${msg}`);
            }
          }
          if (uploadResult.errors.length > 0) {
            uploadResult.errors.forEach((e) => logger.warn(`  Image error: ${e}`));
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${product.handle}: ${message}`);
      logger.error(`Failed to create product ${product.handle}: ${message}`);
    }
  }

  return { created, skipped, errors };
}
