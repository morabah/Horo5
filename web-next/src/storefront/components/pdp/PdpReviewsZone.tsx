'use client';

import type { Product } from '../../data/catalog-types';

type ProductWithReviewsSummary = Product & {
  reviewsSummary?: {
    count?: number;
  };
};

export function PdpReviewsZone({ product }: { product: Product }) {
  const summary = (product as ProductWithReviewsSummary).reviewsSummary;
  if (!summary?.count) return null;

  return null;
}
