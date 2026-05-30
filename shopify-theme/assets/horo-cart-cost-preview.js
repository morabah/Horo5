/**
 * HORO cart cost preview — governorate-based shipping estimates (display only).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'horo_cart_cost_governorate_v1';

  function isArabic(locale) {
    return String(locale || '').toLowerCase().indexOf('ar') === 0;
  }

  function readLabels(root) {
    return {
      chooseGovernorate: root.getAttribute('data-label-choose') || '',
      basisPrefix: root.getAttribute('data-label-basis-prefix') || 'Shipping estimate based on:',
      shippingChoose: root.getAttribute('data-label-shipping-choose') || '',
      shippingFree: root.getAttribute('data-label-shipping-free') || '',
      totalPlusShipping: root.getAttribute('data-label-total-plus') || '',
      govCairoGiza: root.getAttribute('data-label-gov-cairo') || '',
      govAlex: root.getAttribute('data-label-gov-alex') || '',
      govOther: root.getAttribute('data-label-gov-other') || '',
    };
  }

  function formatMoney(cents, locale) {
    var amount = Math.round(Number(cents) / 100);
    if (!Number.isFinite(amount)) amount = 0;
    if (isArabic(locale)) {
      return amount.toLocaleString('ar-EG') + ' ج.م';
    }
    return 'EGP ' + amount.toLocaleString('en-US');
  }

  function shippingEgpForGov(root, gov) {
    if (gov === 'cairo_giza') return Number(root.getAttribute('data-shipping-cairo')) || 0;
    if (gov === 'alexandria') return Number(root.getAttribute('data-shipping-alex')) || 0;
    if (gov === 'other') return Number(root.getAttribute('data-shipping-other')) || 0;
    return null;
  }

  function govLabel(labels, gov) {
    if (gov === 'cairo_giza') return labels.govCairoGiza || 'Cairo & Giza';
    if (gov === 'alexandria') return labels.govAlex || 'Alexandria';
    if (gov === 'other') return labels.govOther || 'Other governorates';
    return '';
  }

  function readCents(root, name) {
    return Math.max(0, Number(root.getAttribute(name)) || 0);
  }

  function freeShippingUnlocked(root, merchCents) {
    if (root.getAttribute('data-incentives-live') !== 'true') return false;
    var thresholdEgp = Number(root.getAttribute('data-free-shipping-threshold-egp')) || 0;
    if (thresholdEgp <= 0) return false;
    return merchCents >= thresholdEgp * 100;
  }

  function updateFreeShipBanner(root, merchCents, labels, locale) {
    var banner = root.querySelector('[data-horo-cost-freeship]');
    if (!banner) return;
    var thresholdCents = Number(banner.getAttribute('data-threshold-cents')) || 0;
    if (thresholdCents <= 0 || root.getAttribute('data-incentives-live') !== 'true') {
      banner.hidden = true;
      return;
    }
    var msg = banner.querySelector('[data-horo-cost-freeship-msg]');
    if (!msg) return;
    banner.hidden = false;
    if (merchCents >= thresholdCents) {
      msg.textContent = labels.shippingFree || (isArabic(locale) ? 'شحن مجاني عند الدفع إن كانت القاعدة مفعّلة' : 'Free shipping at checkout if the rule is active');
    } else {
      var remaining = formatMoney(thresholdCents - merchCents, locale);
      msg.textContent = isArabic(locale)
        ? 'أضف ' + remaining + ' للشحن المجاني (إن كانت القاعدة مفعّلة في المتجر)'
        : 'Add ' + remaining + ' for free shipping (if the store rule is active)';
    }
  }

  function render(root) {
    var locale = root.getAttribute('data-locale') || 'en';
    var labels = readLabels(root);
    var merchCents = readCents(root, 'data-merch-cents');
    var giftCents = readCents(root, 'data-gift-cents');
    var select = root.querySelector('[data-horo-cost-governorate]');
    var gov = select ? select.value : '';
    var basisEl = root.querySelector('[data-horo-cost-basis]');
    var subtotalEl = root.querySelector('[data-horo-cost-subtotal]');
    var giftRow = root.querySelector('[data-horo-cost-gift-row]');
    var giftEl = root.querySelector('[data-horo-cost-gift]');
    var shippingEl = root.querySelector('[data-horo-cost-shipping]');
    var totalEl = root.querySelector('[data-horo-cost-total]');

    if (subtotalEl) subtotalEl.textContent = formatMoney(merchCents, locale);
    if (giftRow) giftRow.hidden = giftCents <= 0;
    if (giftEl) giftEl.textContent = formatMoney(giftCents, locale);

    updateFreeShipBanner(root, merchCents, labels, locale);

    var baseCents = merchCents + giftCents;
    var unlocked = freeShippingUnlocked(root, merchCents);

    if (!gov) {
      if (basisEl) basisEl.textContent = labels.chooseGovernorate || labels.shippingChoose || '';
      if (shippingEl) shippingEl.textContent = labels.shippingChoose || '';
      if (totalEl) {
        totalEl.textContent =
          labels.totalPlusShipping ||
          (isArabic(locale)
            ? formatMoney(baseCents, locale) + ' + شحن'
            : formatMoney(baseCents, locale) + ' + shipping');
      }
      return;
    }

    var govName = govLabel(labels, gov);
    if (basisEl) {
      var prefix = labels.basisPrefix || 'Shipping estimate based on:';
      basisEl.textContent = prefix + ' ' + govName;
    }

    var shippingEgp = shippingEgpForGov(root, gov);
    if (shippingEgp == null || shippingEgp < 0) {
      if (shippingEl) shippingEl.textContent = labels.shippingChoose || '';
      if (totalEl) totalEl.textContent = formatMoney(baseCents, locale);
      return;
    }

    var shippingCents = unlocked ? 0 : Math.round(shippingEgp * 100);
    if (shippingEl) {
      shippingEl.textContent = unlocked
        ? labels.shippingFree || (isArabic(locale) ? 'مجاني (تقدير)' : 'Free (estimate)')
        : formatMoney(shippingCents, locale);
    }
    if (totalEl) totalEl.textContent = formatMoney(baseCents + shippingCents, locale);
  }

  function init(root) {
    if (!root || root.getAttribute('data-horo-cost-bound') === 'true') return;
    root.setAttribute('data-horo-cost-bound', 'true');

    var select = root.querySelector('[data-horo-cost-governorate]');
    if (select) {
      try {
        var saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved && select.querySelector('option[value="' + saved + '"]')) {
          select.value = saved;
        }
      } catch (_e) {
        /* ignore */
      }
      select.addEventListener('change', function () {
        try {
          if (select.value) sessionStorage.setItem(STORAGE_KEY, select.value);
          else sessionStorage.removeItem(STORAGE_KEY);
        } catch (_e2) {
          /* ignore */
        }
        render(root);
      });
    }

    render(root);
  }

  function initAll() {
    document.querySelectorAll('[data-horo-cart-cost-preview]').forEach(function (root) {
      root.removeAttribute('data-horo-cost-bound');
      init(root);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
      window.requestAnimationFrame(initAll);
    });
  }

  document.addEventListener('shopify:section:load', initAll);
})();
