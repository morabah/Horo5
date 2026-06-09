#!/usr/bin/env node
/**
 * HORO Shopify theme settings parity guard.
 * Ensures global Liquid `settings.*` references are declared in
 * config/settings_schema.json, and verifies the custom HORO settings are wired
 * into the rendering surfaces they are meant to control.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(themeRoot, relativePath), 'utf8');
}

function walk(dir, extensions, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, extensions, files);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  return files;
}

function schemaSettingIds(schema) {
  const ids = new Set();
  for (const group of schema) {
    for (const setting of group.settings || []) {
      if (setting.id) ids.add(setting.id);
    }
  }
  return ids;
}

function currentSettingsDataIds(settingsData) {
  const current = settingsData.presets?.[settingsData.current] || settingsData.current || {};
  return new Set(Object.keys(current).filter((key) => key !== 'sections' && key !== 'color_schemes'));
}

const failures = [];
const schema = JSON.parse(read('config/settings_schema.json'));
const settingsData = JSON.parse(read('config/settings_data.json'));
const schemaIds = schemaSettingIds(schema);
const dataIds = currentSettingsDataIds(settingsData);

for (const id of dataIds) {
  if (!schemaIds.has(id)) {
    failures.push(`settings_data.json contains "${id}", but settings_schema.json does not declare it.`);
  }
}

const liquidFiles = [
  ...walk(path.join(themeRoot, 'layout'), ['.liquid']),
  ...walk(path.join(themeRoot, 'sections'), ['.liquid']),
  ...walk(path.join(themeRoot, 'snippets'), ['.liquid']),
];

const globalSettingRefs = new Map();
const settingsRefPattern = /(?<![A-Za-z0-9_.])settings\.([A-Za-z_][A-Za-z0-9_]*)/g;

for (const file of liquidFiles) {
  const relativeFile = path.relative(themeRoot, file);
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(settingsRefPattern)) {
    const id = match[1];
    if (!globalSettingRefs.has(id)) globalSettingRefs.set(id, new Set());
    globalSettingRefs.get(id).add(relativeFile);
  }
}

for (const [id, files] of globalSettingRefs) {
  if (!schemaIds.has(id)) {
    failures.push(`settings.${id} is referenced in ${[...files].join(', ')}, but it is missing from settings_schema.json.`);
  }
}

function assertIncludes(label, relativePath, needle) {
  const content = read(relativePath);
  if (!content.includes(needle)) {
    failures.push(`${label}: expected ${relativePath} to include "${needle}".`);
  }
}

const themeLayout = 'layout/theme.liquid';
const brandSettings = [
  'horo_color_papyrus',
  'horo_color_obsidian',
  'horo_color_warm_charcoal',
  'horo_color_burgundy',
  'horo_color_ember',
  'horo_color_desert_sand',
  'horo_color_kohl_gold',
  'horo_color_stone',
  'horo_color_clay_earth',
  'horo_color_dusk_violet',
  'horo_color_kohl_gold_bright',
  'horo_heading_font',
  'horo_body_font',
];

for (const id of brandSettings) {
  assertIncludes(`HORO brand setting ${id}`, themeLayout, `settings.${id}`);
}

assertIncludes('Global logo image', 'snippets/horo-brand-logo.liquid', 'settings.logo');
assertIncludes('Global logo width', 'snippets/horo-brand-logo.liquid', 'settings.logo_width');
assertIncludes('Global trust labels', 'sections/product-trust-strip.liquid', "assign global_label_key = 'horo_trust_badge_' | append: i");
assertIncludes('Delivery Cairo setting', 'snippets/horo-cart-reassurance.liquid', 'settings.horo_delivery_cairo');
assertIncludes('Delivery Alexandria setting', 'snippets/horo-cart-reassurance.liquid', 'settings.horo_delivery_alex');
assertIncludes('Delivery other setting', 'snippets/horo-cart-reassurance.liquid', 'settings.horo_delivery_other');
assertIncludes('Instapay instructions setting', 'snippets/horo-cart-reassurance.liquid', 'settings.horo_instapay_instructions');
assertIncludes('WhatsApp float setting', 'snippets/horo-whatsapp-float.liquid', 'settings.horo_whatsapp_support_url');
assertIncludes('Shipping Cairo setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_shipping_cairo_egp');
assertIncludes('Shipping Alexandria setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_shipping_alex_egp');
assertIncludes('Shipping other setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_shipping_other_egp');
assertIncludes('Shipping estimate note setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_shipping_estimate_note');
assertIncludes('Free shipping threshold setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_free_shipping_threshold_egp');
assertIncludes('Gift wrap product setting', 'snippets/horo-cart-drawer-extras.liquid', 'settings.horo_gift_wrap_product');
assertIncludes('Gift wrap label setting', 'snippets/horo-cart-drawer-extras.liquid', 'settings.horo_gift_wrap_label');
assertIncludes('Gift wrap price hint setting', 'snippets/horo-cart-drawer-extras.liquid', 'settings.horo_gift_wrap_price_hint');
assertIncludes('Launch countdown visibility setting', 'sections/horo-launch-countdown.liquid', 'settings.horo_show_launch_countdown');
assertIncludes('Order hint visibility setting', themeLayout, 'settings.horo_show_order_placed_hint');
assertIncludes('Global drawer menu setting', 'sections/horo-header.liquid', 'settings.horo_drawer_menu');
assertIncludes('Locale toggle mode setting', 'snippets/horo-locale-toggle.liquid', 'settings.horo_locale_toggle_mode');
assertIncludes('Cart incentives setting', 'snippets/horo-cart-cost-preview.liquid', 'settings.horo_incentives_live');
assertIncludes('Wishlist API base setting', themeLayout, 'settings.horo_storefront_api_base');
assertIncludes('Wishlist API path setting', themeLayout, 'settings.horo_wishlist_api_path');
assertIncludes('PostHog key setting', 'snippets/horo-posthog.liquid', 'settings.horo_posthog_key');
assertIncludes('PostHog host setting', 'snippets/horo-posthog.liquid', 'settings.horo_posthog_api_host');

if (failures.length > 0) {
  console.error(`Theme settings parity failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Theme settings parity OK - ${globalSettingRefs.size} global settings references verified.`);
