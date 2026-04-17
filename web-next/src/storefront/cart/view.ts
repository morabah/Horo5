import type { CartLine } from './types';
import { cartLineKey } from './types';
import { getProductMedia, heroVectorizedV2 } from '../data/images';
import { getArtist, getProduct } from '../data/site';

/** Neutral mark when a Medusa order line has no thumbnail — avoids implying another SKU’s catalog art. */
const ORDER_LINE_IMAGE_PLACEHOLDER = '/images/hero/horo_vectorized_v2.svg';

function isLikelyRenderableImageSrc(src: string | null | undefined): src is string {
  const value = src?.trim();
  if (!value) return false;
  if (value.startsWith('data:image/')) return true;
  if (value.startsWith('blob:')) return true;
  if (value.startsWith('/')) return true;
  if (value.startsWith('http://') || value.startsWith('https://')) return true;
  return false;
}

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
  const linePriceEgp =
    typeof line.medusaLineTotalEgp === 'number' && line.medusaLineTotalEgp > 0
      ? line.medusaLineTotalEgp
      : unitPrice * line.qty;
  const productName = line.productName ?? product?.name ?? line.productSlug;
  const productUrl = product ? `/products/${product.slug}` : '/search';
  const productImageSrc = product ? getProductMedia(product.slug).main : null;
  const imageSrc =
    (productImageSrc && isLikelyRenderableImageSrc(productImageSrc) ? productImageSrc : null) ??
    (isLikelyRenderableImageSrc(line.imageSrc) ? line.imageSrc : null) ??
    (options?.orderConfirmation ? ORDER_LINE_IMAGE_PLACEHOLDER : heroVectorizedV2);

  return {
    ...line,
    key: cartLineKey(line),
    productName,
    productUrl,
    artistName: artist?.name,
    imageSrc,
    imageAlt: `HORO “${productName}” tee shown for order reference.`,
    unitPriceEgp: unitPrice,
    linePriceEgp,
  };
}

export function getCartLineViews(lines: CartLine[], options?: { orderConfirmation?: boolean }): CartLineView[] {
  return lines.flatMap((line) => {
    const view = getCartLineView(line, options);
    return view ? [view] : [];
  });
}
