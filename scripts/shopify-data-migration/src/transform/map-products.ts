import { toSafeHandle } from '../utils/safe-handle.js';

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
  };
}

export function mapProduct(input: ProductInput): ProductOutput {
  const safeHandle = toSafeHandle(input.handle);

  return {
    input,
    shopifyInput: {
      title: input.title,
      descriptionHtml: input.description ?? undefined,
      vendor: input.vendor ?? 'HORO',
      productType: input.product_type ?? 'T-Shirt',
      tags: input.tags,
      status: input.active !== false ? 'ACTIVE' : 'DRAFT',
    },
  };
}
