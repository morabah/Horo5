import { Link } from 'react-router-dom';
import type { Product, ProductSizeKey } from '../data/site';
import { getProductMedia } from '../data/images';
import { TeeImageFrame } from './TeeImage';
import { QuickViewTrigger } from './QuickViewTrigger';
import { formatEgp } from '../utils/formatPrice';
import { compareAtPrice } from '../utils/productPricing';
import { productAvailableSizes } from '../utils/productSizes';

type CrossSellWidgetProps = {
  frequentlyBoughtWith: Product[];
  styleWith: Product[];
  copy: {
    fbtEyebrow: string;
    fbtTitle: string;
    fbtSubtitle: string;
    styleEyebrow: string;
    styleTitle: string;
    styleSubtitle: string;
    bundleFbtCta: string;
    bundleStyleCta: string;
    needSize: string;
  };
  sizeReady: boolean;
  oosSelected: boolean;
  selectedSize: ProductSizeKey | null;
  currentSlug: string;
  onQuickView: (slug: string) => void;
  onMissingSize: () => void;
  onAddBundle: (companions: Product[]) => void;
};

function pickSize(product: Product, preferred: ProductSizeKey | null): ProductSizeKey | null {
  const avail = productAvailableSizes(product);
  if (preferred && avail.includes(preferred)) return preferred;
  return avail[0] ?? null;
}

function MiniCards({
  items,
  onQuickView,
}: {
  items: Product[];
  onQuickView: (slug: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {items.map((item) => (
        <article
          key={item.slug}
          className="group relative overflow-hidden rounded-[14px] bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
        >
          <Link
            to={`/products/${item.slug}`}
            className="absolute inset-0 z-[1] rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            <span className="sr-only">
              View {item.name}, {formatEgp(item.priceEgp)}
            </span>
          </Link>
          <div className="pointer-events-none relative z-[2]">
            <div className="relative overflow-hidden rounded-t-[14px]">
              <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                <TeeImageFrame
                  src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                  alt={`HORO “${item.name}” tee`}
                  w={360}
                  aspectRatio="4/5"
                  borderRadius="0.875rem 0.875rem 0 0"
                  frameStyle={{ marginBottom: 0 }}
                />
              </div>
              <QuickViewTrigger
                productName={item.name}
                className="pointer-events-auto bottom-2 left-2 right-2"
                onClick={() => onQuickView(item.slug)}
              />
            </div>
            <div className="p-3">
              <h3 className="font-headline text-[10px] font-semibold uppercase tracking-wide text-obsidian group-hover:text-deep-teal sm:text-[11px]">
                {item.name}
              </h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="font-body text-[11px] text-clay">{formatEgp(item.priceEgp)}</p>
                {compareAtPrice(item.priceEgp, item.originalPriceEgp) ? (
                  <p className="font-body text-[10px] text-clay/80 line-through">
                    {formatEgp(compareAtPrice(item.priceEgp, item.originalPriceEgp) ?? 0)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function CrossSellWidget({
  frequentlyBoughtWith,
  styleWith,
  copy,
  sizeReady,
  oosSelected,
  selectedSize,
  currentSlug,
  onQuickView,
  onMissingSize,
  onAddBundle,
}: CrossSellWidgetProps) {
  if (frequentlyBoughtWith.length === 0 && styleWith.length === 0) return null;

  const preferred = selectedSize;
  const canBundle = sizeReady && !oosSelected && preferred;

  function runBundle(products: Product[]) {
    if (!canBundle || !preferred) {
      onMissingSize();
      return;
    }
    const companions: Product[] = [];
    for (const p of products) {
      if (p.slug === currentSlug) continue;
      if (!pickSize(p, preferred)) {
        onMissingSize();
        return;
      }
      companions.push(p);
    }
    onAddBundle(companions);
  }

  return (
    <div className="space-y-8 border-t border-stone/25 pt-6 md:border-t-0 md:pt-0">
      {frequentlyBoughtWith.length > 0 ? (
        <section aria-labelledby="cross-sell-fbt-title">
          <div className="mb-3">
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-clay">{copy.fbtEyebrow}</span>
            <h2 id="cross-sell-fbt-title" className="font-headline mt-1 text-lg font-semibold uppercase tracking-tight text-obsidian md:text-xl">
              {copy.fbtTitle}
            </h2>
            <p className="mt-1 font-body text-xs leading-relaxed text-clay sm:text-sm">{copy.fbtSubtitle}</p>
          </div>
          <MiniCards items={frequentlyBoughtWith} onQuickView={onQuickView} />
          <button
            type="button"
            disabled={!canBundle}
            onClick={() => runBundle(frequentlyBoughtWith)}
            className="btn btn-primary mt-4 min-h-12 w-full text-[11px] font-semibold uppercase tracking-[0.18em] disabled:pointer-events-none disabled:opacity-45"
          >
            {copy.bundleFbtCta}
          </button>
        </section>
      ) : null}

      {styleWith.length > 0 ? (
        <section aria-labelledby="cross-sell-style-title">
          <div className="mb-3">
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-clay">{copy.styleEyebrow}</span>
            <h2 id="cross-sell-style-title" className="font-headline mt-1 text-lg font-semibold uppercase tracking-tight text-obsidian md:text-xl">
              {copy.styleTitle}
            </h2>
            <p className="mt-1 font-body text-xs leading-relaxed text-clay sm:text-sm">{copy.styleSubtitle}</p>
          </div>
          <MiniCards items={styleWith} onQuickView={onQuickView} />
          <button
            type="button"
            disabled={!canBundle}
            onClick={() => runBundle(styleWith)}
            className="mt-4 flex min-h-12 w-full items-center justify-center border-2 border-obsidian bg-white px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal disabled:pointer-events-none disabled:opacity-45"
          >
            {copy.bundleStyleCta}
          </button>
        </section>
      ) : null}

      {!canBundle && !oosSelected ? (
        <p className="font-body text-xs text-clay" role="status">
          {copy.needSize}
        </p>
      ) : null}
    </div>
  );
}
