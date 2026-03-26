import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTestModule } from './load-test-module.mjs';

const seo = await loadTestModule('test-seo-source-entry.ts');

test('route metadata marks indexable and noindex routes correctly', () => {
  const home = seo.resolveRouteMeta('/');
  const search = seo.resolveRouteMeta('/search');
  const checkout = seo.resolveRouteMeta('/checkout');
  const product = seo.resolveRouteMeta('/products/midnight-compass');
  const missing = seo.resolveRouteMeta('/missing-page');

  assert.equal(home.indexable, true);
  assert.equal(home.canonicalPath, '/');
  assert.equal(search.indexable, true);
  assert.equal(search.canonicalPath, '/search');
  assert.equal(checkout.indexable, false);
  assert.equal(product.ogType, 'product');
  assert.equal(missing.indexable, false);
  assert.equal(missing.canonicalPath, undefined);
});

test('sitemap and robots helpers only contain indexable public routes', () => {
  const paths = seo.getIndexablePublicPaths();
  const sitemap = seo.createSitemapXml('https://example.com');
  const robots = seo.createRobotsTxt('https://example.com');

  assert.ok(paths.includes('/search'));
  assert.match(sitemap, /\/vibes<\/loc>/);
  assert.match(sitemap, /\/products\/midnight-compass<\/loc>/);
  assert.match(sitemap, /\/search<\/loc>/);
  assert.doesNotMatch(sitemap, /\/cart<\/loc>/);
  assert.doesNotMatch(sitemap, /\/checkout<\/loc>/);
  assert.doesNotMatch(sitemap, /\/checkout\/success<\/loc>/);
  assert.match(robots, /https:\/\/example\.com\/sitemap\.xml/);
});

test('head artifacts include canonical, og tags, and breadcrumb schema from source helpers', () => {
  const homeArtifacts = seo.buildSeoHeadArtifacts('/');
  const productArtifacts = seo.buildSeoHeadArtifacts('/products/midnight-compass');
  const searchArtifacts = seo.buildSeoHeadArtifacts('/search');

  assert.equal(homeArtifacts.linkTags[0]?.href, 'https://example.com/');
  assert.equal(
    homeArtifacts.metaTags.find((tag) => tag.property === 'og:url')?.content,
    'https://example.com/',
  );
  assert.equal(
    homeArtifacts.metaTags.find((tag) => tag.property === 'og:image')?.content,
    'https://example.com/images/tees/emotions_vibe_1_1774374034307.png',
  );
  assert.equal(searchArtifacts.metaTags.some((tag) => tag.name === 'robots'), false);
  assert.equal(searchArtifacts.linkTags[0]?.href, 'https://example.com/search');
  assert.ok(productArtifacts.jsonLd.some((entry) => entry && entry['@type'] === 'BreadcrumbList'));
});
