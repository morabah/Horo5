/**
 * HORO Header interactivity
 * - Mobile drawer toggle (focus trap + Escape to close)
 * - Search expand / clear
 * - UI-only locale toggle (when Shopify Markets has 1 language)
 */
(function () {
  'use strict';

  /* --- Drawer --- */
  const drawerWrappers = document.querySelectorAll('[data-horo-drawer]');
  drawerWrappers.forEach(function (wrapper) {
    const trigger = wrapper.querySelector('[data-horo-drawer-trigger]');
    const panel = wrapper.querySelector('[data-horo-drawer-panel]');
    const closeBtn = wrapper.querySelector('[data-horo-drawer-close]');
    const overlay = wrapper.querySelector('[data-horo-drawer-overlay]');
    if (!trigger || !panel) return;

    function openDrawer() {
      panel.hidden = false;
      wrapper.classList.add('is-open');
      // Small delay to allow display:block to apply before adding transition class
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.classList.add('is-open');
        });
      });
      trigger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      // Focus first focusable element in panel
      setTimeout(function () {
        const first = panel.querySelector('a, button, input, [tabindex]:not([tabindex="-1"])');
        if (first) first.focus();
      }, 50);
    }

    function closeDrawer() {
      panel.classList.remove('is-open');
      wrapper.classList.remove('is-open');
      setTimeout(function () {
        panel.hidden = true;
      }, 300);
      trigger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      trigger.focus();
    }

    trigger.addEventListener('click', function () {
      if (wrapper.classList.contains('is-open')) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // Escape key
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
      }
    });

    // Focus trap
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });

  /* --- Search toggle (desktop) --- */
  const searchWrappers = document.querySelectorAll('[data-horo-search]');
  searchWrappers.forEach(function (wrapper) {
    const trigger = wrapper.querySelector('[data-horo-search-trigger]');
    const form = wrapper.querySelector('form');
    const input = wrapper.querySelector('input[type="search"]');
    const clearBtn = wrapper.querySelector('[data-horo-search-clear]');
    if (!trigger || !form) return;

    trigger.addEventListener('click', function () {
      form.hidden = false;
      form.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      if (input) input.focus();
    });

    // Close search when clicking outside
    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) {
        form.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        setTimeout(function () {
          if (!form.classList.contains('is-open')) form.hidden = true;
        }, 500);
      }
    });

    if (input) {
      input.addEventListener('input', function () {
        if (clearBtn) {
          clearBtn.hidden = input.value.length === 0;
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (input) {
          input.value = '';
          input.focus();
        }
        clearBtn.hidden = true;
      });
    }
  });

  /* --- UI-only locale toggle (when native form absent) --- */
  const localePills = document.querySelectorAll('[data-horo-locale]');
  localePills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      const locale = pill.getAttribute('data-horo-locale');
      if (!locale) return;

      // Update HTML lang/dir
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';

      // Persist
      try {
        localStorage.setItem('horo-ui-locale', locale);
      } catch (e) {
        /* ignore */
      }

      // Update URL param (no reload)
      const url = new URL(window.location.href);
      url.searchParams.set('uiLocale', locale);
      window.history.replaceState(window.history.state, '', url.toString());

      // Swap visible pill states
      const parent = pill.closest('.horo-locale-pills');
      if (parent) {
        parent.querySelectorAll('[data-horo-locale]').forEach(function (btn) {
          btn.classList.remove('horo-locale-pill--active');
          btn.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('horo-locale-pill--active');
        pill.setAttribute('aria-pressed', 'true');
      }

      // Trigger localized text swap
      document.dispatchEvent(new CustomEvent('horo:localechange', { detail: { locale: locale } }));
    });
  });

  // On load: read ?uiLocale or localStorage and apply without reload
  (function initLocale() {
    const params = new URLSearchParams(window.location.search);
    const paramLocale = params.get('uiLocale');
    let storedLocale = null;
    try {
      storedLocale = localStorage.getItem('horo-ui-locale');
    } catch (e) {
      /* ignore */
    }
    const resolved = paramLocale || storedLocale;
    if (!resolved) return;
    if (resolved !== document.documentElement.lang) {
      document.documentElement.lang = resolved;
      document.documentElement.dir = resolved === 'ar' ? 'rtl' : 'ltr';
      // Update active pill if UI-only mode
      document.querySelectorAll('[data-horo-locale="' + resolved + '"]').forEach(function (pill) {
        pill.classList.add('horo-locale-pill--active');
        pill.setAttribute('aria-pressed', 'true');
        const siblings = pill.closest('.horo-locale-pills');
        if (siblings) {
          siblings.querySelectorAll('[data-horo-locale]:not([data-horo-locale="' + resolved + '"])').forEach(function (btn) {
            btn.classList.remove('horo-locale-pill--active');
            btn.setAttribute('aria-pressed', 'false');
          });
        }
      });
    }
  })();

  /* --- Homepage: transparent header over cinematic hero --- */
  (function initHomeHeroHeader() {
    if (!document.body.classList.contains('template-index')) return;

    const sentinel = document.getElementById('home-hero-bottom-sentinel');
    const wrapper = document.querySelector('.horo-header-wrapper--home');
    if (!sentinel || !wrapper) return;

    wrapper.classList.add('horo-header-wrapper--over-hero');

    const setScrolled = function (scrolled) {
      wrapper.classList.toggle('horo-header-wrapper--scrolled', scrolled);
    };

    if (typeof IntersectionObserver === 'undefined') {
      setScrolled(true);
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        const entry = entries[0];
        setScrolled(!entry || !entry.isIntersecting);
      },
      { root: null, rootMargin: '0px', threshold: 0 }
    );

    observer.observe(sentinel);
  })();
})();
