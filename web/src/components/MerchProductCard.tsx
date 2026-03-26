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
  onQuickView: (slug: string) => void;
  onProductClick?: () => void;
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
  onQuickView,
  onProductClick,
  className,
  'data-reveal': dataReveal,
}: MerchProductCardProps) {
  return (
    <article className={['group flex flex-col', className].filter(Boolean).join(' ')} {...(dataReveal ? { 'data-reveal': dataReveal } : {})}>
      <div className="relative mb-4 w-full">
        <Link
          to={`/products/${slug}`}
          className="block overflow-hidden rounded-md bg-surface-container-high shadow-sm ring-1 ring-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          aria-label={`View ${name}`}
          onClick={onProductClick}
        >
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
            <TeeImageFrame src={imageSrc} alt={imageAlt} w={700} aspectRatio="4/5" borderRadius="0.375rem" frameStyle={{ marginBottom: 0 }} />
          </div>
          {merchandisingBadge ? (
            <span className="font-label absolute left-3 top-3 z-10 rounded-sm border border-white/70 bg-white/78 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-obsidian shadow-sm backdrop-blur-sm">
              {merchandisingBadge}
            </span>
          ) : null}
        </Link>
        <QuickViewTrigger productName={name} onClick={() => onQuickView(slug)} className="bottom-3 left-3 right-3" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col text-left">
        {eyebrow ? (
          <p className="font-label flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-clay">
            {eyebrowAccent ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: eyebrowAccent }} aria-hidden /> : null}
            <span>{eyebrow}</span>
          </p>
        ) : null}
        <Link
          to={`/products/${slug}`}
          className="font-headline mt-3 block text-[1.08rem] font-semibold leading-snug tracking-[0.01em] text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          onClick={onProductClick}
        >
          {name}
        </Link>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
          <p className="font-pdp-serif text-[1.125rem] font-normal text-obsidian">{formatEgp(priceEgp)}</p>
          {proofChip ? (
            <p className="font-label inline-flex min-h-9 items-center rounded-full border border-stone bg-white px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-clay-earth shadow-sm">
              {proofChip}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
