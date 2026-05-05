/**
 * Validate required environment variables before any network call.
 */

import * as logger from './logger.js';

export interface Env {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
}

export function assertEnv(): Env {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2025-04';

  if (!storeDomain) {
    logger.error('Missing SHOPIFY_STORE_DOMAIN environment variable.');
    process.exit(1);
  }

  if (!accessToken) {
    logger.error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN environment variable.');
    process.exit(1);
  }

  if (!accessToken.startsWith('shpat_')) {
    logger.warn('SHOPIFY_ADMIN_ACCESS_TOKEN does not start with "shpat_". Verify this is a valid Admin API token.');
  }

  logger.info(`Store: ${storeDomain}`);
  logger.info(`API version: ${apiVersion}`);

  return { storeDomain, accessToken, apiVersion };
}
