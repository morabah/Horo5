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
  if (!product) return null;

  const artist = getArtist(product.artistSlug);

  return {
    ...line,
    key: cartLineKey(line),
    productName: product.name,
    productUrl: `/products/${product.slug}`,
    artistName: artist?.name,
    imageSrc: getProductMedia(product.slug).main,
    imageAlt: `HORO “${product.name}” tee shown for order reference.`,
    unitPriceEgp: product.priceEgp,
    linePriceEgp: product.priceEgp * line.qty,
  };
}

export function getCartLineViews(lines: CartLine[]): CartLineView[] {
  return lines.flatMap((line) => {
    const view = getCartLineView(line);
    return view ? [view] : [];
  });
}
