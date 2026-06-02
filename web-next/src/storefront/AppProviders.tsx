import { Suspense, type PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { setRuntimeCatalog, type RuntimeCatalog } from './data/site';
import { CartProvider } from './cart/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AddToCartToast } from './components/cart/AddToCartToast';
import { WhatsAppFloatingButton } from './components/WhatsAppFloatingButton';
import { UiLocaleProvider } from './i18n/ui-locale';
import { hydrateRuntimeCatalog } from './lib/medusa/catalog';
import { RenderTimeProvider } from './runtime/render-time';

const LAST_CATALOG_STORAGE_KEY = 'horo:lastCatalog';

export function AppProviders({
  children,
  initialCatalog,
  renderedAt,
  skipCatalogHydration,
}: PropsWithChildren<{
  initialCatalog?: Partial<RuntimeCatalog> | null;
  renderedAt?: string | null;
  /** Skip client-side catalog fetch (e.g. checkout does not need product catalog). */
  skipCatalogHydration?: boolean;
}>) {
  const [, setCatalogVersion] = useState(0);

  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  }

  /** Grace cache: restore last successful Medusa catalog for this tab before network completes. */
  useEffect(() => {
    if (skipCatalogHydration) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- skipCatalogHydration is constant per route
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
    if (skipCatalogHydration) return;
    // Only refetch when SSR catalog is fully missing. If the server delivered
    // *any* catalog data we trust it — a partial catalog is still usable and
    // avoids a redundant client→Medusa round-trip on every page load.
    if (initialCatalog) return;
    void hydrateRuntimeCatalog().then(() => {
      setCatalogVersion((value) => value + 1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- skipCatalogHydration is constant per route
  }, []);

  return (
    <RenderTimeProvider renderedAt={renderedAt}>
      <UiLocaleProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <AddToCartToast />
            <Suspense fallback={null}>
              <WhatsAppFloatingButton />
            </Suspense>
          </CartProvider>
        </WishlistProvider>
      </UiLocaleProvider>
    </RenderTimeProvider>
  );
}
