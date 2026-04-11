import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { setRuntimeCatalog, type RuntimeCatalog } from './data/site';
import { CartProvider } from './cart/CartContext';
import { UiLocaleProvider } from './i18n/ui-locale';
import { hydrateRuntimeCatalog } from './lib/medusa/catalog';
import { RenderTimeProvider } from './runtime/render-time';

const LAST_CATALOG_STORAGE_KEY = 'horo:lastCatalog';

export function AppProviders({
  children,
  initialCatalog,
  renderedAt,
}: PropsWithChildren<{ initialCatalog?: Partial<RuntimeCatalog> | null; renderedAt?: string | null }>) {
  const [, setCatalogVersion] = useState(0);

  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  }

  /** Grace cache: restore last successful Medusa catalog for this tab before network completes. */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_CATALOG_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<RuntimeCatalog>;
      if (
        (parsed.artists && parsed.artists.length > 0) ||
        (parsed.feelings && parsed.feelings.length > 0) ||
        (parsed.products && parsed.products.length > 0) ||
        (parsed.subfeelings && parsed.subfeelings.length > 0) ||
        (parsed.occasions && parsed.occasions.length > 0)
      ) {
        setRuntimeCatalog(parsed);
        setCatalogVersion((value) => value + 1);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    if (!initialCatalog) return;
    setRuntimeCatalog(initialCatalog);
    try {
      sessionStorage.setItem(LAST_CATALOG_STORAGE_KEY, JSON.stringify(initialCatalog));
    } catch {
      /* quota / private mode */
    }
    setCatalogVersion((value) => value + 1);
  }, [initialCatalog]);

  useEffect(() => {
    if (
      initialCatalog?.products?.length &&
      initialCatalog?.feelings?.length &&
      initialCatalog?.subfeelings?.length &&
      initialCatalog?.artists?.length
    ) {
      return;
    }
    void hydrateRuntimeCatalog().then(() => {
      setCatalogVersion((value) => value + 1);
    });
  }, [initialCatalog?.products?.length]);

  return (
    <RenderTimeProvider renderedAt={renderedAt}>
      <UiLocaleProvider>
        <CartProvider>{children}</CartProvider>
      </UiLocaleProvider>
    </RenderTimeProvider>
  );
}
