/**
 * HORO Product Promo Countdown — Safe, display-only countdown.
 * Reads end date from data attribute. Updates every minute.
 * Hides when expired. Respects prefers-reduced-motion.
 * No fake urgency. No checkout logic modified.
 */
(function () {
  'use strict';

  var INTERVAL_MS = 60 * 1000;
  var containers = [];

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  function getTimeParts(ms) {
    if (ms <= 0) return null;
    var days = Math.floor(ms / (1000 * 60 * 60 * 24));
    var hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return { days: days, hours: hours, minutes: minutes };
  }

  function formatParts(parts, locale) {
    var d = parts.days;
    var h = pad(parts.hours);
    var m = pad(parts.minutes);
    if (locale === 'ar') {
      return (d > 0 ? d + ' يوم ' : '') + h + ':' + m;
    }
    return (d > 0 ? d + 'd ' : '') + h + ':' + m;
  }

  function updateContainer(el) {
    var endsAtStr = el.getAttribute('data-promo-ends-at');
    var locale = el.getAttribute('data-locale') || 'en';
    if (!endsAtStr) return;

    var endsAt = new Date(endsAtStr);
    var now = new Date();
    var diff = endsAt.getTime() - now.getTime();

    var displayEl = el.querySelector('[data-promo-display]');
    var endedEl = el.querySelector('[data-promo-ended]');

    if (diff <= 0) {
      el.classList.add('product-promo-countdown--expired');
      if (displayEl) displayEl.hidden = true;
      if (endedEl) {
        endedEl.hidden = false;
        endedEl.textContent = locale === 'ar' ? 'انتهى العرض' : 'Offer ended';
      }
      return false; // stop interval
    }

    var parts = getTimeParts(diff);
    if (!parts) return false;

    if (displayEl) {
      displayEl.textContent = formatParts(parts, locale);
    }
    return true;
  }

  function tick() {
    containers = containers.filter(function (el) {
      return updateContainer(el);
    });
    if (containers.length === 0 && window.horoCountdownTimer) {
      clearInterval(window.horoCountdownTimer);
      window.horoCountdownTimer = null;
    }
  }

  function init() {
    var nodes = document.querySelectorAll('[data-promo-countdown]');
    if (!nodes.length) return;

    var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    nodes.forEach(function (node) {
      if (updateContainer(node)) {
        containers.push(node);
      }
    });

    if (containers.length && !window.horoCountdownTimer) {
      window.horoCountdownTimer = setInterval(tick, INTERVAL_MS);
      if (prefersReduced) {
        // Still keep the timer running for accuracy, but no visual transitions
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
