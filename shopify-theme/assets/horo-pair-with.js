/**
 * HORO Pair With — One-click multi-product add-to-cart.
 * Collects selected companion variant IDs and POSTs to /cart/add.js.
 * Falls back to "Choose options" for multi-variant products.
 * Disables button while adding. Announces status via aria-live.
 * Does not break Dawn product form or cart.
 */
(function () {
  'use strict';

  var cartAddUrl = window.routes && window.routes.cart_add_url ? window.routes.cart_add_url : '/cart/add.js';

  function initPairWith(container) {
    var form = container.querySelector('[data-pair-with-form]');
    var btn = container.querySelector('[data-pair-with-add]');
    var statusEl = container.querySelector('[data-pair-with-status]');
    if (!form || !btn) return;

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (btn.disabled) return;

      var checkboxes = form.querySelectorAll('input[name="pair_with_items"]:checked');
      var items = [];
      checkboxes.forEach(function (cb) {
        var variantId = cb.getAttribute('data-variant-id');
        if (variantId) {
          items.push({ id: parseInt(variantId, 10), quantity: 1 });
        }
      });

      if (items.length === 0) {
        if (statusEl) {
          statusEl.textContent = container.getAttribute('data-msg-select') || 'Please select at least one item.';
        }
        return;
      }

      btn.disabled = true;
      if (statusEl) {
        statusEl.textContent = container.getAttribute('data-msg-adding') || 'Adding...';
      }

      fetch(cartAddUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items })
      })
        .then(function (res) {
          if (res.ok) {
            if (statusEl) {
              statusEl.textContent = container.getAttribute('data-msg-success') || 'Items added to cart.';
            }
            var redirect = container.getAttribute('data-redirect') === 'true';
            if (redirect) {
              window.location.href = '/cart';
            } else {
              // Refresh page to update cart state (safe, works with Dawn cart)
              setTimeout(function () {
                window.location.reload();
              }, 600);
            }
          } else {
            return res.json().then(function (data) {
              throw new Error(data.description || 'Add failed');
            });
          }
        })
        .catch(function (err) {
          if (statusEl) {
            statusEl.textContent = (container.getAttribute('data-msg-error') || 'Unable to add items. Please try again.') + ' ' + err.message;
          }
          btn.disabled = false;
        });
    });
  }

  function init() {
    document.querySelectorAll('[data-pair-with-section]').forEach(initPairWith);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
