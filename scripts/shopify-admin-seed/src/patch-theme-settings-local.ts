#!/usr/bin/env node
/**
 * Patch shopify-theme/config/settings_data.json with HORO launch settings (no read_themes API).
 * Run `shopify theme push` from shopify-theme/ after this.
 */
import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GIFT_WRAP_HANDLE, THEME_SETTINGS_PATCH } from './definitions/launch-catalog.js';
import { ensureAccessToken } from './utils/shopify-auth.js';
import { ShopifyAdminClient } from './shopify-admin.js';
import * as logger from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_PATH = path.resolve(__dirname, '../../../shopify-theme/config/settings_data.json');

async function main(): Promise<void> {
  const env = await ensureAccessToken();
  const client = new ShopifyAdminClient({ ...env, quiet: true });

  const patch: Record<string, string | boolean> = { ...THEME_SETTINGS_PATCH };
  const giftWrap = await client.getProductByHandle(GIFT_WRAP_HANDLE);
  if (giftWrap?.handle) {
    patch.horo_gift_wrap_product = giftWrap.handle;
  } else {
    logger.warn(`Product "${GIFT_WRAP_HANDLE}" not found — set horo_gift_wrap_product in Admin after push`);
  }

  if (!fs.existsSync(SETTINGS_PATH)) {
    throw new Error(`Missing ${SETTINGS_PATH}`);
  }

  const raw = fs.readFileSync(SETTINGS_PATH, 'utf8');
  const data = JSON.parse(raw) as {
    current: string;
    presets: Record<string, Record<string, unknown>>;
  };

  const presetName = data.current || 'Default';
  if (!data.presets[presetName]) data.presets[presetName] = {};
  const preset = data.presets[presetName];

  for (const [k, v] of Object.entries(patch)) {
    preset[k] = v;
  }

  fs.writeFileSync(SETTINGS_PATH, `${JSON.stringify(data, null, 2)}\n`);
  logger.success(`Updated presets.${presetName} in shopify-theme/config/settings_data.json`);
  logger.info(
    'Next: cd ../../shopify-theme && shopify theme check && shopify theme push --theme $SHOPIFY_THEME_ID --only config/settings_data.json'
  );
  logger.info('Set SHOPIFY_THEME_ID from `shopify theme list` (Dawn 15.4.1 + HORO). Omit --allow-live until Theme Check + manual QA pass.');
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
