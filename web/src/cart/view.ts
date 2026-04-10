import type { CartLine } from './types';
import { cartLineKey } from './types';
import { getProductMedia } from '../data/images';
import { getArtist, getProduct } from '../data/site';

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

export function getCartLineView(line: CartLine): CartLineView | null {
  const product = getProduct(line.productSlug);
  if (!product && !line.productName) return null;

  const artist = product ? getArtist(product.artistSlug) : undefined;
  const unitPrice = line.unitPriceEgp ?? product?.priceEgp ?? 0;
  const productName = line.productName ?? product?.name ?? line.productSlug;
  const productUrl = product ? `/products/${product.slug}` : '/search';
  const imageSrc = line.imageSrc ?? (product ? getProductMedia(product.slug).main : '/images/hero/hero-model.png');

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

export function getCartLineViews(lines: CartLine[]): CartLineView[] {
  return lines.flatMap((line) => {
    const view = getCartLineView(line);
    return view ? [view] : [];
  });
}
