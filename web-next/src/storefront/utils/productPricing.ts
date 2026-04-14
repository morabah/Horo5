import type { Product, ProductSizeKey, ProductVariantRecord } from '../data/site';

const SIZE_ORDER: ProductSizeKey[] = ['S', 'M', 'L', 'XL', 'XXL'];

function sizeOrderIndex(size: string): number {
  const index = SIZE_ORDER.indexOf(size as ProductSizeKey);
  return index === -1 ? SIZE_ORDER.length : index;
}

export function orderedVariantEntries(product: Product): Array<[ProductSizeKey, ProductVariantRecord]> {
  const entries = Object.entries(product.variantsBySize || {}) as Array<
    [ProductSizeKey, ProductVariantRecord | undefined]
  >;

  return entries
    .filter((entry): entry is [ProductSizeKey, ProductVariantRecord] => Boolean(entry[1]))
    .sort(([leftSize], [rightSize]) => {
      const orderDiff = sizeOrderIndex(leftSize) - sizeOrderIndex(rightSize);
      return orderDiff !== 0 ? orderDiff : leftSize.localeCompare(rightSize);
    });
}

export function getDefaultPriceSelection(product: Product): {
  size: ProductSizeKey | null;
  variant: ProductVariantRecord | null;
} {
  const preferredSize = product.defaultPriceSize;

  if (preferredSize && product.variantsBySize?.[preferredSize]) {
    return {
      size: preferredSize,
      variant: product.variantsBySize[preferredSize] ?? null,
    };
  }

  const ordered = orderedVariantEntries(product);
  const available = ordered.find(([, variant]) => variant.available);
  if (available) {
    return { size: available[0], variant: available[1] };
  }

  const fallback = ordered[0];
  return fallback ? { size: fallback[0], variant: fallback[1] } : { size: null, variant: null };
}

export function getDisplayPriceSelection(
  product: Product,
  selectedSize: ProductSizeKey | null | undefined
): {
  isSelected: boolean;
  size: ProductSizeKey | null;
  variant: ProductVariantRecord | null;
} {
  if (selectedSize && product.variantsBySize?.[selectedSize]) {
    return {
      isSelected: true,
      size: selectedSize,
      variant: product.variantsBySize[selectedSize] ?? null,
    };
  }

  return {
    isSelected: false,
    ...getDefaultPriceSelection(product),
  };
}

export function compareAtPrice(priceEgp: number, originalPriceEgp?: number | null): number | null {
  if (typeof originalPriceEgp !== 'number') return null;
  return originalPriceEgp > priceEgp ? originalPriceEgp : null;
}

export function productHasVariablePricing(product: Product): boolean {
  return new Set(orderedVariantEntries(product).map(([, variant]) => variant.priceEgp)).size > 1;
}
