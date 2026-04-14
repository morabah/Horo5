import { StorefrontChrome } from "@/components/storefront-chrome";
import { Providers } from "../providers";

/** Checkout: skip Medusa `/storefront/catalog` entirely (server + client). Cart/order data is independent. */
export default function CheckoutShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const renderedAt = new Date().toISOString();

  return (
    <Providers initialCatalog={null} renderedAt={renderedAt} skipCatalogHydration>
      <StorefrontChrome>{children}</StorefrontChrome>
    </Providers>
  );
}
