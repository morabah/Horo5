/**
 * HORO Analytics — GA4 + Meta Pixel + PostHog + dataLayer parity with web-next
 * Events: view_item, view_item_list, select_item, add_to_cart,
 *         remove_from_cart, begin_checkout, search,
 *         wishlist_add, wishlist_remove,
 *         commerce_size_selected, commerce_cart_viewed,
 *         commerce_checkout_submitted, commerce_payment_method_selected,
 *         commerce_order_completed, search_zero_results
 */
(function () {
  'use strict';

  var RECENT_WINDOW_MS = 1200;
  var recentEvents = {};

  function shouldSuppress(name, key) {
    var eventKey = name + ':' + key;
    var now = Date.now();
    var lastSeen = recentEvents[eventKey];
    recentEvents[eventKey] = now;
    // GC old entries
    for (var k in recentEvents) {
      if (now - recentEvents[k] > RECENT_WINDOW_MS * 4) delete recentEvents[k];
    }
    return lastSeen != null && (now - lastSeen < RECENT_WINDOW_MS);
  }

  function pushDataLayer(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ecommerce: payload,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  function emitGA4(eventName, payload) {
    if (window.gtag) {
      window.gtag('event', eventName, payload);
    }
  }

  function emitPixel(eventName, payload) {
    if (window.fbq) {
      window.fbq('track', eventName, payload);
    }
  }

  function emitPostHog(eventName, payload) {
    if (window.posthog && window.posthog.capture) {
      window.posthog.capture(eventName, payload);
    }
  }

  function buildItem(productData, variant, qty) {
    if (!productData) return null;
    return {
      item_id: String(productData.id || productData.handle || ''),
      item_name: productData.title || '',
      item_brand: productData.vendor || 'HORO Egypt',
      item_variant: (variant && variant.title) || productData.variant_title || 'Default',
      price: (variant && variant.price ? variant.price / 100.0 : productData.price) || 0,
      quantity: qty || 1,
      currency: productData.currency || 'EGP',
      item_category: productData.category || productData.feeling || '',
      item_category2: productData.occasion || '',
    };
  }

  /* --- view_item --- */
  function trackViewItem() {
    var pd = window.HoroCurrentProductData;
    if (!pd) return;
    if (shouldSuppress('view_item', pd.handle)) return;
    var item = buildItem(pd, null, 1);
    var payload = {
      currency: item.currency,
      value: item.price,
      items: [item],
    };
    pushDataLayer('view_item', payload);
    emitGA4('view_item', payload);
    emitPixel('ViewContent', {
      content_ids: [pd.handle],
      content_type: 'product',
      value: item.price,
      currency: item.currency,
    });
    emitPostHog('commerce_product_viewed', {
      ...payload,
      product_slug: pd.handle,
      product_name: pd.title,
    });
  }

  /* --- select_item (variant change) --- */
  function trackSelectItem(variant) {
    var pd = window.HoroCurrentProductData;
    if (!pd || !variant) return;
    var item = buildItem(pd, variant, 1);
    var payload = {
      currency: item.currency,
      value: item.price,
      items: [item],
    };
    pushDataLayer('select_item', payload);
    emitGA4('select_item', payload);
  }

  /* --- add_to_cart --- */
  function trackAddToCart(variant, qty) {
    var pd = window.HoroCurrentProductData;
    if (!pd) return;
    var q = qty || 1;
    var item = buildItem(pd, variant, q);
    var payload = {
      currency: item.currency,
      value: item.price * q,
      items: [item],
    };
    pushDataLayer('add_to_cart', payload);
    emitGA4('add_to_cart', payload);
    emitPixel('AddToCart', {
      content_ids: [pd.handle],
      content_type: 'product',
      value: item.price * q,
      currency: item.currency,
    });
    emitPostHog('commerce_add_to_cart', {
      ...payload,
      product_slug: pd.handle,
      product_name: pd.title,
      size: variant && variant.title,
      quantity: q,
    });
  }

  /* --- remove_from_cart --- */
  function trackRemoveFromCart(variant, qty) {
    var pd = window.HoroCurrentProductData;
    if (!pd) return;
    var q = qty || 1;
    var item = buildItem(pd, variant, q);
    var payload = {
      currency: item.currency,
      value: item.price * q,
      items: [item],
    };
    pushDataLayer('remove_from_cart', payload);
    emitGA4('remove_from_cart', payload);
  }

  /* --- begin_checkout --- */
  function trackBeginCheckout() {
    if (typeof window.HoroCartSnapshot !== 'object') return;
    var snap = window.HoroCartSnapshot;
    var items = (snap.items || []).map(function (it) {
      return {
        item_id: String(it.variant_id || ''),
        item_name: it.product_title || '',
        item_variant: it.variant_title || '',
        price: (it.final_line_price || 0) / 100.0,
        quantity: it.quantity || 1,
        currency: snap.currency || 'EGP',
        item_brand: it.vendor || 'HORO Egypt',
      };
    });
    if (items.length === 0) return;
    var total = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
    var payload = { currency: items[0].currency, value: total, items: items };
    pushDataLayer('begin_checkout', payload);
    emitGA4('begin_checkout', payload);
    emitPixel('InitiateCheckout', {
      value: total,
      currency: items[0].currency,
      content_ids: items.map(function (it) { return it.item_id; }),
      num_items: items.reduce(function (s, it) { return s + it.quantity; }, 0),
    });
    emitPostHog('commerce_checkout_started', payload);
  }

  /* --- size_selected --- */
  function trackSizeSelected(size, source) {
    var pd = window.HoroCurrentProductData;
    if (!pd || !size) return;
    var payload = {
      currency: pd.currency || 'EGP',
      value: pd.price || 0,
      source: source || 'pdp',
      product_slug: pd.handle,
      product_name: pd.title,
      size: size,
    };
    emitPostHog('commerce_size_selected', payload);
  }

  /* --- view_cart --- */
  function trackCartViewed() {
    if (typeof window.HoroCartSnapshot !== 'object') return;
    var snap = window.HoroCartSnapshot;
    var items = (snap.items || []).map(function (it) {
      return {
        item_id: String(it.variant_id || ''),
        item_name: it.product_title || '',
        item_variant: it.variant_title || '',
        price: (it.final_line_price || 0) / 100.0,
        quantity: it.quantity || 1,
        currency: snap.currency || 'EGP',
        item_brand: it.vendor || 'HORO Egypt',
      };
    });
    if (items.length === 0) return;
    var total = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
    var payload = { currency: items[0].currency, value: total, items: items };
    emitPostHog('commerce_cart_viewed', payload);
  }

  /* --- checkout_submitted --- */
  function trackCheckoutSubmitted(paymentMethodKind, shippingEgp) {
    if (typeof window.HoroCartSnapshot !== 'object') return;
    var snap = window.HoroCartSnapshot;
    var items = (snap.items || []).map(function (it) {
      return {
        item_id: String(it.variant_id || ''),
        item_name: it.product_title || '',
        item_variant: it.variant_title || '',
        price: (it.final_line_price || 0) / 100.0,
        quantity: it.quantity || 1,
        currency: snap.currency || 'EGP',
        item_brand: it.vendor || 'HORO Egypt',
      };
    });
    if (items.length === 0) return;
    var total = items.reduce(function (s, it) { return s + it.price * it.quantity; }, 0);
    var payload = { currency: items[0].currency, value: total, items: items };
    if (paymentMethodKind) payload.payment_method_kind = paymentMethodKind;
    if (typeof shippingEgp === 'number') payload.shipping = shippingEgp;
    emitPostHog('commerce_checkout_submitted', payload);
  }

  /* --- payment_method_selected --- */
  function trackPaymentMethodSelected(paymentMethodKind, paymentMethodProviderId, source) {
    emitPostHog('commerce_payment_method_selected', {
      payment_method_kind: paymentMethodKind,
      payment_method_provider_id: paymentMethodProviderId || '',
      source: source || 'checkout',
    });
  }

  /* --- purchase --- */
  function trackPurchase(transactionId, value, currency) {
    if (typeof window.HoroCartSnapshot !== 'object') return;
    var snap = window.HoroCartSnapshot;
    var items = (snap.items || []).map(function (it) {
      return {
        item_id: String(it.variant_id || ''),
        item_name: it.product_title || '',
        item_variant: it.variant_title || '',
        price: (it.final_line_price || 0) / 100.0,
        quantity: it.quantity || 1,
        currency: snap.currency || 'EGP',
        item_brand: it.vendor || 'HORO Egypt',
      };
    });
    if (items.length === 0) return;
    var lineCount = items.length;
    var itemCount = items.reduce(function (s, it) { return s + it.quantity; }, 0);
    var payload = { transaction_id: transactionId, value: value, currency: currency || 'EGP', items: items };
    pushDataLayer('purchase', payload);
    emitGA4('purchase', payload);
    emitPixel('Purchase', {
      value: value,
      currency: currency || 'EGP',
      content_ids: items.map(function (it) { return it.item_id; }),
    });
    emitPostHog('commerce_order_completed', {
      ...payload,
      item_count: itemCount,
      line_count: lineCount,
    });
  }

  /* --- search_zero_results --- */
  function trackSearchZeroResults(searchTerm, filters) {
    var payload = {
      search_term: searchTerm || '',
      sort: (filters && filters.sort) || '',
      price: (filters && filters.price) || '',
      vibe_filter: (filters && filters.vibe_filter) || '',
      size: (filters && filters.size) || '',
      filter_artist: (filters && filters.filter_artist) || '',
      filter_occasion: (filters && filters.filter_occasion) || '',
      filter_color: (filters && filters.filter_color) || '',
    };
    emitPostHog('search_zero_results', payload);
  }

  /* --- search --- */
  function trackSearch(term) {
    if (!term) return;
    var payload = { search_term: term };
    pushDataLayer('search', payload);
    emitGA4('search', payload);
  }

  /* --- wishlist --- */
  function trackWishlistAdd(productHandle) {
    var pd = window.HoroCurrentProductData;
    if (!pd) return;
    var item = buildItem(pd, null, 1);
    var payload = { currency: item.currency, value: item.price, items: [item] };
    pushDataLayer('wishlist_add', payload);
    emitGA4('add_to_wishlist', payload);
    emitPostHog('commerce_wishlist_add', {
      ...payload,
      product_slug: pd.handle,
      product_name: pd.title,
    });
  }

  function trackWishlistRemove(productHandle) {
    var pd = window.HoroCurrentProductData;
    if (!pd) return;
    var item = buildItem(pd, null, 1);
    var payload = { currency: item.currency, value: item.price, items: [item] };
    pushDataLayer('wishlist_remove', payload);
    emitPostHog('commerce_wishlist_remove', {
      ...payload,
      product_slug: pd.handle,
      product_name: pd.title,
    });
  }

  /* --- view_item_list (collection) --- */
  function trackViewItemList(listName) {
    var items = [];
    if (typeof window.HoroCollectionItems === 'object' && Array.isArray(window.HoroCollectionItems)) {
      items = window.HoroCollectionItems.map(function (p, i) {
        return {
          item_id: String(p.id || ''),
          item_name: p.title || '',
          price: p.price || 0,
          item_brand: p.vendor || 'HORO Egypt',
          item_category: p.feeling || '',
          index: i,
        };
      });
    }
    if (items.length === 0) return;
    var payload = { item_list_name: listName || 'Collection', items: items };
    pushDataLayer('view_item_list', payload);
    emitGA4('view_item_list', payload);
  }

  /* --- Init --- */
  function init() {
    // PDP
    if (document.body.dataset.template === 'product' || window.HoroCurrentProductData) {
      trackViewItem();
    }

    // Variant changes (Shopify Dawn custom events)
    document.addEventListener('variant:change', function (e) {
      if (e.detail && e.detail.variant) trackSelectItem(e.detail.variant);
    });

    // Size selected (custom event from PDP size picker)
    document.addEventListener('horo:size:selected', function (e) {
      if (e.detail && e.detail.size) trackSizeSelected(e.detail.size, e.detail.source);
    });

    // Cart updates
    document.addEventListener('cart:updated', function (e) {
      if (e.detail && e.detail.variant) trackAddToCart(e.detail.variant, e.detail.quantity);
    });

    // Cart viewed (drawer opened)
    document.addEventListener('cart:viewed', function () {
      trackCartViewed();
    });

    // Begin checkout listener
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (form && form.name === 'checkout') {
        trackBeginCheckout();
      }
    });

    // Purchase (thank you page)
    if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) {
      var checkout = window.Shopify.checkout;
      trackPurchase(
        String(checkout.order_id),
        (checkout.subtotal_price || 0) / 100.0,
        checkout.currency || 'EGP'
      );
    }

    // Search
    var searchForm = document.querySelector('form[action="' + (window.routes && window.routes.search_url || '/search') + '"]');
    if (searchForm) {
      searchForm.addEventListener('submit', function (e) {
        var input = searchForm.querySelector('input[name="q"]');
        if (input) trackSearch(input.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose
  window.HoroAnalytics = {
    trackViewItem: trackViewItem,
    trackSelectItem: trackSelectItem,
    trackAddToCart: trackAddToCart,
    trackRemoveFromCart: trackRemoveFromCart,
    trackBeginCheckout: trackBeginCheckout,
    trackSearch: trackSearch,
    trackWishlistAdd: trackWishlistAdd,
    trackWishlistRemove: trackWishlistRemove,
    trackViewItemList: trackViewItemList,
    trackSizeSelected: trackSizeSelected,
    trackCartViewed: trackCartViewed,
    trackCheckoutSubmitted: trackCheckoutSubmitted,
    trackPaymentMethodSelected: trackPaymentMethodSelected,
    trackPurchase: trackPurchase,
    trackSearchZeroResults: trackSearchZeroResults,
  };
})();

