/**
 * HORO Gift Wrap — event delegation; refreshes cart drawer when present.
 */
(function () {
  'use strict';

  var cartAddUrl = (window.routes && window.routes.cart_add_url) || '/cart/add.js';
  var cartChangeUrl = (window.routes && window.routes.cart_change_url) || '/cart/change.js';

  function getDrawerSections() {
    return 'cart-drawer,cart-icon-bubble';
  }

  function refreshCartUI(parsedState) {
    if (!parsedState || !parsedState.sections) return false;

    var drawer = document.querySelector('cart-drawer');
    var sectionHtml = parsedState.sections['cart-drawer'];
    if (sectionHtml) {
      var target = document.getElementById('CartDrawer');
      var doc = new DOMParser().parseFromString(sectionHtml, 'text/html');
      var source = doc.querySelector('#CartDrawer') || doc.querySelector('.cart-drawer');
      if (target && source) {
        target.innerHTML = source.innerHTML;
        if (drawer) drawer.classList.remove('is-empty');
      }
    }

    var bubbleHtml = parsedState.sections['cart-icon-bubble'];
    if (bubbleHtml) {
      var bubbleSection = document.getElementById('cart-icon-bubble');
      if (bubbleSection) {
        var bubbleDoc = new DOMParser().parseFromString(bubbleHtml, 'text/html');
        var bubbleInner = bubbleDoc.querySelector('.shopify-section');
        if (bubbleInner) bubbleSection.innerHTML = bubbleInner.innerHTML;
      }
    }

    if (drawer && typeof drawer.renderContents === 'function' && parsedState.id) {
      try {
        drawer.renderContents(parsedState);
      } catch (e) {
        /* renderContents optional */
      }
    }

    return !!sectionHtml;
  }

  function reloadFallback() {
    window.location.reload();
  }

  function handleAdd(el) {
    var variantId = el.getAttribute('data-variant-id');
    var sectionId = el.getAttribute('data-section-id');
    if (!variantId) return;

    el.disabled = true;
    if (el.type === 'checkbox') el.checked = true;

    var statusEl = document.querySelector('[data-gift-wrap-status="' + sectionId + '"]');
    if (statusEl) statusEl.textContent = '';

    var inDrawer = !!document.querySelector('cart-drawer.active, cart-drawer.animate');

    fetch(cartAddUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        items: [{ id: parseInt(variantId, 10), quantity: 1 }],
        sections: getDrawerSections(),
        sections_url: window.location.pathname
      })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (data) {
            throw new Error(data.description || 'Add failed');
          });
        }
        return res.json();
      })
      .then(function (data) {
        if (inDrawer && refreshCartUI(data)) return;
        reloadFallback();
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'Unable to add gift wrap. Please try again.';
          statusEl.classList.add('gift-wrap__status--error');
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

    var inDrawer = !!document.querySelector('cart-drawer.active, cart-drawer.animate');

    fetch('/cart.js', { method: 'GET', headers: { Accept: 'application/json' } })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var line = 0;
        for (var i = 0; i < cart.items.length; i++) {
          if (String(cart.items[i].variant_id) === String(variantId)) {
            line = i + 1;
            break;
          }
        }
        if (!line) throw new Error('Gift wrap not found in cart');
        return fetch(cartChangeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            line: line,
            quantity: 0,
            sections: getDrawerSections(),
            sections_url: window.location.pathname
          })
        });
      })
      .then(function (res) {
        if (!res.ok) {
          return res.json().then(function (data) {
            throw new Error(data.description || 'Remove failed');
          });
        }
        return res.text().then(function (text) {
          try {
            return JSON.parse(text);
          } catch (e) {
            return {};
          }
        });
      })
      .then(function (data) {
        if (inDrawer && refreshCartUI(data)) return;
        reloadFallback();
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = err.message || 'Unable to remove gift wrap. Please try again.';
          statusEl.classList.add('gift-wrap__status--error');
        }
        el.disabled = false;
        if (el.type === 'checkbox') el.checked = true;
      });
  }

  document.addEventListener('click', function (event) {
    var addBtn = event.target.closest('[data-gift-wrap-add]');
    if (addBtn && addBtn.type !== 'checkbox') {
      event.preventDefault();
      handleAdd(addBtn);
    }
  });

  document.addEventListener('change', function (event) {
    var addCb = event.target.closest('[data-gift-wrap-add]');
    if (addCb && addCb.type === 'checkbox' && addCb.checked) {
      handleAdd(addCb);
      return;
    }
    var removeCb = event.target.closest('[data-gift-wrap-remove]');
    if (removeCb && removeCb.type === 'checkbox' && !removeCb.checked) {
      handleRemove(removeCb);
    }
  });
}());
