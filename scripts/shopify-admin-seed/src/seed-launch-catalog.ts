#!/usr/bin/env node
/**
 * Seed catalog: size_table, artist, launch products, metafields, collection membership, theme settings.
 */
import 'dotenv/config';
import {
  ARTIST_HANDLE,
  GIFT_WRAP_HANDLE,
  PRODUCT_SEEDS,
  SIZE_TABLE_HANDLE,
  SIZE_TABLE_ROWS,
  THEME_SETTINGS_PATCH,
} from './definitions/launch-catalog.js';
import { listValue, mf, richTextFromPlain } from './lib/metafield-helpers.js';
import { ensureAccessToken } from './utils/shopify-auth.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';

const dryRun = process.argv.includes('--dry-run');

async function resolveMetaobjectId(
  client: ShopifyAdminClient,
  type: string,
  handle: string
): Promise<string | null> {
  const entry = await client.getMetaobjectByHandle(type, handle);
  return entry?.id ?? null;
}

async function ensureSizeTable(client: ShopifyAdminClient): Promise<string> {
  const existing = await client.getMetaobjectByHandle('size_table', SIZE_TABLE_HANDLE);
  if (existing) {
    if (!dryRun) {
      await client.updateMetaobjectEntry(existing.id, [
        { key: 'title', value: 'HORO Regular T-Shirt Size Table' },
        { key: 'name', value: 'HORO Regular T-Shirt Size Table' },
        { key: 'rows', value: JSON.stringify(SIZE_TABLE_ROWS) },
      ]);
    }
    return existing.id;
  }
  if (dryRun) return 'dry-run-size-table';
  const created = await client.createMetaobjectEntry('size_table', SIZE_TABLE_HANDLE, [
    { key: 'title', value: 'HORO Regular T-Shirt Size Table' },
    { key: 'name', value: 'HORO Regular T-Shirt Size Table' },
    { key: 'rows', value: JSON.stringify(SIZE_TABLE_ROWS) },
  ]);
  if (!created) throw new Error('size_table create failed');
  logger.success('size_table: created');
  return created.id;
}

async function ensureArtist(client: ShopifyAdminClient): Promise<string> {
  const existing = await client.getMetaobjectByHandle('artist', ARTIST_HANDLE);
  if (existing) return existing.id;
  const anyArtist = await client.listMetaobjectHandles('artist', 1);
  if (anyArtist[0]) {
    logger.info(`artist: using existing entry ${anyArtist[0].handle}`);
    return anyArtist[0].id;
  }
  if (dryRun) return 'dry-run-artist';
  const created = await client.createMetaobjectEntry('artist', ARTIST_HANDLE, [
    { key: 'name', value: 'HORO Studio' },
    { key: 'display_name', value: 'HORO Studio' },
    { key: 'slug', value: ARTIST_HANDLE },
    { key: 'style', value: 'Contemporary wearable art' },
    {
      key: 'bio',
      value: 'HORO collaborates with artists to turn feelings into premium cotton tees printed in Egypt.',
    },
    { key: 'active', value: 'true' },
    { key: 'design_count', value: '12' },
  ]);
  if (!created) throw new Error('artist create failed');
  logger.success('artist: created');
  return created.id;
}

function buildProductMetafields(
  seed: (typeof PRODUCT_SEEDS)[0],
  refs: {
    feelingId: string;
    subfeelingId: string;
    artistId: string;
    sizeTableId: string;
    occasionIds: string[];
    crossSellIds: string[];
  }
) {
  const trustChips = [
    'Premium cotton',
    'Printed in Egypt',
    'COD when shown at checkout',
    '14-day exchange — see policy',
  ];

  return [
    mf('feeling', 'metaobject_reference', refs.feelingId),
    mf('subfeeling', 'metaobject_reference', refs.subfeelingId),
    mf('pdp_tag_labels', 'list.single_line_text_field', listValue(seed.pdpTagLabels)),
    mf('artist', 'metaobject_reference', refs.artistId),
    mf('artist_display', 'single_line_text_field', 'HORO Studio'),
    mf('story', 'multi_line_text_field', 'A quiet design for people who carry calm inside.'),
    mf(
      'story_description',
      'rich_text_field',
      richTextFromPlain(
        'Every HORO tee starts with a feeling. This piece is printed in Egypt on premium cotton with a soft everyday hand-feel.'
      )
    ),
    mf('emotional_hook', 'single_line_text_field', 'For the one who chooses calm over noise.'),
    mf('design_prompt', 'single_line_text_field', 'Calm / quiet confidence / everyday wear'),
    mf('fit_note', 'multi_line_text_field', 'True to size. Choose one size up for relaxed fit.'),
    mf('fit_label', 'single_line_text_field', 'Regular fit'),
    mf('size_fit_note', 'single_line_text_field', 'Unisex T-shirt fit'),
    mf('size_table', 'metaobject_reference', refs.sizeTableId),
    mf('materials', 'rich_text_field', richTextFromPlain('100% premium cotton. Soft hand-feel.')),
    mf('care_instructions', 'rich_text_field', richTextFromPlain('Machine wash cold. Dry flat. Do not bleach.')),
    mf('dimensions_note', 'rich_text_field', richTextFromPlain('Relaxed unisex fit. See size guide for measurements.')),
    mf(
      'shipping_returns_note',
      'rich_text_field',
      richTextFromPlain('Ships across Egypt. 14-day exchange per policy when eligible.')
    ),
    mf('trust_chips', 'list.single_line_text_field', listValue(trustChips)),
    mf('features', 'list.single_line_text_field', listValue(['Soft everyday feel', 'Durable print', 'Designed in Egypt'])),
    mf('giftable', 'boolean', seed.giftable ? 'true' : 'false'),
    mf('gift_occasion_tags', 'list.single_line_text_field', listValue(seed.giftOccasionTags)),
    mf('buyer_route', 'single_line_text_field', seed.buyerRoute),
    mf('primary_audience', 'single_line_text_field', seed.primaryAudience),
    mf('works_for', 'list.single_line_text_field', listValue(seed.worksFor)),
    mf('feels_like', 'list.single_line_text_field', listValue(seed.feelsLike)),
    mf('occasions', 'list.metaobject_reference', JSON.stringify(refs.occasionIds)),
    mf('delivery_note', 'single_line_text_field', 'Delivery timing depends on your area — confirm at checkout.'),
    mf('exchange_note', 'single_line_text_field', '14-day exchange per policy when the item is unworn with original packaging.'),
    mf('stock_note', 'single_line_text_field', seed.stockNote ?? ''),
    mf('garment_colors', 'list.single_line_text_field', listValue(seed.garmentColors)),
    mf('available_sizes', 'list.single_line_text_field', listValue(['S', 'M', 'L', 'XL', 'XXL'])),
    mf('merchandising_badge', 'single_line_text_field', seed.merchandisingBadge ?? ''),
    mf('promo_label', 'single_line_text_field', seed.promoLabel ?? ''),
    mf('promo_active', 'boolean', 'false'),
    mf('frequently_bought_with_products', 'list.product_reference', JSON.stringify(refs.crossSellIds)),
    mf('complementary_products', 'list.product_reference', JSON.stringify(refs.crossSellIds)),
    mf('customers_also_bought_products', 'list.product_reference', JSON.stringify(refs.crossSellIds)),
    mf('pair_with_products', 'list.product_reference', JSON.stringify(refs.crossSellIds)),
  ].filter((m) => m.value !== '' && m.value !== '[]' && m.value !== '""');
}

async function main(): Promise<void> {
  const env = await ensureAccessToken();
  const client = new ShopifyAdminClient({ ...env, quiet: true });
  let mainTheme: { gid: string; numericId: string; name: string };
  try {
    mainTheme = await client.resolveMainTheme();
    logger.info(`MAIN theme: ${mainTheme.name} (${mainTheme.numericId})`);
  } catch {
    const numericId = process.env.SHOPIFY_THEME_ID?.trim();
    if (!numericId) {
      mainTheme = { gid: '', numericId: '', name: 'unset' };
      logger.warn(
        'Theme API unavailable and SHOPIFY_THEME_ID not set — skipping theme settings patch. Set ID from `shopify theme list` (Dawn 15.4.1 + HORO).'
      );
    } else {
      mainTheme = {
        gid: `gid://shopify/OnlineStoreTheme/${numericId}`,
        numericId,
        name: process.env.SHOPIFY_THEME_NAME?.trim() || 'HORO (Dawn)',
      };
      logger.warn(`Theme API unavailable — using SHOPIFY_THEME_ID=${numericId}`);
    }
  }
  logger.info(dryRun ? '\n--- Launch catalog seed (DRY RUN) ---\n' : '\n--- Launch catalog seed ---\n');
  logger.info(
    `Launch products status: ${process.env.SHOPIFY_LAUNCH_PRODUCT_STATUS === 'ACTIVE' ? 'ACTIVE (override)' : 'DRAFT (default — publish after photos/proof QA)'}`
  );

  const sizeTableId = await ensureSizeTable(client);
  const artistId = await ensureArtist(client);

  const productIds = new Map<string, string>();
  const productLegacyIds = new Map<string, number>();

  for (const seed of PRODUCT_SEEDS) {
    if (dryRun) {
      logger.info(`[dry-run] product ${seed.handle}`);
      productIds.set(seed.handle, `dry-run-${seed.handle}`);
      continue;
    }

    const created = await client.createProductWithSizeVariants({
      title: seed.title,
      handle: seed.handle,
      descriptionHtml: seed.descriptionHtml,
      vendor: 'HORO',
      productType: 'T-Shirt',
      tags: seed.tags,
      status: seed.status === 'ACTIVE' ? 'active' : 'draft',
      variants: seed.variants,
    });
    productIds.set(seed.handle, created.id);
    if (created.legacyId) productLegacyIds.set(created.id, created.legacyId);
    await client.publishToOnlineStore(created.id);
    logger.success(`product ${seed.handle}: ready`);
  }

  const allProductGids = [...productIds.values()].filter((id) => !id.startsWith('dry-run'));

  for (const seed of PRODUCT_SEEDS) {
    const productId = productIds.get(seed.handle);
    if (!productId || productId.startsWith('dry-run')) continue;

    const feelingId = await resolveMetaobjectId(client, 'feeling', seed.feelingSlug);
    const subHandle = `${seed.feelingSlug}-${seed.subfeelingSlug}`;
    const subfeelingId = await resolveMetaobjectId(client, 'subfeeling', subHandle);
    if (!feelingId || !subfeelingId) {
      logger.warn(`product ${seed.handle}: missing feeling/subfeeling metaobjects — run seed:launch-content first`);
      continue;
    }

    const occasionIds: string[] = [];
    for (const slug of seed.occasionSlugs) {
      const oid = await resolveMetaobjectId(client, 'occasion', slug);
      if (oid) occasionIds.push(oid);
    }

    const crossSellIds = allProductGids.filter((id) => id !== productId);

    const metafields = buildProductMetafields(seed, {
      feelingId,
      subfeelingId,
      artistId,
      sizeTableId,
      occasionIds,
      crossSellIds,
    });

    await client.metafieldsSet(productId, metafields);
    logger.success(`product ${seed.handle}: metafields set`);

    for (const colHandle of seed.collectionHandles) {
      const col = await client.getCollectionByHandle(colHandle);
      if (!col) continue;
      try {
        await client.addProductsToCollection(col.id, [productId], {
          collectionLegacyId: col.legacyId,
          productLegacyIds: productLegacyIds,
        });
      } catch (err) {
        logger.warn(
          `product ${seed.handle} → ${colHandle}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
    logger.success(`product ${seed.handle}: added to ${seed.collectionHandles.length} collections`);
  }

  if (!dryRun && mainTheme.gid) {
    const giftWrap = await client.getProductByHandle(GIFT_WRAP_HANDLE);
    if (giftWrap) {
      const patch: Record<string, string | boolean> = { ...THEME_SETTINGS_PATCH };
      patch.horo_gift_wrap_product = giftWrap.id;
      try {
        await client.patchThemeSettings(mainTheme.gid, patch);
        logger.success('theme settings: HORO gift wrap + trust/delivery patched');
      } catch (err) {
        logger.warn(
          `theme settings patch failed (add read_themes/write_themes): ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    } else {
      logger.warn(`gift-wrap product not found — create it in Admin or keep existing handle "${GIFT_WRAP_HANDLE}"`);
    }
  }

  logger.success('\nCatalog seed complete. Verify: npm run verify:full\n');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
