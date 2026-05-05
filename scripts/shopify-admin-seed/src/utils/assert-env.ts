/**
 * Validate required environment variables before any network call.
 *
 * Supports two authentication modes:
 * 1. Static token (Custom App): SHOPIFY_ADMIN_ACCESS_TOKEN
 * 2. OAuth (Partner App): SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET
 */

import * as logger from './logger.js';

export type AuthMode = 'static' | 'oauth';

export interface Env {
  storeDomain: string;
  accessToken: string;
  apiVersion: string;
  authMode: AuthMode;
}

export interface OAuthEnv {
  storeDomain: string;
  clientId: string;
  clientSecret: string;
  scopes: string;
  apiVersion: string;
}

export function detectAuthMode(): AuthMode {
  const hasStaticToken = !!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  const hasOAuth = !!(process.env.SHOPIFY_CLIENT_ID?.trim() && process.env.SHOPIFY_CLIENT_SECRET?.trim());

  if (hasStaticToken) return 'static';
  if (hasOAuth) return 'oauth';

  return 'static'; // Will fail in assertEnv with a clear error
}

export function assertEnv(): Env {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2025-04';
  const authMode = detectAuthMode();

  if (!storeDomain) {
    logger.error('Missing SHOPIFY_STORE_DOMAIN environment variable.');
    process.exit(1);
  }

  if (authMode === 'static') {
    const accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      logger.error('Missing SHOPIFY_ADMIN_ACCESS_TOKEN environment variable.');
      logger.error('Alternatively, set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET for OAuth mode.');
      process.exit(1);
    }
    if (!accessToken.startsWith('shpat_')) {
      logger.warn('SHOPIFY_ADMIN_ACCESS_TOKEN does not start with "shpat_". Verify this is a valid Admin API token.');
    }
    logger.info(`Auth mode: static token`);
    logger.info(`Store: ${storeDomain}`);
    logger.info(`API version: ${apiVersion}`);
    return { storeDomain, accessToken, apiVersion, authMode: 'static' };
  }

  // OAuth mode — token will be obtained later via OAuth flow
  logger.info(`Auth mode: OAuth (Partner app)`);
  logger.info(`Store: ${storeDomain}`);
  logger.info(`API version: ${apiVersion}`);
  return { storeDomain, accessToken: '', apiVersion, authMode: 'oauth' };
}

export function getOAuthConfig(): OAuthEnv {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim() || '';
  const clientId = process.env.SHOPIFY_CLIENT_ID?.trim() || '';
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET?.trim() || '';
  const scopes =
    process.env.SHOPIFY_SCOPES?.trim() ||
    'read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects,read_products,write_products';
  const apiVersion = process.env.SHOPIFY_API_VERSION?.trim() || '2025-04';

  if (!storeDomain) {
    logger.error('Missing SHOPIFY_STORE_DOMAIN environment variable.');
    process.exit(1);
  }

  if (!clientId) {
    logger.error('Missing SHOPIFY_CLIENT_ID environment variable.');
    process.exit(1);
  }

  if (!clientSecret) {
    logger.error('Missing SHOPIFY_CLIENT_SECRET environment variable.');
    process.exit(1);
  }

  return { storeDomain, clientId, clientSecret, scopes, apiVersion };
}
