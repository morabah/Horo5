#!/usr/bin/env node
/**
 * Enable storefront PUBLIC_READ on all HORO metaobject definitions.
 * Fixes Admin warning: "Storefront doesn't have access to these selected metaobjects: Feeling"
 */
import 'dotenv/config';
import { CORE_METAOBJECTS, OPTIONAL_METAOBJECTS } from './definitions/metaobjects.js';
import { assertEnv, getOAuthConfig } from './utils/assert-env.js';
import { getAccessTokenViaOAuth } from './utils/oauth.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';

const TYPES = [...CORE_METAOBJECTS, ...OPTIONAL_METAOBJECTS].map((d) => d.type);

async function main(): Promise<void> {
  const env = assertEnv();
  if (!env.accessToken) {
    const oauth = getOAuthConfig();
    const token = await getAccessTokenViaOAuth({
      storeDomain: oauth.storeDomain,
      clientId: oauth.clientId,
      clientSecret: oauth.clientSecret,
      scopes: oauth.scopes,
    });
    env.accessToken = token.accessToken;
  }

  const client = new ShopifyAdminClient(env);
  const existing = await client.getMetaobjectDefinitions();

  for (const type of TYPES) {
    const def = existing.find((m) => m.type === type);
    if (!def) {
      logger.warn(`Skip ${type}: definition not found`);
      continue;
    }
    await client.updateMetaobjectDefinitionAccess(def.id, 'PUBLIC_READ');
    logger.success(`${type}: storefront access → PUBLIC_READ`);
  }

  logger.success('\nDone. Refresh Subfeeling in Admin — the Feeling warning should clear.\n');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
