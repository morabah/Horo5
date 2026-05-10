/**
 * HORO Analytics Enhancement
 * - view_item with variant details on PDP load
 * - select_item on variant change
 * - Wishlist add/remove events (integrated with horo-wishlist.js)
 * - Enhanced product interactions
 */

(function () {
  'use strict';

  function pushEvent(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...payload,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  /* --- PDP: view_item on load --- */
  function trackPDPView() {
    const productData = window.HoroCurrentProductData || null;
    if (!productData) return;

    pushEvent('horo_view_item', {
      ecommerce: {
        items: [
          {
            item_id: productData.id,
            item_name: productData.title,
            item_variant: productData.variant_title || 'Default',
            price: productData.price,
            currency: productData.currency || 'EGP',
            item_brand: productData.vendor || 'HORO',
          },
        ],
      },
    });
  }

  /* --- Variant change: select_item --- */
  function trackVariantChange(variant) {
    if (!variant) return;
    pushEvent('horo_select_item', {
      ecommerce: {
        items: [
          {
            item_id: variant.id,
            item_name: variant.name,
            item_variant: variant.title,
            price: variant.price,
          },
        ],
      },
    });
  }

  /* --- Add to cart --- */
  function trackAddToCart(variant, quantity) {
    if (!variant) return;
    const productData = window.HoroCurrentProductData || {};
    pushEvent('horo_add_to_cart', {
      ecommerce: {
        items: [
          {
            item_id: variant.id,
            item_name: variant.name,
            item_variant: variant.title,
            price: variant.price,
            quantity: quantity || 1,
            currency: productData.currency || 'EGP',
          },
        ],
      },
    });
  }

  /* --- Listen for Shopify variant change events --- */
  document.addEventListener('DOMContentLoaded', () => {
    // PDP view
    trackPDPView();

    // Variant changes: listen for common Shopify patterns
    document.addEventListener('variant:change', (e) => {
      if (e.detail && e.detail.variant) {
        trackVariantChange(e.detail.variant);
      }
    });

    // Add to cart: listen for cart updates
    document.addEventListener('cart:updated', (e) => {
      if (e.detail && e.detail.variant) {
        trackAddToCart(e.detail.variant, e.detail.quantity);
      }
    });
  });

  // Expose for other scripts
  window.HoroAnalytics = {
    pushEvent,
    trackVariantChange,
    trackAddToCart,
  };
})();
