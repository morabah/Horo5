import { toSafeHandle } from '../utils/safe-handle.js';

export interface ProductVariantInput {
  option1: string; // size
  option2?: string; // color
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inventoryQuantity?: number;
}

export interface ProductInput {
  title: string;
  handle: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  vendor?: string;
  product_type?: string;
  tags?: string[];
  feeling?: string;
  subfeeling?: string;
  occasions?: string[];
  artist?: string;
  size_table?: string;
  pair_with_products?: string[];
  images?: string[];
  imageAlts?: string[];
  variants?: ProductVariantInput[];
  options?: string[]; // e.g. ['Size', 'Color']
  active?: boolean;
}

export interface ProductOutput {
  input: ProductInput;
  shopifyInput: {
    title: string;
    descriptionHtml?: string;
    vendor?: string;
    productType?: string;
    tags?: string[];
    status: 'ACTIVE' | 'DRAFT';
    variants?: Array<{
      price: string;
      compareAtPrice?: string;
      sku?: string;
      inventoryQuantities?: Array<{ locationId?: string; availableQuantity: number }>;
      options?: string[];
    }>;
    options?: string[];
  };
}

function buildOptions(variants: ProductVariantInput[] | undefined): string[] | undefined {
  if (!variants || variants.length === 0) return undefined;
  // Determine if we have color option
  const hasColor = variants.some((v) => v.option2);
  const options = ['Size'];
  if (hasColor) options.push('Color');
  return options;
}

export function mapProduct(input: ProductInput): ProductOutput {
  const safeHandle = toSafeHandle(input.handle);
  const options = buildOptions(input.variants);

  const shopifyVariants = input.variants?.map((v) => ({
    price: String(v.price),
    compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : undefined,
    sku: v.sku,
    inventoryQuantities: v.inventoryQuantity !== undefined
      ? [{ availableQuantity: v.inventoryQuantity }]
      : undefined,
    options: v.option2 ? [v.option1, v.option2] : [v.option1],
  }));

  return {
    input,
    shopifyInput: {
      title: input.title,
      descriptionHtml: input.description ?? undefined,
      vendor: input.vendor ?? 'HORO',
      productType: input.product_type ?? 'T-Shirt',
      tags: input.tags,
      status: input.active !== false ? 'ACTIVE' : 'DRAFT',
      variants: shopifyVariants,
      options,
    },
  };
}
