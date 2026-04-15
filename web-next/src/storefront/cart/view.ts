import type { CartLine } from './types';
import { cartLineKey } from './types';
import { getProductMedia } from '../data/images';
import { getArtist, getProduct } from '../data/site';

/** Neutral mark when a Medusa order line has no thumbnail — avoids implying another SKU’s catalog art. */
const ORDER_LINE_IMAGE_PLACEHOLDER = '/images/hero/horo_vectorized_v2.svg';

export type CartLineView = CartLine & {
  key: string;
  productName: string;
  productUrl: string;
  artistName?: string;
  imageSrc: string;
  imageAlt: string;
  unitPriceEgp: number;
  linePriceEgp: number;
};

export function getCartLineView(
  line: CartLine,
  options?: { orderConfirmation?: boolean },
): CartLineView | null {
  const product = getProduct(line.productSlug);
  if (!product && !line.productName) return null;

  const artist = product ? getArtist(product.artistSlug) : undefined;
  const unitPrice = line.unitPriceEgp ?? product?.priceEgp ?? 0;
  const productName = line.productName ?? product?.name ?? line.productSlug;
  const productUrl = product ? `/products/${product.slug}` : '/search';
  const hasLineThumb = Boolean(line.imageSrc?.trim());
  const imageSrc = hasLineThumb
    ? line.imageSrc!
    : options?.orderConfirmation
      ? ORDER_LINE_IMAGE_PLACEHOLDER
      : product
        ? getProductMedia(product.slug).main
        : '/images/hero/hero-model.png';

  return {
    ...line,
    key: cartLineKey(line),
    productName,
    productUrl,
    artistName: artist?.name,
    imageSrc,
    imageAlt: `HORO “${productName}” tee shown for order reference.`,
    unitPriceEgp: unitPrice,
    linePriceEgp: unitPrice * line.qty,
  };
}

export function getCartLineViews(lines: CartLine[], options?: { orderConfirmation?: boolean }): CartLineView[] {
  return lines.flatMap((line) => {
    const view = getCartLineView(line, options);
    return view ? [view] : [];
  });
}
