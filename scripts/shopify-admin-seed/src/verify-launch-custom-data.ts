#!/usr/bin/env node
/**
 * Verify HORO launch Custom Data setup (metaobjects, product + collection metafields).
 */
import 'dotenv/config';
import { CORE_METAOBJECTS } from './definitions/metaobjects.js';
import { COLLECTION_METAFIELDS } from './definitions/collection-metafields.js';
import { PRODUCT_METAFIELDS } from './definitions/product-metafields.js';
import { assertEnv, getOAuthConfig } from './utils/assert-env.js';
import { getAccessTokenViaOAuth } from './utils/oauth.js';
import { ShopifyAdminClient } from './shopify-admin.js';

const LAUNCH_PRODUCT_KEYS = new Set([
  'feeling',
  'subfeeling',
  'fit_label',
  'story',
  'story_description',
  'trust_chips',
  'giftable',
  'pdp_tag_labels',
  'size_table',
  'proof_gallery',
  'pair_with_products',
]);

const RECOMMENDED_PRODUCT_KEYS = new Set([
  'fit_note',
  'size_fit_note',
  'low_stock_message',
  'stock_note',
  'features',
  'works_for',
  'feels_like',
  'buyer_route',
  'primary_audience',
  'promo_label',
  'merchandising_badge',
  'complementary_products',
  'frequently_bought_with_products',
  'customers_also_bought_products',
  'available_sizes',
  'garment_colors',
  'materials',
  'care_instructions',
  'dimensions_note',
  'whatsapp_help_url',
  'design_story',
  'occasions',
  'artist',
  'review_proof',
]);

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
  const metaobjects = await client.getMetaobjectDefinitions();
  const productMf = await client.getMetafieldDefinitions('PRODUCT');
  const collectionMf = await client.getMetafieldDefinitions('COLLECTION');

  let exitCode = 0;

  console.log('\n=== Metaobject definitions ===\n');
  for (const desired of CORE_METAOBJECTS) {
    const existing = metaobjects.find((m) => m.type === desired.type);
    if (!existing) {
      console.log(`✗ MISSING type: ${desired.type}`);
      exitCode = 1;
      continue;
    }
    const existingKeys = new Set(existing.fieldDefinitions.map((f) => f.key));
    const missingFields = desired.fieldDefinitions.filter((f) => !existingKeys.has(f.key));
    if (missingFields.length === 0) {
      console.log(`✓ ${desired.type} (${existing.fieldDefinitions.length} fields)`);
    } else {
      console.log(`⚠ ${desired.type} exists but missing fields: ${missingFields.map((f) => f.key).join(', ')}`);
      console.log(`  → Add in Admin: Settings → Custom data → ${desired.name} → Add field`);
      exitCode = 1;
    }
  }

  const productByKey = new Map(
    productMf.filter((d) => d.namespace === 'custom').map((d) => [d.key, d])
  );

  console.log('\n=== Product metafields (launch minimum) ===\n');
  for (const key of LAUNCH_PRODUCT_KEYS) {
    const def = productByKey.get(key);
    const spec = PRODUCT_METAFIELDS.find((p) => p.key === key);
    if (!def) {
      console.log(`✗ MISSING custom.${key}`);
      exitCode = 1;
    } else if (spec && def.type.name !== spec.type) {
      console.log(`⚠ custom.${key} type "${def.type.name}" ≠ expected "${spec.type}"`);
      exitCode = 1;
    } else {
      console.log(`✓ custom.${key}`);
    }
  }

  console.log('\n=== Product metafields (recommended extras) ===\n');
  let recMissing = 0;
  for (const key of RECOMMENDED_PRODUCT_KEYS) {
    const def = productByKey.get(key);
    if (!def) {
      console.log(`✗ MISSING custom.${key}`);
      recMissing++;
    } else {
      console.log(`✓ custom.${key}`);
    }
  }
  if (recMissing > 0) exitCode = 1;

  const collectionByKey = new Map(
    collectionMf.filter((d) => d.namespace === 'custom').map((d) => [d.key, d])
  );

  console.log('\n=== Collection metafields ===\n');
  for (const spec of COLLECTION_METAFIELDS) {
    const def = collectionByKey.get(spec.key);
    if (!def) {
      console.log(`✗ MISSING custom.${spec.key}`);
      exitCode = 1;
    } else if (def.type.name !== spec.type) {
      console.log(`⚠ custom.${spec.key} type mismatch`);
      exitCode = 1;
    } else {
      console.log(`✓ custom.${spec.key}`);
    }
  }

  console.log('\n=== Summary ===\n');
  if (exitCode === 0) {
    console.log('All launch Custom Data definitions are present.\n');
    console.log('Next (manual in Admin): Content → Metaobjects entries, collections, product values.\n');
  } else {
    console.log('Some definitions or metaobject fields are missing.');
    console.log('Run: npm run seed:definitions');
    console.log('For metaobject field gaps on existing types, add fields in Admin or use --force-recreate (deletes entries).\n');
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
