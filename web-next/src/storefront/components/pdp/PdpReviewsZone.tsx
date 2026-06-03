'use client';

import Link from 'next/link';

import type { Product } from '../../data/catalog-types';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, withSupportMessage } from '../../data/support-channels';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { buildPdpWhatsAppSupportMessage } from '../../utils/pdpWhatsApp';

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

function PdpEarlyReviewsPlaceholder({ product }: { product: Product }) {
  const { locale } = useUiLocale();
  const { pdp: copy } = useDictionary();
  const isArabic = locale === 'ar';
  const lang = isArabic ? 'ar' : 'en';
  const whatsappBase = HORO_SUPPORT_CHANNELS.whatsappSupportUrl;
  const whatsappHref = isConfiguredExternalUrl(whatsappBase)
    ? withSupportMessage(whatsappBase, buildPdpWhatsAppSupportMessage({ productName: product.name, locale: lang }))
    : null;
  const instagramHref = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;

  return (
    <div className="rounded-2xl border border-dashed border-stone/50 bg-white/50 px-5 py-6 md:px-8">
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-horo-pulse">
        {isArabic ? 'تقييمات مبكرة' : 'Early reviews'}
      </p>
      <h3 className="font-headline mt-2 text-lg font-semibold tracking-tight text-obsidian">
        {copy.reviewsSoonTitle}
      </h3>
      <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal">{copy.reviewsSoonBody}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="font-label inline-flex min-h-11 items-center justify-center rounded-full border border-stone/60 bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
          >
            {copy.reviewsSoonWhatsappCta}
          </a>
        ) : null}
        {instagramHref ? (
          <a
            href={instagramHref}
            target="_blank"
            rel="noreferrer"
            className="font-label inline-flex min-h-11 items-center justify-center rounded-full border border-stone/60 bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
          >
            {copy.reviewsSoonInstagramCta}
          </a>
        ) : null}
        {!whatsappHref && !instagramHref ? (
          <p className="font-body text-xs text-clay">{copy.reviewsSoonNoLinks}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PdpReviewsZone({ product }: { product: Product }) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const summary = (product as ProductWithReviewsSummary).reviewsSummary;
  const reviewCount = summary?.count ?? 0;
  const avgRating = summary?.averageRating ?? 0;
  const monthSold = summary?.monthSoldCount ?? 0;
  const proof = (product.reviewProof ?? []).filter((review) => (
    review.body.trim() ||
    review.fitFeedback?.trim() ||
    review.giftFeedback?.trim() ||
    (review.permissionToRepost && (review.photoUrl || review.videoUrl))
  ));

  const hasReviews = reviewCount > 0 && avgRating > 0;
  const hasSold = monthSold > 0;
  const hasProof = proof.length > 0;
  const showEarlyPlaceholder = !hasReviews && !hasProof;

  if (!hasReviews && !hasSold && !hasProof && !showEarlyPlaceholder) return null;

  return (
    <section className="border-t border-stone/25 bg-papyrus" aria-labelledby="pdp-reviews-zone-title">
      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-12 md:py-8">
        <h2 id="pdp-reviews-zone-title" className="sr-only">
          {isArabic ? 'التقييمات' : 'Reviews'}
        </h2>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {hasReviews ? (
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} />
              <span className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                {avgRating.toFixed(1)} / 5
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

        {hasProof ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {proof.slice(0, 3).map((review) => (
              <article key={review.id} className="border border-stone/20 bg-ivory px-4 py-3">
                {review.permissionToRepost && review.photoUrl ? (
                  <img
                    src={review.photoUrl}
                    alt={isArabic ? 'صورة عميل حقيقية بعد الموافقة' : 'Approved customer photo'}
                    className="mb-3 aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                ) : null}
                {review.permissionToRepost && review.videoUrl ? (
                  <Link
                    href={review.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 block font-label text-[11px] font-semibold uppercase tracking-[0.14em] text-obsidian underline"
                  >
                    {isArabic ? 'فيديو العميل' : 'Customer video'}
                  </Link>
                ) : null}
                {review.body ? (
                  <p className="font-body text-sm leading-6 text-warm-charcoal">{review.body}</p>
                ) : null}
                {review.fitFeedback ? (
                  <p className="mt-2 font-label text-[11px] font-medium uppercase tracking-[0.14em] text-clay">
                    {isArabic ? 'مقاس' : 'Fit'}: {review.fitFeedback}
                  </p>
                ) : null}
                {review.giftFeedback ? (
                  <p className="mt-1 font-label text-[11px] font-medium uppercase tracking-[0.14em] text-clay">
                    {isArabic ? 'هدية' : 'Gift'}: {review.giftFeedback}
                  </p>
                ) : null}
                {review.instagramHandle && review.permissionToRepost ? (
                  <p className="mt-2 font-label text-[10px] font-medium uppercase tracking-[0.14em] text-clay">
                    {review.instagramHandle}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {showEarlyPlaceholder ? (
          <div className={hasSold ? 'mt-6' : 'mt-4'}>
            <PdpEarlyReviewsPlaceholder product={product} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
