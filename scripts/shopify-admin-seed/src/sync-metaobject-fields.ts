#!/usr/bin/env node
/**
 * Add missing field definitions to existing HORO metaobject types (non-destructive).
 */
import 'dotenv/config';
import { CORE_METAOBJECTS } from './definitions/metaobjects.js';
import { assertEnv, getOAuthConfig } from './utils/assert-env.js';
import { getAccessTokenViaOAuth } from './utils/oauth.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';

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

  for (const desired of CORE_METAOBJECTS) {
    const def = existing.find((m) => m.type === desired.type);
    if (!def) {
      logger.error(`Metaobject type missing: ${desired.type} — run npm run seed:definitions first`);
      continue;
    }

    const existingKeys = new Set(def.fieldDefinitions.map((f) => f.key));
    const missing = desired.fieldDefinitions.filter((f) => !existingKeys.has(f.key));
    if (missing.length === 0) {
      logger.success(`${desired.type}: all fields present`);
      continue;
    }

    logger.info(`${desired.type}: adding ${missing.map((f) => f.key).join(', ')}`);
    await client.addMetaobjectFieldDefinitions(
      def.id,
      missing.map((f) => ({
        key: f.key,
        name: f.name,
        type: f.type,
        description: f.description,
        required: f.required,
      }))
    );
    logger.success(`${desired.type}: added ${missing.length} field(s)`);
  }

  logger.success('\nDone. Re-run: npm run verify:launch\n');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
