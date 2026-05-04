/**
 * HORO Quick View.
 *
 * Opens a modal with product details when a [data-horo-quick-view-btn]
 * button is clicked. Fetches product JSON from Shopify's .js endpoint.
 *
 * - Single-variant products: shows Add to Cart button.
 * - Multi-variant products: shows "View product" link instead of risky ATC.
 * - Closes on X, Escape, backdrop click.
 * - Focus trap (basic) and focus return.
 * - Uses /cart/add.js for ATC.
 * - No external libraries.
 */
(function () {
  'use strict';

  var modal = document.getElementById('HoroQuickViewModal');
  if (!modal) return;

  var body = modal.querySelector('[data-horo-quick-view-body]');
  var closeBtns = modal.querySelectorAll('[data-horo-quick-view-close]');
  var triggerEl = null; // element that opened the modal

  /**
   * Open modal and fetch product data.
   */
  function open(handle, productUrl, hasVariants, title) {
    triggerEl = document.activeElement;
    body.innerHTML =
      '<div class="horo-quick-view-modal__loading">' +
      '<div class="horo-quick-view-modal__spinner" aria-hidden="true"></div>' +
      '<p>Loading&hellip;</p></div>';
    modal.removeAttribute('hidden');
    modal.focus();
    document.body.style.overflow = 'hidden';

    fetch('/products/' + handle + '.js')
      .then(function (r) { return r.json(); })
      .then(function (product) { renderProduct(product, productUrl, hasVariants); })
      .catch(function () {
        body.innerHTML =
          '<p class="horo-quick-view-modal__error">Could not load product details. ' +
          '<a href="' + escapeHtml(productUrl) + '">Visit the product page</a>.</p>';
      });
  }

  /**
   * Render product content inside modal body.
   */
  function renderProduct(product, productUrl, hasVariants) {
    var image = product.featured_image || (product.media && product.media[0] ? product.media[0].src : '');
    var priceHtml = formatPrice(product);
    var firstAvailable = null;
    var i;

    if (product.variants) {
      for (i = 0; i < product.variants.length; i++) {
        if (product.variants[i].available) {
          firstAvailable = product.variants[i];
          break;
        }
      }
    }

    var html = '<div class="horo-quick-view-modal__product">';

    if (image) {
      html += '<div class="horo-quick-view-modal__image">' +
        '<img src="' + escapeHtml(image) + '" alt="' + escapeHtml(product.title) + '" loading="lazy" width="400" height="400">' +
        '</div>';
    }

    html += '<div class="horo-quick-view-modal__info">';
    html += '<h3 class="horo-quick-view-modal__title">' + escapeHtml(product.title) + '</h3>';
    html += '<div class="horo-quick-view-modal__price">' + priceHtml + '</div>';

    // Single variant or no variants → safe ATC
    if (!hasVariants || (product.variants && product.variants.length <= 1)) {
      if (firstAvailable) {
        html += '<button type="button" class="button horo-quick-view-modal__atc" data-variant-id="' +
          firstAvailable.id + '" ' + (firstAvailable.available ? '' : 'disabled') + '>' +
          (firstAvailable.available ? 'Add to cart' : 'Sold out') +
          '</button>';
      } else {
        html += '<button type="button" class="button horo-quick-view-modal__atc" disabled>Sold out</button>';
      }
    } else {
      // Multi-variant → safe fallback to product page
      html += '<a href="' + escapeHtml(productUrl) + '" class="button horo-quick-view-modal__view">View product</a>';
    }

    html += '<a href="' + escapeHtml(productUrl) + '" class="horo-quick-view-modal__link">Full details</a>';
    html += '</div></div>';

    body.innerHTML = html;

    // Bind ATC
    var atcBtn = body.querySelector('[data-variant-id]');
    if (atcBtn && !atcBtn.disabled) {
      atcBtn.addEventListener('click', function () {
        var vid = atcBtn.getAttribute('data-variant-id');
        atcBtn.disabled = true;
        atcBtn.textContent = 'Adding…';
        addToCart(vid, function () {
          atcBtn.textContent = 'Added!';
          atcBtn.insertAdjacentHTML('afterend', '<a href="' + window.routes.cart_url + '" class="horo-quick-view-modal__cart-link">View cart</a>');
          setTimeout(function () {
            var link = atcBtn.parentNode.querySelector('.horo-quick-view-modal__cart-link');
            if (link) link.remove();
            atcBtn.textContent = 'Add to cart';
            atcBtn.disabled = false;
          }, 2500);
        }, function () {
          atcBtn.textContent = 'Error — try again';
          atcBtn.disabled = false;
        });
      });
    }
  }

  /**
   * Add to cart via /cart/add.js.
   */
  function addToCart(variantId, onSuccess, onError) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
    .then(function (r) {
      if (!r.ok) throw new Error('Add failed');
      return r.json();
    })
    .then(function () {
      if (onSuccess) onSuccess();
      // Dispatch custom event for other components (e.g. cart icon)
      document.dispatchEvent(new CustomEvent('cart:added', { bubbles: true }));
    })
    .catch(function () {
      if (onError) onError();
    });
  }

  /**
   * Format price from product JSON.
   */
  function formatPrice(product) {
    var price = product.price;
    var compare = product.compare_at_price;
    var symbol = (window.Shopify && window.Shopify.currencyActive) ? window.Shopify.currencyActive : 'EGP';

    function money(cents) {
      return (cents / 100).toLocaleString('en-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + symbol;
    }

    if (compare && compare > price) {
      return '<span class="horo-quick-view-modal__price-sale">' + money(price) + '</span> ' +
        '<span class="horo-quick-view-modal__price-compare">' + money(compare) + '</span>';
    }
    return '<span>' + money(price) + '</span>';
  }

  /**
   * Close modal and return focus.
   */
  function close() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (triggerEl) {
      triggerEl.focus();
      triggerEl = null;
    }
  }

  /**
   * Basic focus trap.
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    var focusable = modal.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Escape key
  function onKeydown(e) {
    if (e.key === 'Escape') close();
    trapFocus(e);
  }

  // Event bindings
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-horo-quick-view-btn]');
    if (!btn) return;
    e.preventDefault();
    var handle = btn.getAttribute('data-product-handle');
    var url = btn.getAttribute('data-product-url');
    var hasVariants = btn.getAttribute('data-has-variants') !== 'true';
    var title = btn.getAttribute('data-product-title');
    open(handle, url, hasVariants, title);
  });

  for (var i = 0; i < closeBtns.length; i++) {
    closeBtns[i].addEventListener('click', close);
  }

  modal.addEventListener('keydown', onKeydown);
})();

/**
 * Minimal HTML escaping.
 */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
