/**
 * HORO Delivery Estimate — exact date range calculator.
 *
 * Runs only when [data-delivery-estimate] is present and
 * show_exact_date_range is enabled. Calculates estimated delivery
 * date ranges using Cairo timezone, business-day logic, and a
 * configurable cutoff hour. Falls back gracefully: if JS fails,
 * the static "X–Y business days" text remains visible.
 *
 * No holiday awareness. No checkout integration.
 */
(function () {
  'use strict';

  var wrappers = document.querySelectorAll('[data-delivery-estimate]');
  if (!wrappers.length) return;

  function initInstance(wrapper) {
    var standardTarget = wrapper.querySelector('[data-standard-date-range]');
    var expressTarget = wrapper.querySelector('[data-express-date-range]');
    if (!standardTarget && !expressTarget) return;

    var TZ = wrapper.getAttribute('data-timezone') || 'Africa/Cairo';
    var cutoffHour = parseInt(wrapper.getAttribute('data-cutoff-hour-local') || '18', 10);
    var weekendAttr = wrapper.getAttribute('data-weekend-days') || 'friday_saturday';

    // Parse weekend config
    var weekendSet;
    if (weekendAttr === 'saturday_sunday') {
      weekendSet = { 0: true, 6: true }; // Sun=0, Sat=6
    } else {
      // Default: Friday/Saturday (Egypt work week)
      weekendSet = { 5: true, 6: true }; // Fri=5, Sat=6
    }

    var stdMin = parseInt(wrapper.getAttribute('data-standard-min-days') || '3', 10);
    var stdMax = parseInt(wrapper.getAttribute('data-standard-max-days') || '7', 10);
    var expMin = parseInt(wrapper.getAttribute('data-express-min-days') || '2', 10);
    var expMax = parseInt(wrapper.getAttribute('data-express-max-days') || '4', 10);

    /**
     * Get local date parts in the configured timezone.
     */
    function getLocalParts(date) {
      try {
        var formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: TZ,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23'
        });
        var parts = formatter.formatToParts(date);
        var lookup = function (type) {
          for (var i = 0; i < parts.length; i++) {
            if (parts[i].type === type) return parts[i].value;
          }
          return '';
        };
        return {
          year: parseInt(lookup('year'), 10),
          month: parseInt(lookup('month'), 10),
          day: parseInt(lookup('day'), 10),
          hour: parseInt(lookup('hour'), 10),
          minute: parseInt(lookup('minute'), 10)
        };
      } catch (_) {
        return null;
      }
    }

    /**
     * Is this UTC date a weekend day in our config?
     */
    function isWeekend(d) {
      return !!weekendSet[d.getUTCDay()];
    }

    /**
     * Add N business days, skipping weekends.
     */
    function addBusinessDays(from, n) {
      var d = new Date(from.getTime());
      d.setUTCHours(12, 0, 0, 0);
      var left = n;
      while (left > 0) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (!isWeekend(d)) left -= 1;
      }
      return d;
    }

    /**
     * Get the shipping anchor date (today or next business day,
     * respecting cutoff and weekends).
     */
    function getShipAnchor() {
      var now = new Date();
      var local = getLocalParts(now);
      if (!local) return now; // fallback

      // Build a UTC date representing the local calendar day
      var anchor = new Date(Date.UTC(local.year, local.month - 1, local.day, 12, 0, 0, 0));

      // If past cutoff, start from tomorrow
      var currentMinutes = local.hour * 60 + local.minute;
      var cutoffMinutes = cutoffHour * 60;
      if (currentMinutes >= cutoffMinutes) {
        anchor.setUTCDate(anchor.getUTCDate() + 1);
      }

      // Skip weekend days
      while (isWeekend(anchor)) {
        anchor.setUTCDate(anchor.getUTCDate() + 1);
      }

      return anchor;
    }

    /**
     * Format a date as "8 May" in English.
     */
    function formatShort(date) {
      try {
        return new Intl.DateTimeFormat('en-GB', {
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC'
        }).format(date);
      } catch (_) {
        return '';
      }
    }

    /**
     * Build the date range string: "Estimated: 8 May – 13 May"
     */
    function buildRange(minDays, maxDays) {
      var anchor = getShipAnchor();
      var start = addBusinessDays(anchor, minDays);
      var end = addBusinessDays(anchor, maxDays);
      var startStr = formatShort(start);
      var endStr = formatShort(end);
      if (!startStr || !endStr) return '';
      return 'Estimated: ' + startStr + ' – ' + endStr;
    }

    // Calculate and populate
    try {
      if (standardTarget) {
        var stdRange = buildRange(stdMin, stdMax);
        if (stdRange) {
          standardTarget.textContent = stdRange;
          standardTarget.removeAttribute('hidden');
        }
      }
      if (expressTarget) {
        var expRange = buildRange(expMin, expMax);
        if (expRange) {
          expressTarget.textContent = expRange;
          expressTarget.removeAttribute('hidden');
        }
      }
    } catch (_) {
      // Static fallback remains — nothing to do
    }
  }

  for (var i = 0; i < wrappers.length; i++) {
    initInstance(wrappers[i]);
  }
})();
