import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { CartProvider } from './cart/CartContext';
import { UiLocaleProvider } from './i18n/ui-locale';
import { hydrateRuntimeCatalog } from './lib/medusa/catalog';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    void hydrateRuntimeCatalog();
  }, []);

  return (
    <UiLocaleProvider>
      <CartProvider>{children}</CartProvider>
    </UiLocaleProvider>
  );
}
