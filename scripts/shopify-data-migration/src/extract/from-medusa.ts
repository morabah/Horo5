/**
 * Extract data from Medusa backend via Storefront API.
 * Fetches the full catalog and individual product details.
 * Skips gracefully if credentials are not present.
 */

import * as logger from '../utils/logger.js';

interface MedusaConfig {
  backendUrl?: string;
  adminApiToken?: string;
  databaseUrl?: string;
}

interface MedusaCatalog {
  feelings: Array<Record<string, unknown>>;
  subfeelings: Array<Record<string, unknown>>;
  occasions: Array<Record<string, unknown>>;
  artists: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
  events?: Array<Record<string, unknown>>;
}

async function fetchMedusaCatalog(backendUrl: string, adminToken?: string): Promise<MedusaCatalog | null> {
  const url = `${backendUrl.replace(/\/$/, '')}/storefront/catalog`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminToken) {
    headers['x-publishable-api-key'] = adminToken;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    logger.warn(`Medusa catalog fetch failed: HTTP ${response.status} — ${text.slice(0, 200)}`);
    return null;
  }

  const json = (await response.json()) as MedusaCatalog | { catalog?: MedusaCatalog };
  // The Medusa endpoint returns { catalog?: ... } or the catalog directly
  const catalog = 'catalog' in json && json.catalog ? json.catalog : (json as MedusaCatalog);
  return catalog;
}

async function fetchMedusaProduct(backendUrl: string, handle: string, adminToken?: string): Promise<Record<string, unknown> | null> {
  const url = `${backendUrl.replace(/\/$/, '')}/storefront/products/${encodeURIComponent(handle)}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminToken) {
    headers['x-publishable-api-key'] = adminToken;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    logger.warn(`Medusa product fetch failed for "${handle}": HTTP ${response.status}`);
    return null;
  }

  const json = (await response.json()) as Record<string, unknown>;
  const product = json.product as Record<string, unknown> | undefined;
  return product ?? json;
}

export async function extractFromMedusa(config: MedusaConfig) {
  if (!config.backendUrl) {
    logger.info('No Medusa backend URL provided. Skipping Medusa extraction.');
    return null;
  }

  logger.info('Attempting Medusa extraction...');
  logger.info(`Backend: ${config.backendUrl}`);

  const catalog = await fetchMedusaCatalog(config.backendUrl, config.adminApiToken);
  if (!catalog) {
    logger.warn('Medusa catalog fetch returned no data. Provide JSON input files as fallback.');
    return null;
  }

  logger.success(`Fetched Medusa catalog: ${catalog.feelings?.length ?? 0} feelings, ${catalog.products?.length ?? 0} products`);

  // Enrich each product with full PDP data (variants, media, story, etc.)
  const enrichedProducts: Array<Record<string, unknown>> = [];
  if (catalog.products && Array.isArray(catalog.products)) {
    for (const product of catalog.products) {
      const slug = product.slug || product.handle;
      if (typeof slug === 'string') {
        const detail = await fetchMedusaProduct(config.backendUrl, slug, config.adminApiToken);
        if (detail) {
          enrichedProducts.push({ ...product, ...detail });
          continue;
        }
      }
      enrichedProducts.push(product);
    }
  }

  logger.success(`Enriched ${enrichedProducts.length} products from Medusa`);

  return {
    feelings: catalog.feelings ?? [],
    subfeelings: catalog.subfeelings ?? [],
    occasions: catalog.occasions ?? [],
    artists: catalog.artists ?? [],
    sizeTables: [], // Size tables are store-level; handled via web-next defaults or manual JSON
    products: enrichedProducts,
    collections: [], // Collections are derived from tags in Shopify
  };
}
