/**
 * Upper-right "added to bag" mini-cart toast — product image, price, variant; 3s auto-dismiss.
 */
(function () {
  'use strict';

  var DISMISS_MS = 10000;
  var host = null;
  var timer = null;

  function copy() {
    return (
      window.horoAddedToBagCopy || {
        title: 'Added to bag',
        viewBag: 'View bag',
        continueShopping: 'Continue shopping',
        closeLabel: 'Close',
        sizeLabel: 'Size',
        qtyLabel: 'Qty',
        cartUrl: '/cart',
      }
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(cents) {
    var amount = Math.round(Number(cents) / 100);
    if (!Number.isFinite(amount)) amount = 0;
    if (typeof Shopify !== 'undefined' && Shopify.formatMoney) {
      return Shopify.formatMoney(amount * 100, window.theme && window.theme.moneyFormat);
    }
    return 'EGP ' + amount.toLocaleString('en-US');
  }

  function optionSummary(options) {
    if (!options || !options.length) return '';
    return options
      .map(function (opt) {
        return opt.value || opt.name || '';
      })
      .filter(Boolean)
      .join(' · ');
  }

  function lineItemFromState(state) {
    if (!state || typeof state !== 'object') return null;

    if (state.product_title) {
      var options = state.options_with_values || [];
      var sizeFromOptions = optionSummary(options);
      return {
        title: state.product_title,
        image: state.image || (state.featured_image && state.featured_image.url) || '',
        priceCents: state.final_line_price != null ? state.final_line_price : state.price,
        qty: state.quantity || 1,
        size: sizeFromOptions || state.variant_title || '',
      };
    }

    var key = state.key;
    var sectionHtml =
      (state.sections && state.sections['cart-notification-product']) ||
      (state.sections && state.sections['cart-drawer']) ||
      '';

    if (sectionHtml && key) {
      var doc = new DOMParser().parseFromString(sectionHtml, 'text/html');
      var row = doc.getElementById('cart-notification-product-' + key) || doc.querySelector('.cart-item');
      if (row) {
        var img = row.querySelector('img');
        var name = row.querySelector('.cart-notification-product__name, .cart-item__name, h3');
        var optionsEls = row.querySelectorAll('.product-option dd');
        var sizeParts = [];
        optionsEls.forEach(function (dd) {
          if (dd.textContent) sizeParts.push(dd.textContent.trim());
        });
        return {
          title: name ? name.textContent.trim() : '',
          image: img ? img.getAttribute('src') : '',
          priceCents: state.final_line_price || state.price || 0,
          qty: state.quantity || 1,
          size: sizeParts.join(' · '),
        };
      }
    }

    return null;
  }

  function dismiss() {
    if (timer) window.clearTimeout(timer);
    timer = null;
    if (host) host.remove();
    host = null;
  }

  function scheduleDismiss() {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(dismiss, DISMISS_MS);
  }

  function buildToastHtml(labels, item) {
    var meta = '';
    if (item.size) {
      meta =
        '<p class="horo-added-to-bag-toast__meta">' +
        escapeHtml(labels.sizeLabel) +
        ': ' +
        escapeHtml(item.size) +
        ' · ' +
        escapeHtml(labels.qtyLabel) +
        ': ' +
        escapeHtml(String(item.qty)) +
        '</p>';
    } else {
      meta =
        '<p class="horo-added-to-bag-toast__meta">' +
        escapeHtml(labels.qtyLabel) +
        ': ' +
        escapeHtml(String(item.qty)) +
        '</p>';
    }

    var imageBlock = item.image
      ? '<div class="horo-added-to-bag-toast__image"><img src="' +
        escapeHtml(item.image) +
        '" alt="" width="92" height="115" loading="lazy"></div>'
      : '<div class="horo-added-to-bag-toast__image horo-added-to-bag-toast__image--empty" aria-hidden="true"></div>';

    return (
      '<div class="horo-added-to-bag-toast" role="document">' +
      '<header class="horo-added-to-bag-toast__header">' +
      '<div class="horo-added-to-bag-toast__header-title">' +
      '<span class="horo-added-to-bag-toast__check" aria-hidden="true">✓</span>' +
      '<span class="horo-added-to-bag-toast__heading">' +
      escapeHtml(labels.title) +
      '</span></div>' +
      '<button type="button" class="horo-added-to-bag-toast__close" aria-label="' +
      escapeHtml(labels.closeLabel) +
      '">×</button>' +
      '</header>' +
      '<div class="horo-added-to-bag-toast__item">' +
      imageBlock +
      '<div class="horo-added-to-bag-toast__info">' +
      '<p class="horo-added-to-bag-toast__name">' +
      escapeHtml(item.title) +
      '</p>' +
      meta +
      '<p class="horo-added-to-bag-toast__price">' +
      escapeHtml(formatMoney(item.priceCents)) +
      '</p>' +
      '</div></div>' +
      '<div class="horo-added-to-bag-toast__actions">' +
      '<a class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--primary" href="' +
      escapeHtml(labels.cartUrl) +
      '">' +
      escapeHtml(labels.viewBag) +
      '</a>' +
      '<button type="button" class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--ghost">' +
      escapeHtml(labels.continueShopping) +
      '</button></div></div>'
    );
  }

  function showToast(cartState) {
    dismiss();
    var labels = copy();
    var item = lineItemFromState(cartState);

    host = document.createElement('div');
    host.className = 'horo-added-to-bag-toast-host';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');

    if (item && item.title) {
      host.innerHTML = buildToastHtml(labels, item);
    } else {
      host.innerHTML =
        '<div class="horo-added-to-bag-toast horo-added-to-bag-toast--compact">' +
        '<p class="horo-added-to-bag-toast__heading-only"><span aria-hidden="true">✓</span> ' +
        escapeHtml(labels.title) +
        '</p>' +
        '<div class="horo-added-to-bag-toast__actions">' +
        '<a class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--primary" href="' +
        escapeHtml(labels.cartUrl) +
        '">' +
        escapeHtml(labels.viewBag) +
        '</a>' +
        '<button type="button" class="horo-added-to-bag-toast__cta horo-added-to-bag-toast__cta--ghost">' +
        escapeHtml(labels.continueShopping) +
        '</button></div></div>';
    }

    var closeBtn = host.querySelector('.horo-added-to-bag-toast__close');
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    var continueBtn = host.querySelector('.horo-added-to-bag-toast__cta--ghost');
    if (continueBtn) continueBtn.addEventListener('click', dismiss);

    host.addEventListener('pointerenter', function () {
      if (timer) window.clearTimeout(timer);
    });
    host.addEventListener('pointerleave', scheduleDismiss);

    document.body.appendChild(host);
    scheduleDismiss();
  }

  window.horoShowAddedToBagToast = showToast;
})();
