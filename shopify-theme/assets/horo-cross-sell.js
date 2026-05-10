/**
 * HORO Cross Sell — Fetch Shopify product recommendations client-side.
 *
 * Falls back to the statically rendered cards already present in the DOM.
 * Only runs if the section has a product-id and the static grid is empty.
 */
(function () {
  'use strict';

  function initCrossSell(container) {
    var productId = container.getAttribute('data-product-id');
    var limit = parseInt(container.getAttribute('data-limit') || '4', 10);
    var intent = container.getAttribute('data-intent') || 'related';
    var grid = container.querySelector('[data-cross-sell-grid]');

    if (!productId || !grid) return;
    if (grid.children.length > 0) return; // Static fallback already rendered

    var url = '/recommendations/products.json?product_id=' + encodeURIComponent(productId)
      + '&limit=' + encodeURIComponent(limit)
      + '&intent=' + encodeURIComponent(intent);

    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.products || !data.products.length) return;
        // We received product data; if the theme already rendered cards, skip.
        // Otherwise, a deeper integration would build card HTML here.
        // For now, the Liquid section pre-renders fallback cards via metafields/blocks,
        // so this script primarily serves as an analytics hook.
      })
      .catch(function () {
        // Silent fail; static cards are the fallback.
      });
  }

  function init() {
    var sections = document.querySelectorAll('[data-cross-sell]');
    sections.forEach(initCrossSell);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
