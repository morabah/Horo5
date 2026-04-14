import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MerchProductCard } from './MerchProductCard';
import { ProductQuickView } from './ProductQuickView';
import { getProductMedia } from '../data/images';
import { getFeeling, getProduct, productHasRealImage } from '../data/site';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useUiLocale } from '../i18n/ui-locale';

type RecentlyViewedStripProps = {
  /** Hide current PDP product from the strip */
  excludeSlug?: string;
  className?: string;
};

export function RecentlyViewedStrip({ excludeSlug, className = '' }: RecentlyViewedStripProps) {
  const { slugs } = useRecentlyViewed();
  const { copy } = useUiLocale();
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const cards = useMemo(() => {
    return slugs
      .filter((s) => s !== excludeSlug)
      .map((slug) => getProduct(slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter((p) => productHasRealImage(p))
      .slice(0, 4);
  }, [excludeSlug, slugs]);

  if (cards.length === 0) return null;

  return (
    <>
      <section
        className={`border-t border-stone/25 bg-papyrus px-4 py-12 md:px-8 md:py-14 ${className}`.trim()}
        aria-labelledby="recently-viewed-heading"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">{copy.home.recentHeading}</p>
              <h2 id="recently-viewed-heading" className="font-headline mt-2 text-xl font-semibold tracking-tight text-obsidian md:text-2xl">
                Pick up where you left off
              </h2>
            </div>
            <Link
              to="/search"
              className="font-body inline-flex min-h-11 items-center text-sm font-medium text-deep-teal underline decoration-deep-teal/35 underline-offset-4"
            >
              {copy.home.recentCta}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
            {cards.map((p) => {
              const feeling = getFeeling(p.primaryFeelingSlug ?? p.feelingSlug);
              const main = p.media?.main ?? p.thumbnail ?? getProductMedia(p.slug).main;
              return (
                <MerchProductCard
                  key={p.slug}
                  slug={p.slug}
                  name={p.name}
                  compareAtPriceEgp={p.originalPriceEgp ?? undefined}
                  priceEgp={p.priceEgp}
                  imageSrc={main}
                  imageAlt={`HORO “${p.name}” graphic tee`}
                  merchandisingBadge={p.merchandisingBadge}
                  eyebrow={feeling?.name}
                  eyebrowAccent={feeling?.accent}
                  variant="minimal"
                  onQuickView={setQuickViewSlug}
                />
              );
            })}
          </div>
        </div>
      </section>
      <ProductQuickView open={quickViewSlug !== null} productSlug={quickViewSlug} onClose={() => setQuickViewSlug(null)} />
    </>
  );
}
