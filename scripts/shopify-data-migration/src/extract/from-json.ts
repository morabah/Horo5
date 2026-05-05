/**
 * Extract data from local JSON files in the input directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as logger from '../utils/logger.js';

function readJson<T>(dir: string, filename: string): T[] {
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) {
    logger.warn(`Input file not found: ${filePath}`);
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to parse ${filePath}: ${message}`);
    return [];
  }
}

export interface JsonFeelings {
  title: string;
  handle?: string;
  description?: string;
  tagline?: string;
  accent_color?: string;
  hero_image?: string;
  card_image?: string;
  manifesto?: string;
  sort_order?: number;
  active?: boolean;
}

export interface JsonSubfeelings {
  title: string;
  handle?: string;
  parent_feeling: string;
  description?: string;
  hero_image?: string;
  card_image?: string;
  sort_order?: number;
  active?: boolean;
}

export interface JsonOccasions {
  title: string;
  handle?: string;
  description?: string;
  accent_color?: string;
  hero_image?: string;
  card_image?: string;
  is_gift_occasion?: boolean;
  price_hint?: string;
  sort_order?: number;
  active?: boolean;
}

export interface JsonArtists {
  name: string;
  slug?: string;
  style?: string;
  bio?: string;
  avatar?: string;
  portfolio_url?: string;
  design_count?: number;
  active?: boolean;
}

export interface JsonSizeTables {
  name: string;
  handle?: string;
  unit_system?: string;
  rows: Array<Record<string, string>>;
  note?: string;
}

export interface JsonProducts {
  title: string;
  handle: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  feeling?: string;
  subfeeling?: string;
  occasions?: string[];
  artist?: string;
  size_table?: string;
  pair_with_products?: string[];
  images?: string[];
  active?: boolean;
}

export interface JsonCollections {
  title: string;
  handle: string;
  description?: string;
  feeling?: string;
  occasion?: string;
  product_handles?: string[];
  active?: boolean;
}

const LEGACY_PRODUCT_FIELDS = [
  'feeling_slug',
  'artist_slug',
  'subfeeling_slug',
  'occasion_slugs',
  'size_table_key',
  'fit_label',
  'related_products',
  'frequently_bought_with',
  'customers_also_bought',
  'complementary_slugs',
  'promo_show_countdown',
  'hero_image',
  'card_image',
  'proof_image',
];

function detectLegacyFields(products: JsonProducts[]): string[] {
  const warnings: string[] = [];
  for (const product of products) {
    const keys = Object.keys(product);
    for (const legacy of LEGACY_PRODUCT_FIELDS) {
      if (keys.includes(legacy)) {
        warnings.push(`Product "${product.handle}" contains legacy field "${legacy}" — map to canonical field or remove`);
      }
    }
  }
  return warnings;
}

export function extractFromJson(inputDir: string) {
  const products = readJson<JsonProducts>(inputDir, 'products.json');
  const legacyWarnings = detectLegacyFields(products);
  if (legacyWarnings.length > 0) {
    legacyWarnings.forEach((w) => logger.warn(w));
  }

  return {
    feelings: readJson<JsonFeelings>(inputDir, 'feelings.json'),
    subfeelings: readJson<JsonSubfeelings>(inputDir, 'subfeelings.json'),
    occasions: readJson<JsonOccasions>(inputDir, 'occasions.json'),
    artists: readJson<JsonArtists>(inputDir, 'artists.json'),
    sizeTables: readJson<JsonSizeTables>(inputDir, 'size-tables.json'),
    products,
    collections: readJson<JsonCollections>(inputDir, 'collections.json'),
  };
}
