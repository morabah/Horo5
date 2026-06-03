'use client';

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

  return (
    <div className="home-founding-grid">
      {railProducts.map((product, index) => (
        <HomeFoundingProductCard
          key={product.slug}
          product={product}
          eager={index < 4}
        />
      ))}
      <HomeFoundingViewAllCard href={viewAllHref} label={viewAllLabel} />
    </div>
  );
}
