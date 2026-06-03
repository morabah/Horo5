import Link from 'next/link';

import { getProductComparisonImageSrc } from '../data/images';
import { getProducts, productHasRealImage } from '../data/site';
import { useDictionary } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';
import { formatEgp } from '../utils/formatPrice';

/**
 * Highlights a single featured product from the Founding Drop.
 * Returns null when no product with a real image exists.
 */
export function HomeFeaturedPiece() {
  const copy = useDictionary();

  const featuredProduct = getProducts()
    .filter(productHasRealImage)
    .slice(0, 1)[0] ?? null;

  if (!featuredProduct) return null;

  const imageSrc = getProductComparisonImageSrc(featuredProduct);

  return (
    <section
      aria-labelledby="home-featured-piece-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className={`grid grid-cols-1 items-center gap-6 md:gap-12 ${imageSrc ? 'md:grid-cols-2' : ''}`}>
          {imageSrc ? (
            <div data-reveal className="order-2 md:order-1">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[18px] border border-stone/40 bg-papyrus/50 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)]">
                <TeeImage
                  src={imageSrc}
                  alt={`HORO ${featuredProduct.name} — featured piece.`}
                  w={1200}
                  className="h-full w-full"
                  objectPosition="center 18%"
                />
              </div>
            </div>
          ) : null}
          <div data-reveal="stagger-1" className="order-1 flex flex-col justify-center md:order-2">
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {copy.home.featuredPieceEyebrow}
            </p>
            <h2
              id="home-featured-piece-title"
              className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
            >
              {featuredProduct.name}
            </h2>
            {featuredProduct.story ? (
              <p className="font-body mt-3 max-w-md text-[15px] leading-relaxed text-warm-charcoal">
                {featuredProduct.story.length > 140
                  ? `${featuredProduct.story.slice(0, 140).trimEnd()}…`
                  : featuredProduct.story}
              </p>
            ) : null}
            {featuredProduct.artistDisplay?.name ? (
              <p className="font-label mt-3 text-[10px] font-medium uppercase tracking-[0.18em] text-clay">
                {copy.home.artByLabel} {featuredProduct.artistDisplay.name}
              </p>
            ) : null}
            <p className="font-headline mt-3 text-[1.25rem] font-semibold text-obsidian">
              {formatEgp(featuredProduct.priceEgp)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/products/${featuredProduct.slug}`}
                className="cta-clay font-body inline-flex min-h-12 items-center justify-center rounded-md border border-obsidian/80 bg-obsidian px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-obsidian/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {copy.home.featuredPieceCta}
              </Link>
              <Link
                href="/products"
                className="font-body inline-flex min-h-12 items-center justify-center rounded-md border border-stone/60 bg-white px-7 py-3 text-sm font-semibold text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {copy.home.featuredPieceBrowseAll}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
