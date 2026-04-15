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

  const desktopQuickAddClasses = [
    'font-label absolute bottom-3 right-3 z-10 hidden min-h-10 items-center justify-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-300 md:inline-flex',
    quickAddOpen || addedFeedback
      ? 'border-obsidian bg-white text-obsidian opacity-100 shadow-md'
      : 'border-white/75 bg-white/88 text-obsidian opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
  ].join(' ');

  const mobileQuickAddClasses = [
    'font-label inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors',
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
            <TeeImageFrame src={imageSrc} alt={imageAlt} w={700} aspectRatio="4/5" borderRadius="0.375rem" frameStyle={{ marginBottom: 0 }} />
          </div>
          {merchandisingBadge ? (
            <span
              className="font-label absolute left-3 top-3 z-10 rounded-md bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm"
            >
              {merchandisingBadge}
            </span>
          ) : null}
        </Link>
        {quickAddAvailable ? (
          <>
            {quickAddOpen ? (
              <div className="absolute inset-x-3 bottom-14 z-20 hidden rounded-2xl border border-obsidian/10 bg-white/96 p-3 shadow-xl backdrop-blur-sm md:block">
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
            <button
              type="button"
              className={desktopQuickAddClasses}
              onClick={() => {
                if (addedFeedback) return;
                setQuickAddOpen((current) => !current);
              }}
              aria-expanded={quickAddOpen}
              aria-label={`${quickAddLabel}: ${name}`}
            >
              {addedFeedback ? addedLabel : quickAddLabel}
            </button>
          </>
        ) : null}
        <QuickViewTrigger productName={name} onClick={() => onQuickView(slug)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 md:hidden">
        {quickAddAvailable ? (
          <button
            type="button"
            className={mobileQuickAddClasses}
            onClick={() => {
              if (addedFeedback) return;
              setQuickAddOpen((current) => !current);
            }}
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
