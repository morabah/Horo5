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

  function localizedText(value, locale) {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value[locale] || value.en || value.ar || '';
  }

  function normalizeFreeShipping(data) {
    var free = data && data.freeShipping;
    if (!free || free.active === false) return null;
    var thresholdEgp = parseFloat(free.thresholdEgp);
    if (!thresholdEgp || isNaN(thresholdEgp)) return null;
    return {
      thresholdEgp: thresholdEgp,
      label: free.label || {}
    };
  }

  function normalizeBundle(data) {
    var bundle = data && data.bundle;
    if (!bundle || bundle.active === false) return null;
    var reqQty = parseInt(bundle.requireQuantity || bundle.requiredQuantity, 10);
    if (!reqQty || isNaN(reqQty)) return null;
    return {
      requireQuantity: reqQty,
      applicationValue: parseFloat(bundle.applicationValue || bundle.discountEgp || '0') || 0,
      discountCode: bundle.discountCode || '',
      label: bundle.label || {}
    };
  }

  function formatCountdown(ms) {
    var totalSeconds = Math.max(0, Math.floor(ms / 1000));
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var pad = function (value) {
      return String(value).padStart(2, '0');
    };
    if (days > 0) return days + 'd ' + pad(hours) + 'h ' + pad(minutes) + 'm';
    return pad(hours) + ':' + pad(minutes) + ':' + pad(seconds);
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
        var freeShipping = normalizeFreeShipping(data);
        if (!freeShipping) return;

        var thresholdEgp = freeShipping.thresholdEgp;
        if (!thresholdEgp || isNaN(thresholdEgp)) return;

        var thresholdCents = Math.round(thresholdEgp * 100);
        var totalCents = parseInt(container.getAttribute('data-cart-total-cents') || '0', 10);
        var remainingCents = thresholdCents - totalCents;

        var labelText = localizedText(freeShipping.label, locale);

        var msgEl = container.querySelector('[data-fsp-message]');
        var barEl = container.querySelector('[data-fsp-bar]');
        var fillEl = container.querySelector('[data-fsp-fill]');
        var labelEl = container.querySelector('[data-fsp-label]');

        if (labelEl && labelText) {
          labelEl.textContent = labelText;
        }

        container.hidden = false;

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
    var locale = container.getAttribute('data-locale') || document.documentElement.lang || 'en';
    if (!apiUrl) return;

    fetchIncentives(apiUrl, timeout)
      .then(function (data) {
        var bundle = normalizeBundle(data);
        if (!bundle) return;

        var reqQty = bundle.requireQuantity;
        var discountCode = bundle.discountCode || '';
        if (!reqQty || isNaN(reqQty)) return;

        var headingEl = container.querySelector('[data-bundle-heading]');
        var codeEl = container.querySelector('[data-bundle-code]');
        var noteEl = container.querySelector('[data-bundle-note]');
        var countAttr = container.getAttribute('data-eligible-count');
        var eligibleCount = countAttr ? parseInt(countAttr, 10) : 0;
        var remaining = reqQty - eligibleCount;
        container.hidden = false;

        var beforeTpl = container.getAttribute('data-heading-before');
        var afterTpl = container.getAttribute('data-heading-after');

        if (headingEl) {
          var apiLabel = localizedText(bundle.label, locale);
          if (remaining > 0 && beforeTpl) {
            headingEl.textContent = beforeTpl
              .replace(/\{\{\s*count\s*\}\}/g, remaining)
              .replace(/\[count\]/g, remaining);
          } else if (apiLabel) {
            headingEl.textContent = apiLabel;
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

  function enhanceTimedOffer(container) {
    var apiUrl = container.getAttribute('data-incentives-api-url');
    var timeout = parseInt(container.getAttribute('data-api-timeout-ms') || '2500', 10);
    var locale = container.getAttribute('data-locale') || document.documentElement.lang || 'en';
    if (!apiUrl) return;

    fetchIncentives(apiUrl, timeout)
      .then(function (data) {
        var offer = data && data.timedOffer;
        if (!offer || !offer.endsAt) return;
        var startsMs = offer.startsAt ? Date.parse(offer.startsAt) : NaN;
        var endsMs = Date.parse(offer.endsAt);
        if (!isNaN(startsMs) && startsMs > Date.now()) return;
        if (isNaN(endsMs) || endsMs <= Date.now()) return;

        var labelEl = container.querySelector('[data-timed-offer-label]');
        var savingsEl = container.querySelector('[data-timed-offer-savings]');
        var displayEl = container.querySelector('[data-timed-offer-display]');
        var endedEl = container.querySelector('[data-timed-offer-ended]');
        var label = localizedText(offer.label, locale) || container.getAttribute('data-fallback-label') || 'Limited-time offer';
        var savings = offer.savingsKind === 'fixed'
          ? (offer.savingsValue + ' EGP')
          : (offer.savingsValue + '%');

        if (labelEl) labelEl.textContent = label;
        if (savingsEl) savingsEl.textContent = savings;

        function tick() {
          var remaining = endsMs - Date.now();
          if (remaining <= 0) {
            container.hidden = true;
            if (endedEl) endedEl.hidden = false;
            return false;
          }
          if (displayEl) displayEl.textContent = formatCountdown(remaining);
          container.hidden = false;
          return true;
        }

        if (!tick()) return;
        var interval = setInterval(function () {
          if (!tick()) clearInterval(interval);
        }, 1000);
      })
      .catch(function () {
        // No fallback countdown. Timed urgency only renders from API data.
      });
  }

  function init() {
    var fsp = document.querySelector('[data-horo-free-shipping-progress]');
    if (fsp) enhanceFreeShipping(fsp);

    var bundle = document.querySelector('[data-horo-bundle-progress]');
    if (bundle) enhanceBundle(bundle);

    var timedOffer = document.querySelector('[data-horo-timed-offer-countdown]');
    if (timedOffer) enhanceTimedOffer(timedOffer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HoroIncentives = {
    fetch: fetchIncentives,
    enhanceFreeShipping: enhanceFreeShipping,
    enhanceBundle: enhanceBundle,
    enhanceTimedOffer: enhanceTimedOffer
  };
}());
