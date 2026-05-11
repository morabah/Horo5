#!/usr/bin/env node
/**
 * HORO Shopify / Medusa parity guard.
 * Validates the launch-mode Shopify theme coverage and the documented Medusa
 * DTO-to-Shopify metafield handoff for code-owned storefront UX.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.join(__dirname, '..');
const repoRoot = path.resolve(themeRoot, '..');
const templatesDir = path.join(themeRoot, 'templates');

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function maybeReadText(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

function readTemplate(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(themeRoot, relativePath), 'utf8'));
}

function sectionTypes(template) {
  return (template.order || []).map((id) => template.sections?.[id]?.type).filter(Boolean);
}

function fail(message) {
  failures.push(message);
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(themeRoot, relativePath))) {
    fail(`Missing ${relativePath}`);
  }
}

function assertTypesEqual(label, actual, expected) {
  const actualText = actual.join(' > ');
  const expectedText = expected.join(' > ');
  if (actualText !== expectedText) {
    fail(`${label} order mismatch. Expected ${expectedText}; got ${actualText}`);
  }
}

function assertTypesInclude(label, actual, expected) {
  for (const type of expected) {
    if (!actual.includes(type)) {
      fail(`${label} is missing section type ${type}`);
    }
  }
}

function assertSubsequence(label, actual, expected) {
  let cursor = 0;
  for (const type of actual) {
    if (type === expected[cursor]) cursor += 1;
  }
  if (cursor !== expected.length) {
    fail(`${label} does not preserve expected sequence ${expected.join(' > ')}`);
  }
}

function assertTextIncludes(label, text, needles) {
  for (const needle of needles) {
    if (!text.includes(needle)) {
      fail(`${label} is missing "${needle}"`);
    }
  }
}

const failures = [];

const indexTypes = sectionTypes(readTemplate('templates/index.json'));
assertTypesEqual('Home template', indexTypes, [
  'home-hero',
  'horo-trust-ribbon',
  'home-founding-drop',
  'horo-feeling-quiz',
  'home-feeling-grid',
  'home-drop-strip',
  'rich-text',
]);

const productTypes = sectionTypes(readTemplate('templates/product.json'));
assertSubsequence('Product template', productTypes, [
  'horo-breadcrumb',
  'horo-launch-countdown',
  'horo-product-data',
  'main-product',
  'product-purchase-context',
  'product-trust-strip',
  'product-proof-strip',
  'product-details-accordions',
  'product-story',
  'horo-seen-on-you',
  'product-artist-card',
  'product-size-guide',
  'product-delivery-payment',
  'product-pair-with',
  'horo-recently-viewed',
  'related-products',
  'horo-cross-sell',
  'horo-trust-ribbon',
  'horo-share-your-fit',
]);

const cartTypes = sectionTypes(readTemplate('templates/cart.json'));
assertSubsequence('Cart template', cartTypes, [
  'horo-breadcrumb',
  'main-cart-items',
  'main-cart-footer',
  'cart-trust-explainer',
  'cart-free-shipping-progress',
  'cart-bundle-nudge',
  'cart-savings-summary',
  'cart-gift-wrap-upsell',
  'horo-trust-ribbon',
]);

const searchTypes = sectionTypes(readTemplate('templates/search.json'));
assertTypesEqual('Search template', searchTypes, [
  'horo-search-recovery',
  'main-search',
  'search-support-links',
]);

const collectionTypes = sectionTypes(readTemplate('templates/collection.json'));
assertTypesInclude('Collection template', collectionTypes, [
  'collection-feeling-hero',
  'collection-occasion-hero',
  'collection-subfeeling-nav',
  'collection-editorial-proof',
  'main-collection-product-grid',
  'collection-related-routes',
]);

const requiredPageTemplates = [
  'templates/page.about-horo.json',
  'templates/page.feelings-hub.json',
  'templates/page.occasions-hub.json',
  'templates/page.gifts-hub.json',
  'templates/page.wishlist.json',
  'templates/page.faq-horo.json',
  'templates/page.size-guide.json',
  'templates/page.exchange-policy-horo.json',
  'templates/404.json',
];
requiredPageTemplates.forEach(assertFile);

const customerHeroTemplates = [
  'templates/customers/account.json',
  'templates/customers/login.json',
  'templates/customers/register.json',
  'templates/customers/reset_password.json',
  'templates/customers/activate_account.json',
  'templates/customers/addresses.json',
];

for (const templatePath of customerHeroTemplates) {
  const types = sectionTypes(readTemplate(templatePath));
  if (!types.includes('horo-account-hero')) {
    fail(`${templatePath} is missing horo-account-hero`);
  }
}

const orderTypes = sectionTypes(readTemplate('templates/customers/order.json'));
if (!orderTypes.includes('horo-order-surface')) {
  fail('templates/customers/order.json is missing horo-order-surface');
}

const themeMetafieldSources = [
  'shopify-theme/layout/theme.liquid',
  'shopify-theme/snippets/horo-breadcrumb.liquid',
  'shopify-theme/snippets/horo-footer-mantra.liquid',
  'shopify-theme/snippets/horo-search-recovery.liquid',
  'shopify-theme/snippets/horo-jsonld-product.liquid',
  'shopify-theme/sections/horo-product-data.liquid',
  'shopify-theme/sections/product-artist-card.liquid',
  'shopify-theme/sections/product-details-accordions.liquid',
  'shopify-theme/sections/product-promo-countdown.liquid',
  'shopify-theme/sections/product-proof-strip.liquid',
  'shopify-theme/sections/product-purchase-context.liquid',
  'shopify-theme/sections/product-size-guide.liquid',
  'shopify-theme/sections/product-story.liquid',
  'shopify-theme/sections/product-pair-with.liquid',
  'shopify-theme/sections/horo-cross-sell.liquid',
  'shopify-theme/sections/horo-seen-on-you.liquid',
].map(readText).join('\n');

assertTextIncludes('Shopify theme metafield reads', themeMetafieldSources, [
  'custom.fit_note',
  'custom.fit_label',
  'custom.size_fit_note',
  'custom.trust_chips',
  'custom.features',
  'custom.low_stock_message',
  'custom.size_table',
  'custom.pair_with_products',
  'custom.promo_starts_at',
  'custom.promo_show_countdown',
  'custom.artist',
  'custom.feeling',
  'custom.subfeeling',
  'custom.occasions',
  'custom.horo_ugc',
  'custom.launch_phase',
  'custom.brand_mantra',
  'custom.popular_searches',
]);

const docs = maybeReadText('shopify-theme/docs/metafield-definitions.md');
if (docs) {
  assertTextIncludes('Metafield definitions', docs, [
    'fitLabel',
    'trustBadges',
    'promoStartsAt',
    'promoShowCountdown',
    'stockNote',
    'sizeTableKey',
    'complementarySlugs',
    'frequentlyBoughtWithSlugs',
    'customersAlsoBoughtSlugs',
    'feelsLike',
    'worksFor',
    'garmentColors',
    'media.gallery',
    'custom.fit_note',
    'custom.trust_chips',
    'custom.launch_phase',
  ]);
}

const medusaTypes = readText('medusa-backend/src/lib/storefront/types.ts');
assertTextIncludes('Medusa storefront DTO', medusaTypes, [
  'fitLabel',
  'trustBadges',
  'promoStartsAt',
  'promoShowCountdown',
  'stockNote',
  'sizeTableKey',
  'complementarySlugs',
  'frequentlyBoughtWithSlugs',
  'customersAlsoBoughtSlugs',
  'feelsLike',
  'worksFor',
  'garmentColors',
  'wearerStories',
  'artistStorySlides',
]);

const webNextTypes = readText('web-next/src/storefront/data/catalog-types.ts');
assertTextIncludes('web-next catalog DTO', webNextTypes, [
  'fitLabel',
  'trustBadges',
  'promoStartsAt',
  'promoShowCountdown',
  'stockNote',
  'sizeTableKey',
  'complementarySlugs',
  'frequentlyBoughtWithSlugs',
  'customersAlsoBoughtSlugs',
  'feelsLike',
  'worksFor',
  'garmentColors',
  'wearerStories',
  'artistStorySlides',
]);

const layout = readText('shopify-theme/layout/theme.liquid');
assertTextIncludes('Theme layout launch phase fallback', layout, [
  'shop.metafields.custom.launch_phase.value',
  'shop.metafields.horo.launch_phase.value',
]);

const productTemplate = readTemplate('templates/product.json');
if (productTemplate.sections.main?.type !== 'main-product') {
  fail('Product template must preserve Dawn main-product as the purchase form surface');
}

const protectedFiles = [
  'sections/main-product.liquid',
  'sections/main-cart-items.liquid',
  'sections/main-cart-footer.liquid',
  'snippets/card-product.liquid',
  'snippets/price.liquid',
  'snippets/product-variant-picker.liquid',
  'snippets/product-media-gallery.liquid',
  'snippets/facets.liquid',
];

for (const file of protectedFiles) {
  assertFile(file);
}

if (failures.length > 0) {
  console.error(`Medusa/Shopify parity check failed with ${failures.length} issue(s):`);
  for (const message of failures) {
    console.error(`- ${message}`);
  }
  process.exit(1);
}

const templateCount = fs.readdirSync(templatesDir).filter((file) => file.endsWith('.json')).length;
console.log(`Medusa/Shopify parity OK - ${templateCount} JSON templates plus customer/account coverage verified.`);
