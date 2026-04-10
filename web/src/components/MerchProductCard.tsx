import { Link } from 'react-router-dom';
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

export function MerchProductCard({
  slug,
  name,
  priceEgp,
  imageSrc,
  imageAlt,
  merchandisingBadge,
  eyebrow,
  eyebrowAccent,
  proofChip,
  useCase,
  artistCredit,
  compareAtPriceEgp,
  onQuickView,
  onProductClick,
  variant = 'default',
  className,
  'data-reveal': dataReveal,
}: MerchProductCardProps) {
  const minimal = variant === 'minimal';
  return (
    <article className={['group merch-card-lift flex flex-col', className].filter(Boolean).join(' ')} {...(dataReveal ? { 'data-reveal': dataReveal } : {})}>
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
              className="font-label absolute left-3 top-3 z-10 text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian"
            >
              {merchandisingBadge}
            </span>
          ) : null}
        </Link>
        <QuickViewTrigger productName={name} onClick={() => onQuickView(slug)} />
      </div>

      {minimal ? (
        <QuickViewTrigger
          productName={name}
          onClick={() => onQuickView(slug)}
          visibilityMode="mobile-inline"
          className="mb-4"
        />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col text-left">
        {eyebrow ? (
          <p className="font-label flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-clay">
            {eyebrowAccent ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: eyebrowAccent }} aria-hidden /> : null}
            <span>{eyebrow}</span>
          </p>
        ) : null}



        <Link
          to={`/products/${slug}`}
          className={`font-headline block font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
            minimal ? 'mt-3 text-[1rem]' : 'mt-2 text-[1.08rem]'
          }`}
          onClick={onProductClick}
        >
          {name}
        </Link>
        {useCase ? (
          <p className={`mt-2 font-body text-sm leading-relaxed text-warm-charcoal ${minimal ? '' : 'max-w-[20rem]'}`}>
            {useCase}
          </p>
        ) : null}
        {artistCredit ? (
          <p className="mt-2 font-body text-[0.8rem] text-clay">
            {artistCredit}
          </p>
        ) : null}
        <div className={`mt-auto flex flex-wrap items-center gap-3 ${minimal ? 'pt-2.5' : 'pt-4'}`}>
          <div className="flex items-center gap-2">
            <p className={`font-headline font-semibold text-obsidian ${minimal ? 'text-[1rem]' : 'text-[1.125rem]'}`}>
              {formatEgp(priceEgp)}
            </p>
            {compareAtPriceEgp ? (
              <p className="font-headline text-[0.95rem] text-stone line-through">{formatEgp(compareAtPriceEgp)}</p>
            ) : null}
          </div>
          {!minimal && proofChip ? (
            <p
              className="font-label inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[#876749] shadow-sm"
            >
              {proofChip}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
