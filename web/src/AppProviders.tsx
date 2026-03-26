import type { PropsWithChildren } from 'react';
import { CartProvider } from './cart/CartContext';
import { UiLocaleProvider } from './i18n/ui-locale';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <UiLocaleProvider>
      <CartProvider>{children}</CartProvider>
    </UiLocaleProvider>
  );
}
