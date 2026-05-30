/**
 * HORO Wishlist — localStorage persistence with web-next parity.
 * API: add(handle), remove(handle), has(handle), getAll(), toggle(handle)
 * Cross-component sync via CustomEvent + header badge counter.
 * Card injection for product grids (since card-product.liquid cannot be edited).
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'horo-wishlist-v1';
  const LEGACY_KEY = 'horo_wishlist_v1';
  const CLIENT_KEY = 'horo-wishlist-client-id';
  const EVENT_WISHLIST_CHANGE = 'horo:wishlist:change';
  const MAX_ITEMS = 50;

  function getWishlistApiUrl() {
    const cfg = window.__HORO_WISHLIST_CONFIG__ || {};
    const base = typeof cfg.apiBase === 'string' ? cfg.apiBase.trim().replace(/\/$/, '') : '';
    const path = typeof cfg.apiPath === 'string' && cfg.apiPath ? cfg.apiPath : '/api/wishlist';
    if (!base) return null;
    return base + (path.startsWith('/') ? path : '/' + path);
  }

  function getWishlistClientId() {
    try {
      let id = localStorage.getItem(CLIENT_KEY);
      if (!id) {
        id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : 'wl-' + Date.now() + '-' + Math.random().toString(36).slice(2);
        localStorage.setItem(CLIENT_KEY, id);
      }
      return id;
    } catch {
      return '';
    }
  }

  function fetchServerHandles() {
    const apiUrl = getWishlistApiUrl();
    const clientId = getWishlistClientId();
    if (!apiUrl || !clientId) return Promise.resolve(null);

    return fetch(apiUrl, {
      method: 'GET',
      headers: { 'x-horo-wishlist-client': clientId },
      cache: 'no-store',
    })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        return data && Array.isArray(data.slugs) ? data.slugs : [];
      })
      .catch(function () {
        return null;
      });
  }

  function syncHandleToServer(handle, add) {
    const apiUrl = getWishlistApiUrl();
    const clientId = getWishlistClientId();
    if (!apiUrl || !clientId || !handle) return;

    fetch(apiUrl, {
      method: add ? 'POST' : 'DELETE',
      headers: {
        'content-type': 'application/json',
        'x-horo-wishlist-client': clientId,
      },
      body: JSON.stringify({ product_slug: handle }),
    }).catch(function () {
      /* localStorage remains source of truth offline */
    });
  }
  const SELECTOR_CARD_LINK = '.card__information a[href*="/products/"], .card-product a[href*="/products/"], a.card-product__link[href*="/products/"]';
  /** Outer product card only — do not include `.card` (nested) or each product gets two hearts. */
  const SELECTOR_CARD_WRAPPER = '.card-wrapper, .product-card-wrapper';

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function migrateLegacyKey() {
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (!legacy) return;
      const existing = localStorage.getItem(STORAGE_KEY);
      if (existing) return; // already migrated
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {
      /* ignore */
    }
  }

  function writeStorage(handles) {
    const unique = [...new Set(handles)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    dispatchChange(unique);
    updateHeaderBadge(unique.length);
    return unique;
  }

  function dispatchChange(handles) {
    window.dispatchEvent(
      new CustomEvent(EVENT_WISHLIST_CHANGE, {
        detail: { handles, count: handles.length },
      })
    );
  }

  function updateHeaderBadge(count) {
    document.querySelectorAll('[data-horo-wishlist-badge]').forEach((badge) => {
      badge.textContent = count > 0 ? String(count) : '';
      badge.classList.toggle('horo-wishlist-badge--active', count > 0);
      badge.setAttribute('aria-label', count > 0 ? `${count} items in wishlist` : 'Wishlist');
    });
  }

  const Wishlist = {
    getAll() {
      return readStorage();
    },

    has(handle) {
      return readStorage().includes(handle);
    },

    add(handle) {
      const handles = readStorage();
      if (!handles.includes(handle)) {
        const next = [handle].concat(handles).slice(0, MAX_ITEMS);
        syncHandleToServer(handle, true);
        return writeStorage(next);
      }
      return handles;
    },

    remove(handle) {
      const handles = readStorage().filter((h) => h !== handle);
      syncHandleToServer(handle, false);
      return writeStorage(handles);
    },

    toggle(handle) {
      if (this.has(handle)) {
        this.remove(handle);
        return false;
      }
      this.add(handle);
      return true;
    },

    clear() {
      return writeStorage([]);
    },
  };

  // Expose globally for inline onclick and other scripts
  window.HoroWishlist = Wishlist;

  // Header badge: init on load
  updateHeaderBadge(readStorage().length);

  // Listen for changes from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const handles = readStorage();
      dispatchChange(handles);
      updateHeaderBadge(handles.length);
      refreshButtonStates();
    }
  });

  // Refresh all wishlist button states
  function refreshButtonStates() {
    document.querySelectorAll('[data-horo-wishlist-btn]').forEach((btn) => {
      const handle = btn.dataset.horoWishlistBtn;
      const isActive = Wishlist.has(handle);
      btn.classList.toggle('horo-wishlist-btn--active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
      btn.setAttribute('aria-label', isActive ? 'Remove from wishlist' : 'Add to wishlist');
    });
  }

  // Handle wishlist button clicks (delegated)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-horo-wishlist-btn]');
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const handle = btn.dataset.horoWishlistBtn;
    const added = Wishlist.toggle(handle);

    btn.classList.toggle('horo-wishlist-btn--active', added);
    btn.setAttribute('aria-pressed', String(added));
    btn.setAttribute('aria-label', added ? 'Remove from wishlist' : 'Add to wishlist');

    // Optional: micro-animation
    if (added) {
      btn.classList.add('horo-wishlist-btn--pulse');
      setTimeout(() => btn.classList.remove('horo-wishlist-btn--pulse'), 400);
    }

    // Analytics
    if (window.dataLayer) {
      window.dataLayer.push({
        event: added ? 'horo_wishlist_add' : 'horo_wishlist_remove',
        product_handle: handle,
      });
    }
  });

  function removeDuplicateWishlistButtons() {
    document.querySelectorAll(SELECTOR_CARD_WRAPPER).forEach((wrapper) => {
      const buttons = wrapper.querySelectorAll('[data-horo-wishlist-btn]');
      for (let i = 1; i < buttons.length; i += 1) {
        buttons[i].remove();
      }
    });
  }

  // Inject wishlist buttons into product cards (one per card-wrapper)
  function injectCardButtons() {
    const cards = document.querySelectorAll(SELECTOR_CARD_WRAPPER);
    cards.forEach((wrapper) => {
      if (wrapper.dataset.horoWishlistCard === 'true') return;
      if (wrapper.querySelector('[data-horo-wishlist-btn]')) {
        wrapper.dataset.horoWishlistCard = 'true';
        return;
      }

      const link = wrapper.querySelector('a[href*="/products/"]');
      if (!link) return;

      const match = link.getAttribute('href').match(/\/products\/([^?/]+)/);
      if (!match) return;
      const handle = match[1];

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'horo-wishlist-btn';
      btn.dataset.horoWishlistBtn = handle;
      btn.setAttribute('aria-label', 'Add to wishlist');
      btn.setAttribute('aria-pressed', String(Wishlist.has(handle)));
      if (Wishlist.has(handle)) {
        btn.classList.add('horo-wishlist-btn--active');
      }

      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      `;

      const media = wrapper.querySelector('.card__media');
      if (media) {
        media.style.position = 'relative';
        btn.classList.add('horo-wishlist-btn--overlay');
        media.appendChild(btn);
      } else {
        const inner = wrapper.querySelector('.card');
        const target = inner || wrapper;
        target.style.position = 'relative';
        btn.classList.add('horo-wishlist-btn--overlay');
        target.appendChild(btn);
      }

      wrapper.dataset.horoWishlistCard = 'true';
    });

    removeDuplicateWishlistButtons();
  }

  // Inject wishlist icon into header (next to cart)
  function injectHeaderWishlist() {
    const headerIcons = document.querySelector('.header__icons, [data-header-icons]');
    if (!headerIcons) return;
    if (headerIcons.querySelector('.horo-header-wishlist')) return;

    const cartLink = headerIcons.querySelector('a[href="/cart"], .header__icon--cart');
    const wishlistUrl = '/pages/wishlist';

    const el = document.createElement('a');
    el.href = wishlistUrl;
    el.className = 'horo-header-wishlist header__icon link focus-inset';
    el.setAttribute('aria-label', 'Wishlist');
    el.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span class="horo-wishlist-badge" data-horo-wishlist-badge aria-label="Wishlist"></span>
    `;

    if (cartLink && cartLink.parentNode) {
      cartLink.parentNode.insertBefore(el, cartLink);
    } else {
      headerIcons.appendChild(el);
    }
  }

  function injectSoldOutNotify() {
    document.querySelectorAll(SELECTOR_CARD_WRAPPER).forEach((wrapper) => {
      if (wrapper.querySelector('[data-horo-notify-btn]')) return;
      if (!wrapper.querySelector('.price--sold-out, .badge--sold-out')) return;

      const link = wrapper.querySelector('a[href*="/products/"]');
      if (!link) return;

      const notify = document.createElement('a');
      notify.href = `${link.getAttribute('href').split('#')[0]}#notify`;
      notify.className = 'horo-notify-btn button button--secondary';
      notify.dataset.horoNotifyBtn = 'true';
      notify.textContent = 'Notify me';
      notify.setAttribute('aria-label', 'Notify when available');

      const info = wrapper.querySelector('.card__information, .card-information');
      if (info) {
        info.appendChild(notify);
      } else {
        wrapper.appendChild(notify);
      }
    });
  }

  // Inject savings chip on product cards
  function injectSavingsChips() {
    document.querySelectorAll('.price, .price__sale, .card-information .price').forEach((priceEl) => {
      if (priceEl.querySelector('.horo-savings-chip')) return;

      const regular = priceEl.querySelector('.price-item--regular');
      const sale = priceEl.querySelector('.price-item--sale');
      const compareAt = priceEl.querySelector('.price-item--regular.price-item--compare');

      // Dawn patterns: compare_at_price may be in a different element
      const compareEl = compareAt || priceEl.querySelector('.price__compare');
      const saleEl = sale || priceEl.querySelector('.price__sale');

      if (!compareEl || !saleEl) return;

      const compareText = compareEl.textContent || '';
      const saleText = saleEl.textContent || '';

      const compareNum = parseFloat(compareText.replace(/[^0-9.]/g, ''));
      const saleNum = parseFloat(saleText.replace(/[^0-9.]/g, ''));

      if (!compareNum || !saleNum || saleNum >= compareNum) return;

      const percent = Math.round(((compareNum - saleNum) / compareNum) * 100);
      if (percent <= 0) return;

      const chip = document.createElement('span');
      chip.className = 'horo-savings-chip';
      chip.textContent = `Save ${percent}%`;
      priceEl.appendChild(chip);
    });
  }

  // Run injection after DOM ready and on section re-renders
  function hydrateFromServer() {
    fetchServerHandles().then(function (remote) {
      if (!remote || !remote.length) return;
      const local = readStorage();
      const merged = [];
      remote.forEach(function (slug) {
        if (merged.indexOf(slug) === -1) merged.push(slug);
      });
      local.forEach(function (slug) {
        if (merged.indexOf(slug) === -1) merged.push(slug);
      });
      writeStorage(merged.slice(0, MAX_ITEMS));
      refreshButtonStates();
    });
  }

  function init() {
    migrateLegacyKey();
    injectHeaderWishlist();
    injectCardButtons();
    injectSavingsChips();
    injectSoldOutNotify();
    refreshButtonStates();
    updateHeaderBadge(readStorage().length);
    hydrateFromServer();
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init after Shopify section re-renders (editor + dynamic sections)
  document.addEventListener('shopify:section:load', () => {
    setTimeout(init, 0);
  });
  document.addEventListener('shopify:block:select', () => {
    setTimeout(init, 0);
  });

  // Expose refresh for wishlist page
  window.HoroWishlistRefresh = refreshButtonStates;
})();
