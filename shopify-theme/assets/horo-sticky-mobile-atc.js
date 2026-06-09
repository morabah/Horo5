/**
 * HORO Sticky Mobile Add-to-Cart.
 *
 * Shows a sticky bar at the bottom of product pages on mobile
 * after the main buy button scrolls out of view.
 *
 * - Syncs with Dawn variant picker via custom events.
 * - Uses /cart/add.js for add-to-cart.
 * - Mobile only (max-width 749px).
 * - Respects safe-area-inset-bottom on iPhone.
 * - If JS fails, normal product form still works.
 */
(function () {
  'use strict';

  var bar = document.querySelector('[data-horo-sticky-mobile-atc]');
  if (!bar) return;

  var btn = bar.querySelector('[data-horo-sticky-atc-btn]');
  var priceEl = bar.querySelector('.horo-sticky-mobile-atc__variant-price');
  var variantsDataEl = document.querySelector('[data-horo-sticky-atc-variants]');

  var variants = [];
  try {
    variants = JSON.parse(variantsDataEl.textContent);
  } catch (_) {
    return; // no variants data, bail
  }

  var selectedVariantId = null;
  var mainForm = document.querySelector('product-form [data-type="add-to-cart-form"]') ||
    document.querySelector('form[data-type="add-to-cart-form"]');

  // Try to get initial selected variant from Dawn's hidden input
  var hiddenInput = document.querySelector('.product-variant-id');
  if (hiddenInput) {
    selectedVariantId = parseInt(hiddenInput.value, 10);
  }
  if (!selectedVariantId && variants.length > 0) {
    // Fallback: first available
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].available) {
        selectedVariantId = variants[i].id;
        break;
      }
    }
  }

  /**
   * Update bar UI for a given variant ID.
   */
  function updateBar(variantId) {
    selectedVariantId = variantId;
    var v = null;
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].id === variantId) { v = variants[i]; break; }
    }
    if (!v) return;

    if (priceEl) {
      if (window.HoroFormatMoney) {
        priceEl.textContent = window.HoroFormatMoney(v.price);
      } else {
        var currency = (window.HoroShop && window.HoroShop.currency) || '';
        priceEl.textContent = (v.price / 100).toLocaleString('en-EG', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + (currency ? ' ' + currency : '');
      }
    }

    if (btn) {
      var addLabel = (window.variantStrings && window.variantStrings.addToCart) ? window.variantStrings.addToCart : 'Add to cart';
      var soldLabel = (window.variantStrings && window.variantStrings.soldOut) ? window.variantStrings.soldOut : 'Sold out';
      if (v.available) {
        btn.disabled = false;
        btn.textContent = addLabel;
      } else {
        btn.disabled = true;
        btn.textContent = soldLabel;
      }
    }
  }

  /**
   * Listen for Dawn variant changes.
   * Dawn dispatches a 'variant:change' custom event on the variant picker.
   */
  document.addEventListener('variant:change', function (e) {
    if (e.detail && e.detail.variant) {
      updateBar(e.detail.variant.id);
    }
  });

  // Also watch the hidden input for changes (fallback)
  if (hiddenInput) {
    var observer = new MutationObserver(function () {
      var newId = parseInt(hiddenInput.value, 10);
      if (newId && newId !== selectedVariantId) {
        updateBar(newId);
      }
    });
    observer.observe(hiddenInput, { attributes: true, attributeFilter: ['value'] });
  }

  /**
   * Fallback: listen for change events inside variant pickers
   * (selects or radios) and read the hidden variant input after a short delay.
   */
  var pickerArea = document.querySelector('variant-radios, variant-selects, .product-form__input');
  if (pickerArea) {
    pickerArea.addEventListener('change', function () {
      setTimeout(function () {
        var fallbackInput = document.querySelector('.product-variant-id');
        if (fallbackInput) {
          var newId = parseInt(fallbackInput.value, 10);
          if (newId && newId !== selectedVariantId) {
            updateBar(newId);
          }
        }
      }, 120);
    });
  }

  /**
   * Add to cart.
   */
  if (btn) {
    btn.addEventListener('click', function () {
      if (!selectedVariantId) return;
      btn.disabled = true;
      btn.textContent = 'Adding…';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: String(selectedVariantId), quantity: 1 })
      })
      .then(function (r) {
        if (!r.ok) throw new Error('Add failed');
        return r.json();
      })
      .then(function () {
        btn.textContent = 'Added!';
        document.dispatchEvent(new CustomEvent('cart:added', { bubbles: true }));
        setTimeout(function () {
          var v = null;
          for (var i = 0; i < variants.length; i++) {
            if (variants[i].id === selectedVariantId) { v = variants[i]; break; }
          }
          btn.textContent = (v && v.available)
        ? ((window.variantStrings && window.variantStrings.addToCart) ? window.variantStrings.addToCart : 'Add to cart')
        : ((window.variantStrings && window.variantStrings.soldOut) ? window.variantStrings.soldOut : 'Sold out');
      btn.disabled = !(v && v.available);
        }, 1500);
      })
      .catch(function () {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
      });
    });
  }

  /**
   * Show/hide bar based on main buy button visibility.
   */
  var buyBtn = document.querySelector('.product-form__submit') ||
    document.querySelector('[name="add"][type="submit"]');

  if (buyBtn) {
    var io = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      if (entry.isIntersecting) {
        bar.setAttribute('hidden', '');
      } else {
        bar.removeAttribute('hidden');
      }
    }, { threshold: 0 });

    io.observe(buyBtn);
  }

  // Initial update
  if (selectedVariantId) {
    updateBar(selectedVariantId);
  }
})();
