import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { useWishlist } from '../hooks/useWishlist';

import { useCart } from '../cart/CartContext';
import { formatCartStockMessage } from '../cart/stock';
import { trackSizeSelected, trackWishlistAdd, trackWishlistRemove } from '../analytics/events';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, PDP_SCHEMA } from '../data/domain-config';
import { getOccasions, getProduct, type Product, type ProductSizeKey } from '../data/site';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';
import { productAvailableSizes } from '../utils/productSizes';
import { deriveProductStockStatus } from '../utils/productStock';
import { StockStatusChip } from './StockStatusChip';
import { QuickViewTrigger } from './QuickViewTrigger';
import { NotifyWhenAvailableButton } from './NotifyWhenAvailableButton';
import { TeeImageFrame } from './TeeImage';
import {
  getConversionProductCardImageSrc,
  getProductCardHoverImageSrc,
  shouldUseConversionReferenceImage,
} from '../data/images';
import { formatEgp } from '../utils/formatPrice';
import { pickLocalizedText } from '../lib/storefront/incentives-client';

type MerchProductCardProps = {
  slug: string;
  name: string;
  priceEgp: number;
  imageSrc: string;
  imageAlt: string;
  /** Overrides catalog `product.promoLabel` when the card is driven by a server list (e.g. search). */
  promoLabel?: Product['promoLabel'];
  /** ISO-8601 promo deadline — drives countdown below the price. Overrides catalog value. */
  promoEndsAt?: string;
  /** False hides the countdown chip while keeping the label and strike-through price. */
  promoShowCountdown?: boolean;
  eyebrow?: string;
  artistCredit?: string;
  compareAtPriceEgp?: number;
  onQuickView: (slug: string) => void;
  onProductClick?: () => void;
  eager?: boolean;
  /** Compact home layout: lighter surface and quieter proof line. */
  variant?: 'default' | 'minimal';
  className?: string;
  'data-reveal'?: string;
};

function getPreferredQuickAddSize(productSlug: string): ProductSizeKey | null {
  const product = getProduct(productSlug);
  if (!product) return null;

  const available = productAvailableSizes(product).filter((size) =>
    PDP_SCHEMA.sizes.some((definition) => definition.key === size && !definition.disabled),
  );

  if (available.length === 0) {
    return null;
  }

  return available.includes('M') ? 'M' : available[0];
}

export function MerchProductCard({
  slug,
  name,
  priceEgp,
  imageSrc,
  imageAlt,
  promoLabel: promoLabelProp,
  promoEndsAt: promoEndsAtProp,
  promoShowCountdown: promoShowCountdownProp,
  eyebrow,
  artistCredit,
  compareAtPriceEgp,
  onQuickView,
  onProductClick,
  eager = false,
  variant = 'default',
  className,
  'data-reveal': dataReveal,
}: MerchProductCardProps) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const { addItem, showAddToCartToast } = useCart();
  const { has: isWishlisted, toggle: toggleWishlist } = useWishlist();
  const wishlisted = isWishlisted(slug);
  const minimal = variant === 'minimal';
  const product = useMemo(() => getProduct(slug), [slug]);
  const promoLabelValue = promoLabelProp ?? product?.promoLabel;
  const promoLabel = pickLocalizedText(promoLabelValue, locale === 'ar' ? 'ar' : 'en');
  const promoEndsAt = promoEndsAtProp ?? product?.promoEndsAt;
  const promoShowCountdown = promoShowCountdownProp ?? product?.promoShowCountdown ?? true;
  const countdown = useCountdown(compareAtPriceEgp && promoShowCountdown ? promoEndsAt : null);
  const savingsEgp = typeof compareAtPriceEgp === 'number' && compareAtPriceEgp > priceEgp
    ? compareAtPriceEgp - priceEgp
    : 0;
  const savingsPct = savingsEgp > 0 && compareAtPriceEgp
    ? Math.round((savingsEgp / compareAtPriceEgp) * 100)
    : 0;
  const availableSizes = useMemo(() => {
    if (!product) return [] as ProductSizeKey[];
    return productAvailableSizes(product).filter((size) =>
      PDP_SCHEMA.sizes.some((definition) => definition.key === size && !definition.disabled),
    );
  }, [product]);
  const recommendedSize = useMemo(() => getPreferredQuickAddSize(slug), [slug]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [quickAddMessage, setQuickAddMessage] = useState('');
  const addedTimeoutRef = useRef<number | null>(null);
  const stockStatus = deriveProductStockStatus(product);
  const showFitBadge = Boolean(product?.fitLabel?.trim()) && !(minimal && stockStatus);
  const quickAddAvailable = availableSizes.length > 0;
  const hoverImageSrc = product ? getProductCardHoverImageSrc(product) : null;
  const [hovering, setHovering] = useState(false);
  const baseImageSrc = product ? getConversionProductCardImageSrc(product, imageSrc) : imageSrc;
  const usingReferenceImage = product ? shouldUseConversionReferenceImage(imageSrc) : false;
  const displayImageSrc = hovering && hoverImageSrc ? hoverImageSrc : baseImageSrc;
  const quickAddLabel = locale === 'ar' ? 'إضافة سريعة' : 'Quick add';
  const chooseSizeLabel = locale === 'ar' ? 'اختر المقاس' : 'Choose size';
  const addedLabel = locale === 'ar' ? 'أُضيف' : 'Added';

  useEffect(() => {
    setQuickAddOpen(false);
    setAddedFeedback(false);
    setQuickAddMessage('');
  }, [slug]);

  useEffect(() => {
    return () => {
      if (addedTimeoutRef.current) {
        window.clearTimeout(addedTimeoutRef.current);
      }
    };
  }, []);

  /** Open size UI, or add immediately when there is nothing to choose. */
  function handleQuickAddPrimaryClick() {
    if (addedFeedback) return;
    setQuickAddMessage('');
    if (availableSizes.length === 1) {
      handleQuickAdd(availableSizes[0]);
      return;
    }
    setQuickAddOpen((open) => !open);
  }

  function handleQuickAdd(size: ProductSizeKey) {
    if (product) {
      trackSizeSelected(product, size, 'product_card_quick_add');
    }
    const result = addItem(slug, size, 1);
    if (!result.ok) {
      setAddedFeedback(false);
      setQuickAddOpen(true);
      setQuickAddMessage(formatCartStockMessage(result, product?.name ?? name, locale === 'ar'));
      return;
    }
    showAddToCartToast();
    setQuickAddOpen(false);
    setQuickAddMessage('');
    setAddedFeedback(true);

    if (addedTimeoutRef.current) {
      window.clearTimeout(addedTimeoutRef.current);
    }

    addedTimeoutRef.current = window.setTimeout(() => {
      setAddedFeedback(false);
      addedTimeoutRef.current = null;
    }, 2200);
  }

  const desktopQuickAddButtonClasses = [
    'font-label inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal',
    quickAddOpen || addedFeedback
      ? 'border-obsidian bg-white text-obsidian shadow-md'
      : 'border-obsidian/15 bg-white/95 text-obsidian hover:border-obsidian hover:bg-white',
  ].join(' ');

  return (
    <article
      className={['group merch-card-lift flex flex-col', usingReferenceImage ? 'merch-card--reference' : '', className].filter(Boolean).join(' ')}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setQuickAddOpen(false);
      }}
      {...(dataReveal ? { 'data-reveal': dataReveal } : {})}
    >
      <div className="relative mb-4 w-full">
        <Link
          href={`/products/${slug}`}
          className="block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          aria-label={`View ${name}`}
          onClick={onProductClick}
        >
          <div
            className={
              minimal
                ? 'transition-opacity duration-300 group-hover:opacity-95'
                : 'transition-transform duration-700 ease-out group-hover:scale-[1.03]'
            }
          >
            <TeeImageFrame
              src={displayImageSrc}
              alt={imageAlt}
              w={560}
              aspectRatio="4/5"
              borderRadius="0.375rem"
              eager={eager}
              objectPosition={usingReferenceImage ? 'center center' : 'center 24%'}
              frameStyle={{ marginBottom: 0 }}
            />
          </div>
          {showFitBadge ? (
            <span className="font-label absolute left-2 top-2 z-10 max-w-[55%] truncate rounded-md border border-stone/30 bg-white/90 px-1.5 py-1 text-[8px] md:left-3 md:top-3 md:px-2.5 md:py-1.5 md:text-[10px] font-semibold uppercase tracking-[0.16em] md:tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm">
              {product?.fitLabel?.trim()}
            </span>
          ) : null}
          {stockStatus ? (
            <span className="absolute left-2 bottom-2 z-10 md:left-3 md:bottom-3">
              <StockStatusChip status={stockStatus} />
            </span>
          ) : null}
        </Link>
        {/* Wishlist heart — always visible, top-right corner */}
        <button
          type="button"
          aria-label={wishlisted ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
          aria-pressed={wishlisted}
          className="absolute right-2 top-2 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:right-2.5 md:top-2.5"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const p = product;
            if (p) {
              if (wishlisted) trackWishlistRemove(p);
              else trackWishlistAdd(p);
            }
            toggleWishlist(slug);
          }}
        >
          <svg
            className="h-5 w-5 transition-colors"
            viewBox="0 0 24 24"
            fill={wishlisted ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            style={{ color: wishlisted ? '#8C2340' : 'var(--obsidian, #4F111F)' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        {/* Desktop: single bottom action strip — hidden until hover/focus */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden flex-col gap-2 p-3 invisible opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 md:flex">
          {quickAddAvailable && quickAddOpen ? (
            <div className="pointer-events-auto rounded-2xl border border-obsidian/10 bg-white/96 p-3 shadow-xl backdrop-blur-sm">
              <p className="font-label mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-clay">
                {chooseSizeLabel}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={`${slug}-${size}`}
                    type="button"
                    className={`font-label inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                      recommendedSize === size
                        ? 'border-obsidian bg-obsidian text-white'
                        : 'border-stone/60 bg-white text-obsidian hover:border-obsidian'
                    }`}
                    onClick={() => handleQuickAdd(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {quickAddMessage ? (
                <p className="font-label mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ember" role="status" aria-live="polite">
                  {quickAddMessage}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="pointer-events-auto flex w-full min-w-0 items-end justify-between gap-2 rounded-b-md bg-linear-to-t from-black/35 via-black/15 to-transparent pt-8">
            <QuickViewTrigger
              productName={name}
              onClick={() => onQuickView(slug)}
              visibilityMode="plp-bar"
              className="min-w-0"
            />
            {quickAddAvailable ? (
              <button
                type="button"
                className={desktopQuickAddButtonClasses}
                onClick={handleQuickAddPrimaryClick}
                aria-expanded={quickAddOpen}
                aria-label={`${quickAddLabel}: ${name}`}
              >
                {addedFeedback ? addedLabel : quickAddLabel}
              </button>
            ) : (
              <Link
                href={`/products/${slug}`}
                className="font-label pointer-events-auto inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/90 px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {copy.home.viewPiece}
              </Link>
            )}
          </div>
        </div>
      </div>

      {quickAddAvailable ? (
        <div className="mb-3 md:hidden">
          <Link
            href={`/products/${slug}`}
            className="font-label inline-flex min-h-11 items-center justify-center rounded-full border border-stone/60 bg-white px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:border-obsidian"
            onClick={onProductClick}
          >
            {copy.home.viewPiece}
          </Link>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col text-left">
        <Link
          href={`/products/${slug}`}
          className={`font-headline block font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
            minimal ? 'mt-3 text-[0.92rem] md:text-[1rem]' : 'mt-2 text-[1rem] md:text-[1.08rem]'
          }`}
          onClick={onProductClick}
        >
          {name}
        </Link>
        {artistCredit?.trim() ? (
          <p className="font-label mt-1.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-warm-charcoal md:mt-2 md:text-[10px]">
            {artistCredit.trim()}
          </p>
        ) : null}
        {eyebrow?.trim() ? (
          <span className="font-label mt-1 inline-flex w-fit rounded-full border border-deep-teal/15 bg-deep-teal/5 px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-deep-teal md:mt-1.5 md:text-[10px]">
            {eyebrow.trim()}
          </span>
        ) : null}
        {product && product.occasionSlugs.some((s) => getOccasions().some((o) => o.slug === s && o.isGiftOccasion)) ? (
          <span className="font-label mt-1 inline-flex w-fit items-center gap-1 text-[8.5px] font-medium uppercase tracking-[0.16em] text-horo-pulse md:mt-1.5 md:text-[10px]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {locale === 'ar' ? 'تغليف هدية متاح' : 'Gift wrap available'}
          </span>
        ) : null}
        {!minimal && promoLabel?.trim() ? (
          <p className="font-label mt-1 text-[8.5px] font-medium uppercase tracking-[0.16em] text-horo-pulse md:mt-1.5 md:text-[10px]">
            {promoLabel.trim()}
          </p>
        ) : null}
        <div className={`mt-auto ${minimal ? 'pt-2.5' : 'pt-3'}`}>
          <div className="flex flex-wrap items-baseline gap-2">
            <p className={`font-headline font-semibold ${compareAtPriceEgp ? 'text-horo-pulse' : 'text-obsidian'} ${minimal ? 'text-[1rem]' : 'text-[1.125rem]'}`}>
              {formatEgp(priceEgp)}
            </p>
            {compareAtPriceEgp ? (
              <p className="font-headline text-[0.875rem] text-stone line-through">{formatEgp(compareAtPriceEgp)}</p>
            ) : null}
            {countdown && !countdown.expired ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-horo-breath px-2 py-1 ring-1 ring-horo-pulse/20">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-horo-pulse" aria-hidden>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="font-label text-[11px] font-semibold tabular-nums leading-none text-horo-pulse">
                  {countdown.days > 0
                    ? `${countdown.days}d ${String(countdown.hours).padStart(2, '0')}h ${String(countdown.minutes).padStart(2, '0')}m`
                    : `${String(countdown.hours).padStart(2, '0')}:${String(countdown.minutes).padStart(2, '0')}:${String(countdown.seconds).padStart(2, '0')}`
                  }
                </span>
              </span>
            ) : null}
          </div>
          {savingsEgp > 0 ? (
            <p className="font-label mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-deep-teal">
              {locale === 'ar'
                ? `وفر ${formatEgp(savingsEgp)}${savingsPct ? ` (${savingsPct}%)` : ''}`
                : `Save ${formatEgp(savingsEgp)}${savingsPct ? ` (${savingsPct}%)` : ''}`}
            </p>
          ) : null}
          {!quickAddAvailable ? (
            <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
              {product?.id ? (
                <NotifyWhenAvailableButton
                  productId={product.id}
                  productSlug={slug}
                  productName={name}
                  compact
                  className="font-label inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone/60 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
                />
              ) : (
                <Link
                  href={`/products/${slug}#notify`}
                  className="font-label inline-flex min-h-11 w-full items-center justify-center rounded-full border border-stone/60 bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
                  onClick={onProductClick}
                >
                  {locale === 'ar' ? 'أبلغني عند التوفر' : 'Notify when available'}
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
