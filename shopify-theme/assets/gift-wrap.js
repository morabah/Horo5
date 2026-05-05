/**
 * HORO Gift Wrap Upsell — Minimal, isolated cart add/remove behavior.
 * Adds/removes the gift-wrap product variant via Shopify Cart AJAX.
 * Refreshes the page on success. No Dawn dependency.
 * Supports button add, checkbox toggle add, and checkbox toggle remove.
 */
(function () {
  'use strict';

  var cartAddUrl = window.routes && window.routes.cart_add_url ? window.routes.cart_add_url : '/cart/add.js';
  var cartChangeUrl = window.routes && window.routes.cart_change_url ? window.routes.cart_change_url : '/cart/change.js';

  function handleAdd(el) {
    var variantId = el.getAttribute('data-variant-id');
    var sectionId = el.getAttribute('data-section-id');
    if (!variantId) return;

    el.disabled = true;
    if (el.type === 'checkbox') el.checked = true;

    var statusEl = document.querySelector('[data-gift-wrap-status="' + sectionId + '"]');
    if (statusEl) statusEl.textContent = '';

    fetch(cartAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: parseInt(variantId, 10),
          quantity: 1
        }]
      })
    })
    .then(function (res) {
      if (res.ok) {
        window.location.reload();
      } else {
        return res.json().then(function (data) {
          throw new Error(data.description || 'Add failed');
        });
      }
    })
    .catch(function (err) {
      if (statusEl) {
        statusEl.textContent = err.message || 'Unable to add gift wrap. Please try again.';
      }
      el.disabled = false;
      if (el.type === 'checkbox') el.checked = false;
    });
  }

  function handleRemove(el) {
    var variantId = el.getAttribute('data-variant-id');
    var sectionId = el.getAttribute('data-section-id');
    if (!variantId) return;

    el.disabled = true;

    var statusEl = document.querySelector('[data-gift-wrap-status="' + sectionId + '"]');
    if (statusEl) statusEl.textContent = '';

    // Find the line item key for the gift wrap product to remove it safely
    fetch('/cart.js', { method: 'GET', headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var line = 0;
        var found = false;
        for (var i = 0; i < cart.items.length; i++) {
          if (String(cart.items[i].variant_id) === String(variantId)) {
            line = i + 1;
            found = true;
            break;
          }
        }
        if (!found) {
          throw new Error('Gift wrap not found in cart');
        }
        return fetch(cartChangeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line: line, quantity: 0 })
        });
      })
      .then(function (res) {
        if (res.ok) {
          window.location.reload();
        } else {
          return res.json().then(function (data) {
            throw new Error(data.description || 'Remove failed');
          });
        }
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'Unable to remove gift wrap. Please try again.';
        }
        el.disabled = false;
        if (el.type === 'checkbox') el.checked = true;
      });
  }

  function initGiftWrap() {
    var addButtons = document.querySelectorAll('[data-gift-wrap-add]');
    addButtons.forEach(function (btn) {
      if (btn.dataset.giftWrapBound === 'true') return;
      btn.dataset.giftWrapBound = 'true';

      if (btn.type === 'checkbox') {
        btn.addEventListener('change', function () {
          if (btn.checked) {
            handleAdd(btn);
          }
          // If unchecked on product page, we don't remove here — keep native cart remove
        });
      } else {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          handleAdd(btn);
        });
      }
    });

    var removeCheckboxes = document.querySelectorAll('[data-gift-wrap-remove]');
    removeCheckboxes.forEach(function (cb) {
      if (cb.dataset.giftWrapBound === 'true') return;
      cb.dataset.giftWrapBound = 'true';

      cb.addEventListener('change', function () {
        if (!cb.checked) {
          handleRemove(cb);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftWrap);
  } else {
    initGiftWrap();
  }
}());
