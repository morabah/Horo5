'use client';

import type { CSSProperties } from 'react';

import type { Product } from '../../data/catalog-types';
import { HomeFoundingProductCard } from './HomeFoundingProductCard';
import { HomeFoundingViewAllCard } from './HomeFoundingViewAllCard';

export function HomeFoundingRail({
  products,
  viewAllHref,
  viewAllLabel,
}: {
  products: Product[];
  viewAllHref: string;
  viewAllLabel: string;
}) {
  const railProducts = products.slice(0, 5);
  if (railProducts.length === 0) {
    return null;
  }

  const productCount = railProducts.length;
  const gridStyle = {
    '--founding-cols': Math.min(productCount, 2),
    '--founding-cols-md': Math.min(productCount, 3),
    '--founding-cols-lg': productCount,
  } as CSSProperties;

  return (
    <div className="home-founding-grid" style={gridStyle}>
      {railProducts.map((product, index) => {
        const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const)[index % 5];
        return (
        <HomeFoundingProductCard
          key={product.slug}
          product={product}
          eager={index < 4}
          data-reveal={reveal}
        />
        );
      })}
      <HomeFoundingViewAllCard href={viewAllHref} label={viewAllLabel} />
    </div>
  );
}
