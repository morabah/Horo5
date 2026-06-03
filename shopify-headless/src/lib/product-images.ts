import type { ShopifyImage, ShopifyProduct } from "@/lib/shopify/types";

const UNSAFE_IMAGE_TOKENS = [
  "back",
  "rear",
  "backview",
  "back-view",
  "flat_lay",
  "flat-lay",
  "flat lay",
  "blank",
  "plain",
  "placeholder",
  "no-art",
  "no_art",
  "white-tee",
  "blank-shirt",
];

const FRONT_IMAGE_TOKENS = ["front", "design", "graphic", "print", "artwork"];
const LIFESTYLE_IMAGE_TOKENS = ["lifestyle", "fit", "model", "worn", "on-body", "on body"];
const DETAIL_IMAGE_TOKENS = ["detail", "close", "proof", "fabric"];

function probeImage(image: ShopifyImage | null | undefined): string {
  return `${image?.altText ?? ""} ${image?.url ?? ""}`.toLowerCase();
}

function hasAnyToken(probe: string, tokens: string[]): boolean {
  return tokens.some((token) => probe.includes(token));
}

export function isUnsafeShopifyProductImage(image: ShopifyImage | null | undefined): boolean {
  if (!image?.url?.trim()) return true;
  return hasAnyToken(probeImage(image), UNSAFE_IMAGE_TOKENS);
}

function scoreShopifyProductImage(image: ShopifyImage): number {
  const probe = probeImage(image);
  if (hasAnyToken(probe, FRONT_IMAGE_TOKENS)) return 100;
  if (hasAnyToken(probe, LIFESTYLE_IMAGE_TOKENS)) return 80;
  if (hasAnyToken(probe, DETAIL_IMAGE_TOKENS)) return 60;
  return 10;
}

export function pickShopifyCardImage(product: ShopifyProduct): ShopifyImage | null {
  const candidates = product.images.filter((image) => !isUnsafeShopifyProductImage(image));
  const [best] = candidates.sort((a, b) => scoreShopifyProductImage(b) - scoreShopifyProductImage(a));
  if (best) return best;
  return product.featuredImage && !isUnsafeShopifyProductImage(product.featuredImage)
    ? product.featuredImage
    : null;
}

export function pickShopifyPdpHeroImage(product: ShopifyProduct): ShopifyImage | null {
  return pickShopifyCardImage(product);
}

export function pickShopifyCartLineImage(image: ShopifyImage | null | undefined): ShopifyImage | null {
  return image && !isUnsafeShopifyProductImage(image) ? image : null;
}
