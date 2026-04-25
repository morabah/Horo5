'use client';

import { Link } from 'react-router-dom';
import type { Product, Feeling } from '../../data/catalog-types';
import { PDP_SCHEMA, fillPdpCopyTemplate } from '../../data/domain-config';
import { formatEgp } from '../../utils/formatPrice';
import { compareAtPrice } from '../../utils/productPricing';
import { TeeImageFrame } from '../TeeImage';
import { getProductMedia } from '../../data/images';
import { QuickViewTrigger } from '../QuickViewTrigger';

const { copy } = PDP_SCHEMA;

type PdpRelatedProductsProps = {
  products: Product[];
  feeling: Feeling | undefined;
  onQuickView: (slug: string) => void;
};

export function PdpRelatedProducts({
  products,
  feeling,
  onQuickView,
}: PdpRelatedProductsProps) {
  if (products.length < 3) return null;

  return (
    <section className="border-t border-stone/25 bg-papyrus">
      <div className="mx-auto max-w-[1320px] px-4 pb-14 pt-12 md:px-12 md:pb-16 md:pt-14 lg:px-12">
        <div className="mb-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline text-[clamp(1.5rem,3vw,2.2rem)] font-normal tracking-tight text-obsidian">
              {fillPdpCopyTemplate(copy.pdpRelatedMoreFromTemplate, {
                feeling: feeling?.name ?? copy.pdpRelatedFallbackFeeling,
              })}
            </h2>
            <p className="mt-1 font-body text-[13px] text-warm-charcoal/60">{copy.relatedMoreFromSubtitle}</p>
          </div>
          {feeling ? (
            <Link
              to={`/feelings/${feeling.slug}`}
              className="mb-2 font-body text-[14px] font-medium text-obsidian transition-colors hover:text-deep-teal"
            >
              View all
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
          {products.slice(0, 4).map((item) => (
            <article
              key={item.slug}
              className="group relative"
            >
              <Link
                to={`/products/${item.slug}`}
                className="absolute inset-0 z-[1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                <span className="sr-only">
                  {fillPdpCopyTemplate(copy.pdpRelatedCardSrTemplate, {
                    name: item.name,
                    price: formatEgp(item.priceEgp),
                  })}
                </span>
              </Link>

              <div className="pointer-events-none relative z-[2]">
                <div className="relative overflow-hidden rounded-lg">
                  <div className="transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                    <TeeImageFrame
                      src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                      alt={fillPdpCopyTemplate(copy.pdpRelatedCardImageAltTemplate, { name: item.name })}
                      w={500}
                      aspectRatio="4/5"
                      borderRadius="0.5rem"
                      frameStyle={{ marginBottom: 0 }}
                      blurDataURL={item.media?.blurDataUrlMain ?? null}
                    />
                  </div>
                  <QuickViewTrigger
                    productName={item.name}
                    className="pointer-events-auto bottom-3 left-3 right-3"
                    onClick={() => onQuickView(item.slug)}
                  />
                </div>

                <div className="mt-2.5 px-0.5">
                  <h3 className="font-body text-[14px] font-semibold text-obsidian group-hover:text-deep-teal">
                    {item.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="font-body text-[13px] text-warm-charcoal">{formatEgp(item.priceEgp)}</p>
                    {compareAtPrice(item.priceEgp, item.originalPriceEgp) ? (
                      <p className="font-body text-[11px] text-clay/80 line-through">
                        {formatEgp(compareAtPrice(item.priceEgp, item.originalPriceEgp) ?? 0)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
