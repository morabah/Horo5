#!/usr/bin/env node
/**
 * Verify HORO Custom Data against the full launch Admin checklist (definitions + optional content counts).
 */
import 'dotenv/config';
import { CORE_METAOBJECTS } from './definitions/metaobjects.js';
import { PRODUCT_METAFIELDS } from './definitions/product-metafields.js';
import { ensureAccessToken } from './utils/shopify-auth.js';
import { ShopifyAdminClient } from './shopify-admin.js';

/** Product metafields required for launch (namespace custom). */
const MUST_HAVE_PRODUCT_KEYS = [
  'feeling',
  'subfeeling',
  'pdp_tag_labels',
  'artist',
  'artist_display',
  'story',
  'story_description',
  'fit_note',
  'fit_label',
  'size_fit_note',
  'size_table',
  'materials',
  'care_instructions',
  'dimensions_note',
  'shipping_returns_note',
  'trust_chips',
  'features',
  'giftable',
  'gift_occasion_tags',
  'proof_gallery',
  'review_proof',
  'delivery_note',
  'exchange_note',
  'frequently_bought_with_products',
  'complementary_products',
  'customers_also_bought_products',
  'pair_with_products',
] as const;

/** Metaobject field keys expected per type (launch checklist). */
const METAOBJECT_FIELD_CHECKLIST: Record<string, string[]> = {
  feeling: [
    'title',
    'name',
    'slug',
    'active',
    'sort_order',
    'tagline',
    'description',
    'blurb',
    'manifesto',
    'card_image',
    'hero_image',
    'accent_color',
    'collection',
    'collection_url',
    'seo_title',
    'seo_description',
  ],
  subfeeling: [
    'title',
    'slug',
    'active',
    'sort_order',
    'parent_feeling',
    'feeling_slug',
    'collection_url',
    'filter_url',
    'description',
    'blurb',
    'card_image',
    'hero_image',
  ],
  occasion: [
    'title',
    'slug',
    'active',
    'sort_order',
    'description',
    'blurb',
    'tagline',
    'card_image',
    'hero_image',
    'accent_color',
    'collection',
    'collection_url',
    'is_gift_occasion',
    'price_hint',
  ],
  artist: [
    'name',
    'display_name',
    'style',
    'bio',
    'avatar',
    'portfolio_url',
    'active',
    'design_count',
  ],
  size_table: ['title', 'rows', 'content'],
  proof_item: ['image', 'tag', 'label', 'caption', 'sort_order'],
  ugc_proof: [
    'product',
    'image',
    'video_url',
    'body',
    'rating',
    'instagram_handle',
    'permission_to_repost',
    'ugc_type',
    'source',
    'sort_order',
    'active',
  ],
};

const FEELING_HANDLES = ['feeling-mood', 'feeling-zodiac', 'feeling-career', 'feeling-fiction', 'feeling-trends'];
const OCCASION_HANDLES = ['occasion-birthday', 'occasion-eid', 'occasion-graduation', 'occasion-gift'];
const PAGE_HANDLES = ['feelings', 'occasions', 'gifts-hub', 'comparison-faq', 'why-horo'];

async function main(): Promise<void> {
  const env = await ensureAccessToken();
  const client = new ShopifyAdminClient({ ...env, quiet: true });
  const metaobjects = await client.getMetaobjectDefinitions();
  const productMf = await client.getMetafieldDefinitions('PRODUCT');
  const productByKey = new Map(
    productMf.filter((d) => d.namespace === 'custom').map((d) => [d.key, d])
  );

  let exitCode = 0;

  console.log('\n=== 1. Product metafields (custom) — must-have ===\n');
  for (const key of MUST_HAVE_PRODUCT_KEYS) {
    const def = productByKey.get(key);
    const spec = PRODUCT_METAFIELDS.find((p) => p.key === key);
    if (!def) {
      console.log(`✗ MISSING custom.${key}`);
      exitCode = 1;
    } else if (spec && def.type.name !== spec.type) {
      console.log(`⚠ custom.${key}: store type "${def.type.name}" ≠ seeder "${spec.type}"`);
      exitCode = 1;
    } else {
      console.log(`✓ custom.${key} (${def.type.name})`);
    }
  }

  console.log('\n=== 2. Metaobject definitions — field checklist ===\n');
  for (const desired of CORE_METAOBJECTS) {
    const existing = metaobjects.find((m) => m.type === desired.type);
    const expectedKeys = METAOBJECT_FIELD_CHECKLIST[desired.type] ?? desired.fieldDefinitions.map((f) => f.key);
    if (!existing) {
      console.log(`✗ MISSING metaobject type: ${desired.type}`);
      exitCode = 1;
      continue;
    }
    const existingKeys = new Set(existing.fieldDefinitions.map((f) => f.key));
    const missing = expectedKeys.filter((k) => !existingKeys.has(k));
    const extra = [...existingKeys].filter((k) => !expectedKeys.includes(k) && !desired.fieldDefinitions.some((f) => f.key === k));
    if (missing.length === 0) {
      console.log(`✓ ${desired.type} (${existing.fieldDefinitions.length} fields on store)`);
    } else {
      console.log(`⚠ ${desired.type} missing fields: ${missing.join(', ')}`);
      console.log(`  → npm run sync:metaobject-fields (after updating seeder) or Admin → Custom data`);
      exitCode = 1;
    }
    if (extra.length > 0) {
      console.log(`  ℹ ${desired.type} extra store fields (OK): ${extra.join(', ')}`);
    }
  }

  console.log('\n=== 3. Content — entries, collections, pages (manual launch) ===\n');

  const contentQuery = `
    query LaunchContentAudit {
      feelings: metaobjects(type: "feeling", first: 20) { nodes { id handle displayName } }
      subfeelings: metaobjects(type: "subfeeling", first: 20) { nodes { id handle } }
      occasions: metaobjects(type: "occasion", first: 20) { nodes { id handle } }
      artists: metaobjects(type: "artist", first: 20) { nodes { id handle } }
      sizeTables: metaobjects(type: "size_table", first: 10) { nodes { id handle } }
      products: products(first: 10, query: "status:active OR status:draft") {
        nodes { id title handle status totalInventory }
      }
      collections(first: 50) { nodes { id handle title productsCount { count } } }
    }
  `;

  let pages: Array<{ handle: string }> = [];
  try {
    const pagesRes = await client.request<{ pages: { nodes: Array<{ handle: string }> } }>(`
      query { pages(first: 20) { nodes { handle title } } }
    `);
    pages = pagesRes.data?.pages.nodes ?? [];
  } catch {
    console.log('  ℹ pages: skipped (OAuth app needs read_content scope)\n');
  }

  const { data } = await client.request<{
    feelings: { nodes: Array<{ handle: string }> };
    subfeelings: { nodes: unknown[] };
    occasions: { nodes: unknown[] };
    artists: { nodes: unknown[] };
    sizeTables: { nodes: unknown[] };
    products: { nodes: Array<{ title: string; handle: string; status: string; totalInventory: number }> };
    collections: { nodes: Array<{ handle: string; productsCount: { count: number } }> };
  }>(contentQuery);

  const d = data!;
  const pageNodes = pages;
  const auditContent = (label: string, count: number, min = 1) => {
    if (count >= min) console.log(`✓ ${label}: ${count}`);
    else {
      console.log(`✗ ${label}: ${count} (need ≥ ${min})`);
      exitCode = 1;
    }
  };

  auditContent('Feeling entries', d.feelings.nodes.length);
  auditContent('Subfeeling entries', d.subfeelings.nodes.length);
  auditContent('Occasion entries', d.occasions.nodes.length);
  auditContent('Artist entries', d.artists.nodes.length, 0);
  auditContent('Size table entries', d.sizeTables.nodes.length, 0);
  auditContent('Products (active/draft)', d.products.nodes.length);

  for (const handle of FEELING_HANDLES) {
    const c = d.collections.nodes.find((x) => x.handle === handle);
    if (c) console.log(`✓ collection ${handle} (${c.productsCount.count} products)`);
    else {
      console.log(`✗ MISSING collection handle: ${handle}`);
      exitCode = 1;
    }
  }

  for (const handle of OCCASION_HANDLES) {
    const c = d.collections.nodes.find((x) => x.handle === handle);
    if (c) console.log(`✓ collection ${handle} (${c.productsCount.count} products)`);
    else {
      console.log(`✗ MISSING collection handle: ${handle}`);
      exitCode = 1;
    }
  }

  for (const handle of PAGE_HANDLES) {
    const p = pageNodes.find((x) => x.handle === handle);
    if (p) console.log(`✓ page /pages/${handle}`);
    else {
      console.log(`✗ MISSING page handle: ${handle}`);
      exitCode = 1;
    }
  }

  if (d.products.nodes.length > 0) {
    console.log('\n  Products on store:');
    for (const p of d.products.nodes) {
      console.log(`    - ${p.title} (${p.handle}) [${p.status}] inv=${p.totalInventory}`);
    }
  }

  console.log('\n=== 4. Not verified via API (do in Admin) ===\n');
  console.log('  • Theme settings: horo_gift_wrap_product, horo_incentives_live=OFF, trust badges, WhatsApp URL');
  console.log('  • Payments / shipping / policies vs storefront copy');
  console.log('  • Product metafield VALUES on master SKU');
  console.log('  • Collection membership (multi-placement)');
  console.log('  • Mobile QA: PDP → cart → checkout, Arabic RTL\n');

  console.log('=== Summary ===\n');
  if (exitCode === 0) {
    console.log('Definitions match checklist; content counts look ready.\n');
  } else {
    console.log('Gaps found — fix definitions (seed/sync) then create Admin content per HORO_DATA_CONTRACT §10–11.\n');
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
