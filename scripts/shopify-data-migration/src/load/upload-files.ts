/**
 * Upload files to Shopify Admin.
 * Placeholder: implement file upload via staged uploads if needed.
 */

import { ShopifyAdminClient } from '../shopify-admin.js';
import { IdMap } from '../state/id-map.js';
import * as logger from '../utils/logger.js';

export async function uploadFiles(
  _client: ShopifyAdminClient,
  _imagePaths: string[],
  _idMap: IdMap,
  dryRun: boolean
): Promise<{ uploaded: string[]; skipped: string[]; errors: string[] }> {
  if (dryRun) {
    logger.dryRun('Would upload files to Shopify');
  }

  // Placeholder: implement Shopify staged upload flow
  logger.warn('File upload not yet implemented. Products will be created without images.');

  return { uploaded: [], skipped: [], errors: [] };
}
