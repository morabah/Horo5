/**
 * HORO Gift Wrap Upsell — Minimal, isolated cart add behavior.
 * Adds the gift-wrap product variant via Shopify Cart AJAX.
 * Refreshes the page on success. No Dawn dependency.
 */
(function () {
  'use strict';

  function initGiftWrap() {
    var buttons = document.querySelectorAll('[data-gift-wrap-add]');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var variantId = btn.getAttribute('data-variant-id');
        var sectionId = btn.getAttribute('data-section-id');
        if (!variantId) return;

        btn.disabled = true;

        fetch('/cart/add.js', {
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
          var statusEl = document.querySelector('[data-gift-wrap-status="' + sectionId + '"]');
          if (statusEl) {
            statusEl.textContent = err.message || 'Unable to add gift wrap. Please try again.';
          }
          btn.disabled = false;
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGiftWrap);
  } else {
    initGiftWrap();
  }
}());
