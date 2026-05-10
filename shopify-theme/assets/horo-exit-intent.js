/**
 * HORO Exit Intent Modal
 *
 * Triggers on desktop via mouseleave toward browser chrome (top 50px).
 * Triggers on mobile via beforeunload (limited support — mostly iOS Safari ignores it).
 * Respects sessionStorage if once_per_session is enabled.
 * Respects minimum page time before triggering.
 * Accessible: trap focus, ESC to close, return focus on close.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'horo_exit_intent_shown';

  function init() {
    var modal = document.querySelector('[data-exit-intent]');
    if (!modal) return;

    var oncePerSession = modal.getAttribute('data-once-per-session') === 'true';
    var delaySeconds = parseInt(modal.getAttribute('data-delay-seconds') || '10', 10);
    var closeButtons = modal.querySelectorAll('[data-exit-intent-close]');
    var copyButton = modal.querySelector('[data-exit-intent-copy]');
    var couponCode = modal.querySelector('[data-coupon]');
    var pageEnterTime = Date.now();
    var shown = false;

    function shouldShow() {
      if (shown) return false;
      if (oncePerSession && window.sessionStorage.getItem(STORAGE_KEY)) return false;
      var elapsedSeconds = (Date.now() - pageEnterTime) / 1000;
      if (elapsedSeconds < delaySeconds) return false;
      return true;
    }

    function show() {
      if (!shouldShow()) return;
      shown = true;
      if (oncePerSession) window.sessionStorage.setItem(STORAGE_KEY, '1');
      modal.hidden = false;
      modal.classList.add('horo-exit-intent--visible');
      document.body.style.overflow = 'hidden';
      trapFocus(modal);
    }

    function hide() {
      modal.classList.remove('horo-exit-intent--visible');
      modal.hidden = true;
      document.body.style.overflow = '';
      releaseFocus();
    }

    closeButtons.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        hide();
      });
    });

    if (copyButton && couponCode) {
      copyButton.addEventListener('click', function () {
        var code = couponCode.getAttribute('data-coupon');
        if (!code) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function () {
            var original = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(function () {
              copyButton.textContent = original;
            }, 2000);
          });
        } else {
          // Fallback
          var ta = document.createElement('textarea');
          ta.value = code;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          var original = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(function () {
            copyButton.textContent = original;
          }, 2000);
        }
      });
    }

    // Desktop: detect mouseleave toward top of viewport
    document.addEventListener('mouseleave', function (e) {
      if (e.clientY <= 10 && shouldShow()) {
        show();
      }
    });

    // Mobile: beforeunload (best-effort)
    window.addEventListener('beforeunload', function () {
      if (shouldShow()) {
        show();
      }
    });

    // Keyboard: ESC closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && shown) {
        hide();
      }
    });

    // Focus trap helpers
    var lastFocusedElement = null;
    function trapFocus(el) {
      lastFocusedElement = document.activeElement;
      var focusable = el.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) {
        focusable[0].focus();
      }
      el.addEventListener('keydown', focusTrapHandler);
    }

    function releaseFocus() {
      modal.removeEventListener('keydown', focusTrapHandler);
      if (lastFocusedElement) lastFocusedElement.focus();
    }

    function focusTrapHandler(e) {
      if (e.key !== 'Tab') return;
      var focusable = modal.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
