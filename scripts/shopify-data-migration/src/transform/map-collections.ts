import { toSafeHandle } from '../utils/safe-handle.js';

export interface CollectionInput {
  title: string;
  handle: string;
  description?: string;
  feeling?: string;
  occasion?: string;
  product_handles?: string[];
  active?: boolean;
}

export interface CollectionOutput {
  input: CollectionInput;
  shopifyInput: {
    title: string;
    descriptionHtml?: string;
    handle: string;
  };
}

export function mapCollection(input: CollectionInput): CollectionOutput {
  const safeHandle = toSafeHandle(input.handle);

  return {
    input,
    shopifyInput: {
      title: input.title,
      descriptionHtml: input.description ?? undefined,
      handle: safeHandle,
    },
  };
}
