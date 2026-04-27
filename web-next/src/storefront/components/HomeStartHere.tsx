import { Link } from 'react-router-dom';
import {
  pickLocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { getProductComparisonImageSrc } from '../data/images';
import {
  getProducts,
  productHasRealImage,
  type Product,
} from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { formatEgp } from '../utils/formatPrice';
import { TeeImageFrame } from './TeeImage';

const NON_COMPARISON_IMAGE_PATTERN = /(?:walking|woman_street|emotions_vibe_3|close|detail|macro|hero-model)/i;
const COMPARISON_IMAGE_PATTERN = /(?:^|[/-])bg_(?:tee|vibe)_/i;

function hasLikelyComparisonImage(product: Product) {
  const src = getProductComparisonImageSrc(product);
  return productHasRealImage(product) && COMPARISON_IMAGE_PATTERN.test(src) && !NON_COMPARISON_IMAGE_PATTERN.test(src);
}

function resolveHomeProducts(inputProducts?: Product[]) {
  // Medusa returns catalog products already sorted by product.metadata.catalogOrder.
  // Preserve that order while prioritizing products with merchandising, fit, and comparison-first imagery.
  const source = (inputProducts && inputProducts.length > 0 ? inputProducts : getProducts()).filter(productHasRealImage);
  const comparisonSource = source.filter(hasLikelyComparisonImage);
  const pool = comparisonSource.length >= 4 ? comparisonSource : source;
  const selected: Product[] = [];
  const seen = new Set<string>();
  const add = (product: Product) => {
    if (seen.has(product.slug)) return;
    selected.push(product);
    seen.add(product.slug);
  };

  pool
    .filter((product) => product.merchandisingBadge?.trim() || product.useCase?.trim())
    .forEach(add);
  pool
    .filter((product) => product.fitLabel?.trim() && (product.media?.main || product.thumbnail))
    .forEach(add);
  pool.forEach(add);

  return selected.slice(0, 6);
}

export function HomeStartHere({ products, section }: { products?: Product[]; section?: StorefrontHomepageSection }) {
  const { copy, locale } = useUiLocale();
  const sectionEyebrow = pickLocalizedStorefrontText(section?.eyebrow, locale as 'en' | 'ar');
  const sectionTitle = pickLocalizedStorefrontText(section?.title, locale as 'en' | 'ar');
  const sectionCta = pickLocalizedStorefrontText(section?.primaryCta?.label, locale as 'en' | 'ar');
  const featuredProducts = resolveHomeProducts(products);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-start-here-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {sectionEyebrow ?? copy.home.startHereEyebrow}
            </p>
            <h2
              id="home-start-here-title"
              data-reveal
              className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
            >
              {sectionTitle ?? copy.home.startHereTitle}
            </h2>
          </div>
          <Link
            to={section?.primaryCta?.href ?? '/products'}
            className="font-body inline-flex min-h-11 w-fit items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {sectionCta ?? copy.shell.shopAll}
          </Link>
        </div>

        <div className="grid grid-cols-2 items-stretch gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3">
          {featuredProducts.map((product, index) => {
            const imageSrc = getProductComparisonImageSrc(product);
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[index % 4];

            return (
              <article
                key={product.slug}
                className={[
                  'group flex h-full flex-col',
                  index >= 4 ? 'hidden sm:flex' : '',
                ].filter(Boolean).join(' ')}
                data-reveal={reveal}
              >
                <Link
                  to={`/products/${product.slug}`}
                  className="block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                  aria-label={`View ${product.name}`}
                >
                  <TeeImageFrame
                    src={imageSrc}
                    alt={`HORO "${product.name}" graphic tee`}
                    w={640}
                    aspectRatio="4/5"
                    borderRadius="0.375rem"
                    objectPosition="center 24%"
                    frameStyle={{ marginBottom: 0 }}
                  />
                </Link>

                <div className="mt-3 flex flex-1 flex-col">
                  {product.fitLabel?.trim() ? (
                    <span className="font-label mb-2 inline-flex w-fit max-w-full rounded-md border border-deep-teal/20 bg-white/82 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-deep-teal">
                      {product.fitLabel.trim()}
                    </span>
                  ) : null}
                  <Link
                    to={`/products/${product.slug}`}
                    className="font-headline text-[16px] font-semibold leading-snug tracking-tight text-obsidian transition-colors hover:text-clay focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:text-[18px]"
                  >
                    {product.name}
                  </Link>
                  <p className="font-headline mt-2 text-[16px] font-semibold text-obsidian md:text-[18px]">
                    {formatEgp(product.priceEgp)}
                  </p>
                  {product.feelsLike && product.feelsLike.length > 0 ? (
                    <p className="font-label mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-clay">
                      {copy.home.feelsLikeLabel}: {product.feelsLike.join(' · ')}
                    </p>
                  ) : null}
                  {product.worksFor && product.worksFor.length > 0 ? (
                    <p className="font-label mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-clay">
                      {copy.home.worksForLabel}: {product.worksFor.join(' · ')}
                    </p>
                  ) : null}
                  <div className="mt-auto pt-4">
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-body inline-flex min-h-11 w-full items-center justify-center rounded-md border border-obsidian/80 bg-white px-4 py-2.5 text-sm font-semibold text-obsidian transition-colors hover:bg-obsidian hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
                    >
                      {copy.home.startHereCta}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
