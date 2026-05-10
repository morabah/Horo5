'use client';

import type { Product } from '../../data/catalog-types';
import { useUiLocale } from '../../i18n/ui-locale';

type ProductWithReviewsSummary = Product & {
  reviewsSummary?: {
    count?: number;
    averageRating?: number;
    monthSoldCount?: number;
  };
};

function StarRating({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const fullStars = Math.floor(clamped);
  const hasHalf = clamped - fullStars >= 0.5;

  return (
    <span className="inline-flex items-center" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const isFull = i < fullStars;
        const isHalf = !isFull && hasHalf && i === fullStars;
        return (
          <svg
            key={i}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isFull || isHalf ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={isFull || isHalf ? 0 : 1.5}
            className="text-amber-500"
            aria-hidden="true"
          >
            {isHalf ? (
              <defs>
                <linearGradient id={`half-star-${i}`}>
                  <stop offset="50%" stopColor="currentColor" />
                  <stop offset="50%" stopColor="transparent" />
                </linearGradient>
              </defs>
            ) : null}
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={isHalf ? `url(#half-star-${i})` : undefined}
            />
          </svg>
        );
      })}
    </span>
  );
}

export function PdpReviewsZone({ product }: { product: Product }) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const summary = (product as ProductWithReviewsSummary).reviewsSummary;
  const reviewCount = summary?.count ?? 0;
  const avgRating = summary?.averageRating ?? 0;
  const monthSold = summary?.monthSoldCount ?? 0;

  const hasReviews = reviewCount > 0 && avgRating > 0;
  const hasSold = monthSold > 0;

  if (!hasReviews && !hasSold) return null;

  return (
    <section className="border-t border-stone/25 bg-papyrus">
      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-12 md:py-8">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {hasReviews ? (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} />
              <span className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                {isArabic
                  ? `${avgRating.toFixed(1)} / 5`
                  : `${avgRating.toFixed(1)} / 5`}
              </span>
              <span className="font-label text-[11px] font-medium tracking-[0.12em] text-clay">
                {isArabic
                  ? `(${reviewCount} تقييم)`
                  : `(${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`}
              </span>
            </div>
          ) : null}

          {hasSold ? (
            <span className="font-label text-[11px] font-medium uppercase tracking-[0.16em] text-warm-charcoal">
              {isArabic
                ? `تم بيع ${monthSold} ${monthSold === 1 ? 'قطعة' : 'قطع'} هذا الشهر`
                : `${monthSold} ${monthSold === 1 ? 'piece' : 'pieces'} bought this month`}
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
