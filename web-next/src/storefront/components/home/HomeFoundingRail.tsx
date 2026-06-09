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
    <div className="home-founding-grid home-founding-grid--featured overflow-x-auto pb-2 md:overflow-visible md:pb-0" style={gridStyle}>
      {railProducts.map((product, index) => {
        return (
        <HomeFoundingProductCard
          key={product.slug}
          product={product}
          eager={index < 4}
        />
        );
      })}
      <HomeFoundingViewAllCard href={viewAllHref} label={viewAllLabel} />
    </div>
  );
}
