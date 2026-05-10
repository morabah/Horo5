/**
 * HORO Wishlist — localStorage persistence with web-next parity.
 * API: add(handle), remove(handle), has(handle), getAll(), toggle(handle)
 * Cross-component sync via CustomEvent + header badge counter.
 * Card injection for product grids (since card-product.liquid cannot be edited).
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'horo_wishlist_v1';
  const EVENT_WISHLIST_CHANGE = 'horo:wishlist:change';
  const SELECTOR_CARD_LINK = '.card__information a[href*="/products/"], .card-product a[href*="/products/"], a.card-product__link[href*="/products/"]';
  const SELECTOR_CARD_WRAPPER = '.card-wrapper, .product-card-wrapper, .card';

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
        handles.push(handle);
        return writeStorage(handles);
      }
      return handles;
    },

    remove(handle) {
      const handles = readStorage().filter((h) => h !== handle);
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

  // Inject wishlist buttons into product cards
  function injectCardButtons() {
    const cards = document.querySelectorAll(SELECTOR_CARD_WRAPPER);
    cards.forEach((card) => {
      // Skip if already injected
      if (card.querySelector('[data-horo-wishlist-btn]')) return;

      // Find product link to extract handle
      const link = card.querySelector('a[href*="/products/"]');
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

      // Append to card media area if present, otherwise to card root
      const media = card.querySelector('.card__media, .card-media, .media');
      if (media) {
        media.style.position = 'relative';
        btn.classList.add('horo-wishlist-btn--overlay');
        media.appendChild(btn);
      } else {
        card.appendChild(btn);
      }
    });
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
  function init() {
    injectHeaderWishlist();
    injectCardButtons();
    injectSavingsChips();
    refreshButtonStates();
    updateHeaderBadge(readStorage().length);
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
