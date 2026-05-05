/**
 * HORO Incentives — Public API fetcher with safe fallback.
 * Fetches display-only incentive config from a public app-proxy endpoint.
 * Falls back to manual theme settings on any failure.
 * No Admin tokens exposed. No checkout logic modified.
 */
(function () {
  'use strict';

  var CACHE_KEY = 'horo_incentives_v1';
  var CACHE_TTL_MS = 60 * 1000;

  function getCache() {
    try {
      var raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function setCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      // Ignore quota errors
    }
  }

  function fetchIncentives(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var cached = getCache();
      if (cached) {
        resolve(cached);
        return;
      }

      var controller = new AbortController();
      var timer = setTimeout(function () {
        controller.abort();
      }, timeoutMs || 2500);

      fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        credentials: 'same-origin'
      })
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          setCache(data);
          resolve(data);
        })
        .catch(function (err) {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * Enhance free-shipping progress with API data.
   * @param {HTMLElement} container — root element with data attributes
   */
  function enhanceFreeShipping(container) {
    var apiUrl = container.getAttribute('data-incentives-api-url');
    var timeout = parseInt(container.getAttribute('data-api-timeout-ms') || '2500', 10);
    var locale = container.getAttribute('data-locale') || 'en';
    if (!apiUrl) return;

    fetchIncentives(apiUrl, timeout)
      .then(function (data) {
        if (!data || !data.freeShipping || !data.freeShipping.active) return;

        var thresholdEgp = parseFloat(data.freeShipping.thresholdEgp);
        if (!thresholdEgp || isNaN(thresholdEgp)) return;

        var thresholdCents = Math.round(thresholdEgp * 100);
        var totalCents = parseInt(container.getAttribute('data-cart-total-cents') || '0', 10);
        var remainingCents = thresholdCents - totalCents;

        var label = data.freeShipping.label || {};
        var labelText = label[locale] || label.en || '';

        var msgEl = container.querySelector('[data-fsp-message]');
        var barEl = container.querySelector('[data-fsp-bar]');
        var fillEl = container.querySelector('[data-fsp-fill]');
        var labelEl = container.querySelector('[data-fsp-label]');

        if (labelEl && labelText) {
          labelEl.textContent = labelText;
        }

        if (remainingCents > 0) {
          var amount = (remainingCents / 100).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });

          var beforeTemplate = container.getAttribute('data-message-before');
          if (msgEl && beforeTemplate) {
            msgEl.textContent = beforeTemplate.replace(/\[amount\]/g, amount + ' EGP');
          }

          if (barEl) {
            barEl.setAttribute('aria-valuemax', thresholdCents);
            barEl.setAttribute('aria-valuenow', totalCents);
          }
          if (fillEl) {
            var pct = Math.min(100, Math.max(0, (totalCents / thresholdCents) * 100));
            fillEl.style.width = pct + '%';
          }
        } else {
          var afterTemplate = container.getAttribute('data-message-after');
          if (msgEl && afterTemplate) {
            msgEl.textContent = afterTemplate;
            msgEl.classList.add('cart-free-shipping-progress__message--unlocked');
          }
          if (barEl) {
            barEl.setAttribute('aria-valuemax', thresholdCents);
            barEl.setAttribute('aria-valuenow', thresholdCents);
          }
          if (fillEl) {
            fillEl.style.width = '100%';
          }
        }
      })
      .catch(function () {
        // Silently keep manual fallback rendered by Liquid
      });
  }

  /**
   * Enhance bundle progress with API data.
   * @param {HTMLElement} container — root element with data attributes
   */
  function enhanceBundle(container) {
    var apiUrl = container.getAttribute('data-incentives-api-url');
    var timeout = parseInt(container.getAttribute('data-api-timeout-ms') || '2500', 10);
    if (!apiUrl) return;

    fetchIncentives(apiUrl, timeout)
      .then(function (data) {
        if (!data || !data.bundle || !data.bundle.active) return;

        var reqQty = parseInt(data.bundle.requiredQuantity, 10);
        var discountCode = data.bundle.discountCode || '';
        if (!reqQty || isNaN(reqQty)) return;

        var headingEl = container.querySelector('[data-bundle-heading]');
        var codeEl = container.querySelector('[data-bundle-code]');
        var noteEl = container.querySelector('[data-bundle-note]');
        var countAttr = container.getAttribute('data-eligible-count');
        var eligibleCount = countAttr ? parseInt(countAttr, 10) : 0;
        var remaining = reqQty - eligibleCount;

        var beforeTpl = container.getAttribute('data-heading-before');
        var afterTpl = container.getAttribute('data-heading-after');

        if (headingEl) {
          if (remaining > 0 && beforeTpl) {
            headingEl.textContent = beforeTpl.replace(/\{\{\s*count\s*\}\}/g, remaining);
          } else if (afterTpl) {
            headingEl.textContent = afterTpl;
          }
        }

        if (codeEl && discountCode) {
          codeEl.querySelector('[data-bundle-code-value]').textContent = discountCode;
          codeEl.style.display = 'inline-flex';
        }
      })
      .catch(function () {
        // Silently keep manual fallback
      });
  }

  function init() {
    var fsp = document.querySelector('[data-horo-free-shipping-progress]');
    if (fsp) enhanceFreeShipping(fsp);

    var bundle = document.querySelector('[data-horo-bundle-progress]');
    if (bundle) enhanceBundle(bundle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HoroIncentives = {
    fetch: fetchIncentives,
    enhanceFreeShipping: enhanceFreeShipping,
    enhanceBundle: enhanceBundle
  };
}());
