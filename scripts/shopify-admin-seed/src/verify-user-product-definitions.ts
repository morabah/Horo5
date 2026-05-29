#!/usr/bin/env node
/**
 * Verify the product metafield definitions the merchant listed in Admin UI.
 */
import 'dotenv/config';
import { assertEnv, getOAuthConfig } from './utils/assert-env.js';
import { getAccessTokenViaOAuth } from './utils/oauth.js';
import { ShopifyAdminClient } from './shopify-admin.js';

const REQUIRED: Array<{ label: string; key: string; type: string }> = [
  { label: 'Feeling', key: 'feeling', type: 'metaobject_reference' },
  { label: 'Subfeeling', key: 'subfeeling', type: 'metaobject_reference' },
  { label: 'Size table', key: 'size_table', type: 'metaobject_reference' },
  { label: 'Promo savings (EGP)', key: 'promo_savings_egp', type: 'number_integer' },
  { label: 'Occasions', key: 'occasions', type: 'list.metaobject_reference' },
  { label: 'Artist', key: 'artist', type: 'metaobject_reference' },
  { label: 'Promo label', key: 'promo_label', type: 'single_line_text_field' },
  { label: 'Promo label (Arabic)', key: 'promo_label_ar', type: 'single_line_text_field' },
  { label: 'Pair with products', key: 'pair_with_products', type: 'list.product_reference' },
  { label: 'Promo active', key: 'promo_active', type: 'boolean' },
  { label: 'Promo ends at', key: 'promo_ends_at', type: 'date_time' },
  { label: 'Trust chips', key: 'trust_chips', type: 'list.single_line_text_field' },
  { label: 'WhatsApp help URL', key: 'whatsapp_help_url', type: 'url' },
  { label: 'Dimensions note', key: 'dimensions_note', type: 'rich_text_field' },
  { label: 'Features', key: 'features', type: 'list.single_line_text_field' },
  { label: 'Fit note', key: 'fit_note', type: 'multi_line_text_field' },
  { label: 'Materials', key: 'materials', type: 'rich_text_field' },
  { label: 'Care instructions', key: 'care_instructions', type: 'rich_text_field' },
  { label: 'Story', key: 'story', type: 'multi_line_text_field' },
  { label: 'Story description', key: 'story_description', type: 'rich_text_field' },
  { label: 'Design story', key: 'design_story', type: 'rich_text_field' },
];

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
  const existing = await client.getMetafieldDefinitions('PRODUCT');
  const byKey = new Map(existing.filter((d) => d.namespace === 'custom').map((d) => [d.key, d]));

  const missing: string[] = [];
  const wrongType: string[] = [];
  const ok: string[] = [];

  for (const req of REQUIRED) {
    const def = byKey.get(req.key);
    if (!def) {
      missing.push(`${req.label} (custom.${req.key})`);
      continue;
    }
    if (def.type.name !== req.type) {
      wrongType.push(
        `${req.label}: custom.${req.key} is "${def.type.name}" but theme expects "${req.type}"`
      );
      continue;
    }
    ok.push(`${req.label} → custom.${req.key} (${def.type.name})`);
  }

  console.log('\n--- Required product metafield definitions ---\n');
  ok.forEach((line) => console.log(`✓ ${line}`));
  if (wrongType.length) {
    console.log('\n⚠ Type mismatch (fix in Admin or re-create definition):\n');
    wrongType.forEach((line) => console.log(`  ${line}`));
  }
  if (missing.length) {
    console.log('\n✗ Missing:\n');
    missing.forEach((line) => console.log(`  ${line}`));
    process.exit(1);
  }
  if (wrongType.length) {
    process.exit(1);
  }
  console.log(`\nAll ${REQUIRED.length} definitions exist with correct types.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
