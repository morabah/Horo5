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

export function extractFromJson(inputDir: string) {
  return {
    feelings: readJson<JsonFeelings>(inputDir, 'feelings.json'),
    subfeelings: readJson<JsonSubfeelings>(inputDir, 'subfeelings.json'),
    occasions: readJson<JsonOccasions>(inputDir, 'occasions.json'),
    artists: readJson<JsonArtists>(inputDir, 'artists.json'),
    sizeTables: readJson<JsonSizeTables>(inputDir, 'size-tables.json'),
    products: readJson<JsonProducts>(inputDir, 'products.json'),
    collections: readJson<JsonCollections>(inputDir, 'collections.json'),
  };
}
