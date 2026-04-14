import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'horo-recently-viewed-v1';
const MAX_ITEMS = 8;

function loadSlugs(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  // Empty on SSR and first client paint so markup matches; hydrate from storage after mount.
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    setSlugs(loadSlugs());
  }, []);

  const recordView = useCallback((slug: string) => {
    setSlugs((prev) => {
      const safe = Array.isArray(prev) ? prev : [];
      const base = safe.length > 0 ? safe : loadSlugs();
      const next = [slug, ...base.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota / private mode */
      }
      return next;
    });
  }, []);

  return { slugs, recordView };
}
