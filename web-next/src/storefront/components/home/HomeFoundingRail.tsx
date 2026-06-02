'use client';

import type { Product } from '../../data/catalog-types';
import { HomeFoundingProductCard } from './HomeFoundingProductCard';

const REVEAL_STAGGER = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5'] as const;

export function HomeFoundingRail({ products }: { products: Product[] }) {
  const railProducts = products.slice(0, 5);
  if (railProducts.length === 0) {
    return null;
  }

  return (
    <>
    {railProducts.length > 2 ? (
      <p className="home-founding-rail-hint font-body mb-2 text-center text-xs font-medium text-warm-charcoal/80 md:hidden" aria-hidden>
        Swipe for more pieces →
      </p>
    ) : null}
    <div className="home-founding-rail home-founding-grid">
      {railProducts.map((product, index) => (
        <HomeFoundingProductCard
          key={product.slug}
          product={product}
          eager={index < 2}
          data-reveal={REVEAL_STAGGER[index % REVEAL_STAGGER.length]}
        />
      ))}
    </div>
    </>
  );
}
