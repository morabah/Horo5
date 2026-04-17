import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import { PDP_SCHEMA } from '../data/domain-config';
import { getProduct, type ProductSizeKey } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { productAvailableSizes } from '../utils/productSizes';
import { QuickViewTrigger } from './QuickViewTrigger';
import { TeeImageFrame } from './TeeImage';
import { formatEgp } from '../utils/formatPrice';

type MerchProductCardProps = {
  slug: string;
  name: string;
  priceEgp: number;
  imageSrc: string;
  imageAlt: string;
  merchandisingBadge?: string;
  /** Overrides catalog `product.promoLabel` when the card is driven by a server list (e.g. search). */
  promoLabel?: string;
  eyebrow?: string;
  eyebrowAccent?: string;
  proofChip?: string;
  useCase?: string;
  artistCredit?: string;
  compareAtPriceEgp?: number;
  onQuickView: (slug: string) => void;
  onProductClick?: () => void;
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
  merchandisingBadge,
  promoLabel: promoLabelProp,
  proofChip,
  eyebrow,
  eyebrowAccent,
  artistCredit,
  compareAtPriceEgp,
  onQuickView,
  onProductClick,
  variant = 'default',
  className,
  'data-reveal': dataReveal,
}: MerchProductCardProps) {
  const { locale } = useUiLocale();
  const { addItem, setMiniCartOpen } = useCart();
  const minimal = variant === 'minimal';
  const product = useMemo(() => getProduct(slug), [slug]);
  const promoLabel = promoLabelProp ?? product?.promoLabel;
  const fallbackProofChip =
    product?.fitLabel?.trim() ||
    product?.trustBadges?.find(Boolean) ||
    (artistCredit?.trim() ? (locale === 'ar' ? 'فنان معتمد' : 'Artist credited') : undefined) ||
    undefined;
  const resolvedProofChip = proofChip?.trim() || fallbackProofChip;
  const showPromo = Boolean(promoLabel);
  const showProof = !showPromo && Boolean(resolvedProofChip);
  const showMerch = !showPromo && !showProof && Boolean(merchandisingBadge);
  const showEyebrow = minimal && Boolean(eyebrow?.trim());
  const availableSizes = useMemo(() => {
    if (!product) return [] as ProductSizeKey[];
    return productAvailableSizes(product).filter((size) =>
      PDP_SCHEMA.sizes.some((definition) => definition.key === size && !definition.disabled),
    );
  }, [product]);
  const recommendedSize = useMemo(() => getPreferredQuickAddSize(slug), [slug]);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const addedTimeoutRef = useRef<number | null>(null);
  const quickAddAvailable = availableSizes.length > 0;
  const quickAddLabel = locale === 'ar' ? 'إضافة سريعة' : 'Quick add';
  const chooseSizeLabel = locale === 'ar' ? 'اختر المقاس' : 'Choose size';
  const addedLabel = locale === 'ar' ? 'أُضيف' : 'Added';

  useEffect(() => {
    setQuickAddOpen(false);
    setAddedFeedback(false);
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
    if (availableSizes.length === 1) {
      handleQuickAdd(availableSizes[0]);
      return;
    }
    setQuickAddOpen((open) => !open);
  }

  function handleQuickAdd(size: ProductSizeKey) {
    addItem(slug, size, 1);
    setMiniCartOpen(true);
    setQuickAddOpen(false);
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
    'font-label inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm backdrop-blur-sm transition-colors duration-200',
    quickAddOpen || addedFeedback
      ? 'border-obsidian bg-white text-obsidian shadow-md'
      : 'border-obsidian/15 bg-white/95 text-obsidian hover:border-obsidian hover:bg-white',
  ].join(' ');

  const mobileQuickAddClasses = [
    'font-label inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors',
    quickAddOpen || addedFeedback
      ? 'border-obsidian bg-obsidian text-white'
      : 'border-stone/60 bg-white text-obsidian hover:border-obsidian',
  ].join(' ');

  return (
    <article
      className={['group merch-card-lift flex flex-col', className].filter(Boolean).join(' ')}
      onMouseLeave={() => setQuickAddOpen(false)}
      {...(dataReveal ? { 'data-reveal': dataReveal } : {})}
    >
      <div className="relative mb-4 w-full">
        <Link
          to={`/products/${slug}`}
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
              src={imageSrc}
              alt={imageAlt}
              w={560}
              aspectRatio="4/5"
              borderRadius="0.375rem"
              objectPosition="center 24%"
              frameStyle={{ marginBottom: 0 }}
            />
          </div>
          {showMerch ? (
            <span
              className="font-label absolute left-3 top-3 z-10 rounded-md bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm"
            >
              {merchandisingBadge}
            </span>
          ) : null}
          {showPromo ? (
            <span
              className="font-label absolute left-3 top-3 z-10 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-950 shadow-sm backdrop-blur-sm"
            >
              {promoLabel}
            </span>
          ) : null}
          {showProof ? (
            <span className="font-label absolute left-3 top-3 z-10 rounded-md border border-deep-teal/25 bg-white/92 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-deep-teal shadow-sm backdrop-blur-sm">
              {resolvedProofChip}
            </span>
          ) : null}
          {showEyebrow ? (
            <span
              className="category-chip font-label pointer-events-none absolute right-3 top-3 z-9 max-w-[min(100%-6rem,14rem)] truncate rounded-md px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-obsidian/80"
              style={
                eyebrowAccent
                  ? {
                      borderColor: `color-mix(in srgb, ${eyebrowAccent} 38%, var(--color-stone))`,
                    }
                  : undefined
              }
            >
              {eyebrow?.trim()}
            </span>
          ) : null}
        </Link>
        {/* Desktop: single bottom action strip (flex) — avoids overlapping absolutes; size picker stacks above via column flow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 hidden flex-col gap-2 p-3 md:flex">
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
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 md:hidden">
        {quickAddAvailable ? (
          <button
            type="button"
            className={mobileQuickAddClasses}
            onClick={handleQuickAddPrimaryClick}
            aria-expanded={quickAddOpen}
            aria-label={`${quickAddLabel}: ${name}`}
          >
            {addedFeedback ? addedLabel : quickAddLabel}
          </button>
        ) : null}
        <QuickViewTrigger
          productName={name}
          onClick={() => onQuickView(slug)}
          visibilityMode="mobile-inline"
          className={minimal ? '' : 'mt-0'}
        />
      </div>

      {quickAddAvailable && quickAddOpen ? (
        <div className="mb-4 flex flex-wrap gap-2 md:hidden">
          {availableSizes.map((size) => (
            <button
              key={`${slug}-${size}-mobile`}
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
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col text-left">
        <Link
          to={`/products/${slug}`}
          className={`font-headline block font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
            minimal ? 'mt-3 text-[1rem]' : 'mt-2 text-[1.08rem]'
          }`}
          onClick={onProductClick}
        >
          {name}
        </Link>
        {artistCredit?.trim() ? (
          <p className="font-label mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-warm-charcoal">
            {artistCredit.trim()}
          </p>
        ) : null}
        {product?.fitLabel?.trim() ? (
          <p className="font-label mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-warm-charcoal">
            {product.fitLabel.trim()}
          </p>
        ) : null}
        <div className={`mt-auto flex flex-wrap items-center gap-3 ${minimal ? 'pt-2.5' : 'pt-3'}`}>
          <div className="flex items-center gap-2">
            <p className={`font-headline font-semibold text-obsidian ${minimal ? 'text-[1rem]' : 'text-[1.125rem]'}`}>
              {formatEgp(priceEgp)}
            </p>
            {compareAtPriceEgp ? (
              <p className="font-headline text-[0.95rem] text-stone line-through">{formatEgp(compareAtPriceEgp)}</p>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
