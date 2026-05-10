/**
 * HORO Recently Viewed — tracks product handles in localStorage and
 * renders a horizontal scroll strip on PDP.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'horo_recently_viewed_v1';
  const MAX_ITEMS = 12;

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
    const trimmed = handles.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }

  function addViewedHandle(handle) {
    if (!handle) return;
    const handles = readStorage().filter((h) => h !== handle);
    handles.unshift(handle);
    writeStorage(handles);
  }

  // Track current PDP product
  const currentProductHandle = window.HoroCurrentProductHandle || null;
  if (currentProductHandle) {
    addViewedHandle(currentProductHandle);
  }

  // Expose API
  window.HoroRecentlyViewed = {
    getAll: readStorage,
    add: addViewedHandle,
    clear() {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    },
  };
})();
