#!/usr/bin/env node
/**
 * Seed HORO launch content: collections, metaobject entries, collection metafields, pages.
 * Idempotent — skips or updates when handles already exist.
 *
 * Usage:
 *   npm run seed:launch-content
 *   npm run seed:launch-content -- --dry-run
 */
import 'dotenv/config';
import {
  allCollectionSeeds,
  FEELING_SEEDS,
  OCCASION_SEEDS,
  PAGE_SEEDS,
  SUBFEELING_SEEDS,
} from './definitions/launch-content.js';
import { ensureAccessToken } from './utils/shopify-auth.js';
import * as logger from './utils/logger.js';
import { ShopifyAdminClient } from './shopify-admin.js';

const dryRun = process.argv.includes('--dry-run');

function storeBaseUrl(domain: string): string {
  const d = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${d}`;
}

async function ensureCollection(
  client: ShopifyAdminClient,
  seed: { handle: string; title: string; descriptionHtml?: string },
  storeUrl: string
): Promise<{ id: string; handle: string }> {
  const existing = await client.getCollectionByHandle(seed.handle);
  if (existing) {
    logger.info(`collection ${seed.handle}: exists`);
    return { id: existing.id, handle: existing.handle };
  }
  if (dryRun) {
    logger.info(`[dry-run] would create collection ${seed.handle}`);
    return { id: `dry-run-${seed.handle}`, handle: seed.handle };
  }
  const created = await client.createCollection({
    title: seed.title,
    handle: seed.handle,
    descriptionHtml: seed.descriptionHtml,
  });
  if (!created) throw new Error(`Failed to create collection ${seed.handle}`);
  await client.publishToOnlineStore(created.id);
  logger.success(`collection ${seed.handle}: created`);
  return created;
}

async function main(): Promise<void> {
  const env = await ensureAccessToken();
  const client = new ShopifyAdminClient(env);
  const storeUrl = storeBaseUrl(env.storeDomain);

  logger.info(dryRun ? '\n--- HORO launch content seed (DRY RUN) ---\n' : '\n--- HORO launch content seed ---\n');

  const collectionIds = new Map<string, string>();

  for (const seed of allCollectionSeeds()) {
    const col = await ensureCollection(client, seed, storeUrl);
    collectionIds.set(seed.handle, col.id);
  }

  const feelingIds = new Map<string, string>();

  for (const f of FEELING_SEEDS) {
    const handle = f.slug;
    const collectionId = collectionIds.get(f.collectionHandle);
    const collectionUrl = `${storeUrl}/collections/${f.collectionHandle}`;
    const fields = [
      { key: 'title', value: f.title },
      { key: 'name', value: f.title },
      { key: 'slug', value: f.slug },
      { key: 'active', value: 'true' },
      { key: 'sort_order', value: String(f.sortOrder) },
      ...(f.tagline ? [{ key: 'tagline', value: f.tagline }] : []),
      { key: 'collection_url', value: collectionUrl },
      ...(collectionId && !collectionId.startsWith('dry-run')
        ? [{ key: 'collection', value: collectionId }]
        : []),
    ];

    let entry = await client.getMetaobjectByHandle('feeling', handle);
    if (entry) {
      logger.info(`feeling ${handle}: exists`);
      if (!dryRun) {
        await client.updateMetaobjectEntry(entry.id, fields);
        logger.success(`feeling ${handle}: updated links`);
      }
    } else if (dryRun) {
      logger.info(`[dry-run] would create feeling ${handle}`);
      entry = { id: `dry-run-feeling-${handle}`, handle };
    } else {
      entry = await client.createMetaobjectEntry('feeling', handle, fields);
      if (!entry) throw new Error(`Failed to create feeling ${handle}`);
      logger.success(`feeling ${handle}: created`);
    }
    feelingIds.set(f.slug, entry.id);

    if (collectionId && !collectionId.startsWith('dry-run') && !dryRun) {
      await client.setCollectionMetafield(collectionId, 'custom', 'feeling', entry.id, 'metaobject_reference');
      logger.success(`collection ${f.collectionHandle}: custom.feeling set`);
    }
  }

  for (const s of SUBFEELING_SEEDS) {
    const parentId = feelingIds.get(s.parentFeelingSlug);
    if (!parentId) {
      logger.warn(`subfeeling ${s.slug}: parent feeling ${s.parentFeelingSlug} missing — skip`);
      continue;
    }
    const collectionUrl = `${storeUrl}/collections/${s.collectionHandle}`;
    const fields = [
      { key: 'title', value: s.title },
      { key: 'slug', value: s.slug },
      { key: 'active', value: 'true' },
      { key: 'sort_order', value: String(s.sortOrder) },
      { key: 'parent_feeling', value: parentId },
      { key: 'feeling_slug', value: s.parentFeelingSlug },
      { key: 'collection_url', value: collectionUrl },
    ];

    const handle = `${s.parentFeelingSlug}-${s.slug}`;
    let entry = await client.getMetaobjectByHandle('subfeeling', handle);
    if (entry) {
      logger.info(`subfeeling ${handle}: exists`);
      if (!dryRun) {
        await client.updateMetaobjectEntry(entry.id, fields);
        logger.success(`subfeeling ${handle}: updated`);
      }
    } else if (dryRun) {
      logger.info(`[dry-run] would create subfeeling ${handle}`);
    } else {
      entry = await client.createMetaobjectEntry('subfeeling', handle, fields);
      if (!entry) throw new Error(`Failed to create subfeeling ${handle}`);
      logger.success(`subfeeling ${handle}: created`);
    }

    const subColId = collectionIds.get(s.collectionHandle);
    const parentColId = collectionIds.get(
      FEELING_SEEDS.find((f) => f.slug === s.parentFeelingSlug)?.collectionHandle ?? ''
    );
    if (subColId && parentId && !dryRun && !subColId.startsWith('dry-run')) {
      await client.setCollectionMetafield(subColId, 'custom', 'feeling', parentId, 'metaobject_reference');
      logger.success(`collection ${s.collectionHandle}: custom.feeling → ${s.parentFeelingSlug}`);
    }
    void parentColId;
  }

  for (const o of OCCASION_SEEDS) {
    const collectionId = collectionIds.get(o.collectionHandle);
    const collectionUrl = `${storeUrl}/collections/${o.collectionHandle}`;
    const fields = [
      { key: 'title', value: o.title },
      { key: 'slug', value: o.slug },
      { key: 'active', value: 'true' },
      { key: 'sort_order', value: String(o.sortOrder) },
      { key: 'is_gift_occasion', value: o.isGiftOccasion ? 'true' : 'false' },
      ...(o.tagline ? [{ key: 'tagline', value: o.tagline }] : []),
      { key: 'collection_url', value: collectionUrl },
      ...(collectionId && !collectionId.startsWith('dry-run')
        ? [{ key: 'collection', value: collectionId }]
        : []),
    ];

    const handle = o.slug;
    let entry = await client.getMetaobjectByHandle('occasion', handle);
    if (entry) {
      logger.info(`occasion ${handle}: exists`);
      if (!dryRun) await client.updateMetaobjectEntry(entry.id, fields);
    } else if (dryRun) {
      logger.info(`[dry-run] would create occasion ${handle}`);
      entry = { id: `dry-run-occasion-${handle}`, handle };
    } else {
      entry = await client.createMetaobjectEntry('occasion', handle, fields);
      if (!entry) throw new Error(`Failed to create occasion ${handle}`);
      logger.success(`occasion ${handle}: created`);
    }

    if (collectionId && entry && !collectionId.startsWith('dry-run') && !dryRun) {
      await client.setCollectionMetafield(collectionId, 'custom', 'occasion', entry.id, 'metaobject_reference');
      logger.success(`collection ${o.collectionHandle}: custom.occasion set`);
    }
  }

  let pagesOk = true;
  for (const p of PAGE_SEEDS) {
    try {
      if (dryRun) {
        logger.info(`[dry-run] would create page /pages/${p.handle} (template: ${p.templateSuffix})`);
        continue;
      }
      const page = await client.ensurePage({
        title: p.title,
        handle: p.handle,
        body: p.body,
        templateSuffix: p.templateSuffix,
        isPublished: true,
      });
      if (!page) throw new Error(`Failed to create page ${p.handle}`);
      try {
        await client.publishToOnlineStore(page.id);
      } catch {
        /* pages may already be visible on Online Store */
      }
      logger.success(`page /pages/${p.handle}: created (${p.templateSuffix} template)`);
    } catch (err) {
      pagesOk = false;
      logger.warn(
        `page ${p.handle}: skipped — ${err instanceof Error ? err.message : String(err)}. Add read_content/write_content to OAuth scopes and re-authorize, or create manually in Admin → Pages.`
      );
    }
  }

  logger.success('\nLaunch content seed complete.');
  if (!pagesOk) {
    logger.warn('Pages were not created via API — create feelings, occasions, gifts-hub in Admin → Pages (or re-run after OAuth with content scopes).');
  }
  logger.info('Publish new collections to Online Store in Admin if they are not visible on the storefront.');
  logger.info('Next: create master product, fill metafields, add products to collections, set horo_gift_wrap_product in theme settings.');
  logger.info('Verify: npm run verify:full\n');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
