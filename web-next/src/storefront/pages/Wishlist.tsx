'use client';

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MerchProductCard } from '../components/MerchProductCard';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { ProductQuickView } from '../components/ProductQuickView';
import { useWishlist } from '../hooks/useWishlist';
import { getArtist, getFeeling, getProduct, productHasRealImage, setRuntimeCatalog, type RuntimeCatalog } from '../data/site';
import { getProductCardImageSrc } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';

type WishlistProps = {
  initialCatalog?: Partial<RuntimeCatalog> | null;
};

export function Wishlist({ initialCatalog }: WishlistProps) {
  if (initialCatalog) {
    setRuntimeCatalog(initialCatalog);
  }

  const { slugs } = useWishlist();
  const { locale, copy } = useUiLocale();
  const isArabic = locale === 'ar';
  const [quickViewSlug, setQuickViewSlug] = useState<string | null>(null);

  const cards = useMemo(() => {
    return slugs
      .map((slug) => getProduct(slug))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter((p) => p.slug && p.name?.trim() && p.priceEgp != null && productHasRealImage(p));
  }, [slugs]);

  return (
    <>
      <main className="min-h-[60vh] bg-papyrus px-4 pb-20 pt-10 md:px-8 md:pt-14">
        <div className="mx-auto max-w-6xl">
          <PageBreadcrumb
            className="mb-6"
            items={[
              { label: copy.shell.home, to: '/' },
              { label: isArabic ? 'قائمة الأمنيات' : 'Wishlist' },
            ]}
          />

          {/* Header */}
          <div className="mb-10 flex flex-col gap-2">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
              {isArabic ? 'المحفوظات' : 'Saved'}
            </p>
            <h1 className="font-headline text-3xl font-semibold tracking-tight text-obsidian md:text-4xl">
              {isArabic ? 'قائمة الأمنيات' : 'Wishlist'}
            </h1>
            {cards.length > 0 ? (
              <p className="font-body text-sm text-clay">
                {isArabic
                  ? `${cards.length} قطعة محفوظة`
                  : `${cards.length} saved piece${cards.length !== 1 ? 's' : ''}`}
              </p>
            ) : null}
          </div>

          {/* Grid or empty state */}
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
              {cards.map((p) => {
                const feelingSlug = p.primaryFeelingSlug ?? p.feelingSlug;
                const feeling = getFeeling(feelingSlug);
                const artistName =
                  p.artistDisplay?.name?.trim() || getArtist(p.artistSlug)?.name?.trim();
                const eyebrow = feeling?.name;
                const main = getProductCardImageSrc(p);

                return (
                  <MerchProductCard
                    key={p.slug}
                    slug={p.slug}
                    name={p.name}
                    compareAtPriceEgp={p.originalPriceEgp ?? undefined}
                    priceEgp={p.priceEgp}
                    imageSrc={main}
                    imageAlt={`HORO "${p.name}" graphic tee`}
                    promoLabel={p.promoLabel}
                    promoEndsAt={p.promoEndsAt}
                    promoShowCountdown={p.promoShowCountdown}
                    eyebrow={eyebrow}
                    artistCredit={artistName ? `Illustrated by ${artistName}` : undefined}
                    onQuickView={setQuickViewSlug}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyWishlist isArabic={isArabic} />
          )}
        </div>
      </main>

      <ProductQuickView
        open={quickViewSlug !== null}
        productSlug={quickViewSlug}
        onClose={() => setQuickViewSlug(null)}
      />
    </>
  );
}

function EmptyWishlist({ isArabic }: { isArabic: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      {/* Heart outline illustration */}
      <svg
        className="h-16 w-16 text-stone/50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>

      <div className="space-y-2">
        <h2 className="font-headline text-xl font-semibold text-obsidian">
          {isArabic ? 'لا يوجد شيء محفوظ بعد' : 'Nothing saved yet'}
        </h2>
        <p className="font-body max-w-xs text-sm leading-relaxed text-clay">
          {isArabic
            ? 'اضغط على القلب في أي قطعة لحفظها هنا.'
            : 'Tap the heart on any piece to save it here.'}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/feelings"
          className="font-label inline-flex min-h-12 items-center rounded-full border border-obsidian bg-obsidian px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-obsidian/85"
        >
          {isArabic ? 'تصفح حسب الإحساس' : 'Browse by feeling'}
        </Link>
        <Link
          to="/products"
          className="font-label inline-flex min-h-12 items-center rounded-full border border-obsidian/70 px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-obsidian/5"
        >
          {isArabic ? 'كل القطع' : 'All pieces'}
        </Link>
      </div>
    </div>
  );
}
