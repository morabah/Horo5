/**
 * HORO Launch Countdown
 *
 * Reads target datetime from data attribute. Updates every second.
 * Hides when expired and optionally shows ended message.
 * Uses Cairo timezone. No fake urgency.
 */
(function () {
  'use strict';

  var INTERVAL_MS = 1000;

  function pad(n) {
    return n < 10 ? '0' + n : n;
  }

  function getTimeParts(ms) {
    if (ms <= 0) return null;
    var days = Math.floor(ms / (1000 * 60 * 60 * 24));
    var hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return { days: days, hours: hours, minutes: minutes, seconds: seconds };
  }

  function initInstance(container) {
    var launchAtAttr = container.getAttribute('data-launch-at');
    if (!launchAtAttr) return;

    var displayEl = container.querySelector('[data-countdown-display]');
    var daysEl = container.querySelector('[data-countdown-days]');
    var hoursEl = container.querySelector('[data-countdown-hours]');
    var minutesEl = container.querySelector('[data-countdown-minutes]');
    var secondsEl = container.querySelector('[data-countdown-seconds]');
    var endedEl = container.querySelector('[data-countdown-ended]');

    if (!displayEl) return;

    var target = new Date(launchAtAttr).getTime();
    if (isNaN(target)) return;

    function tick() {
      var now = Date.now();
      var remaining = target - now;
      var parts = getTimeParts(remaining);

      if (!parts) {
        // Expired
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minutesEl) minutesEl.textContent = '00';
        if (secondsEl) secondsEl.textContent = '00';
        if (endedEl) endedEl.hidden = false;
        displayEl.setAttribute('aria-live', 'off');
        return false; // stop interval
      }

      if (daysEl) daysEl.textContent = String(parts.days);
      if (hoursEl) hoursEl.textContent = pad(parts.hours);
      if (minutesEl) minutesEl.textContent = pad(parts.minutes);
      if (secondsEl) secondsEl.textContent = pad(parts.seconds);
      return true;
    }

    tick();
    var timer = setInterval(function () {
      if (!tick()) clearInterval(timer);
    }, INTERVAL_MS);
  }

  function init() {
    var containers = document.querySelectorAll('[data-launch-countdown]');
    containers.forEach(initInstance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
