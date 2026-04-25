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
    <section className="mx-auto mt-[19px] max-w-[1080px] px-4 pb-14 pt-12 md:px-0 md:pb-16 md:pt-14">
      <div className="mb-[6px] flex items-end justify-between gap-4">
        <div>
          <h2 className="m-0 font-headline text-[35px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
            {fillPdpCopyTemplate(copy.pdpRelatedMoreFromTemplate, {
              feeling: feeling?.name ?? copy.pdpRelatedFallbackFeeling,
            })}
          </h2>
          <p className="m-[2px_0_0] text-[13px] text-[#665f58]">{copy.relatedMoreFromSubtitle}</p>
        </div>
        {feeling ? (
          <Link
            to={`/feelings/${feeling.slug}`}
            className="mb-[10px] text-[14px] font-medium text-[#38342f] transition-colors hover:text-deep-teal"
          >
            View all
          </Link>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-[22px] md:grid-cols-4">
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
              <div className="relative overflow-hidden rounded-[7px]">
                <div className="transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                  <TeeImageFrame
                    src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                    alt={fillPdpCopyTemplate(copy.pdpRelatedCardImageAltTemplate, { name: item.name })}
                    w={500}
                    aspectRatio="4/5"
                    borderRadius="7px"
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

              <div className="mt-[10px] px-0.5">
                <h3 className="m-0 text-[14px] font-semibold text-[#26231f] group-hover:text-deep-teal">
                  {item.name}
                </h3>
                <div className="mt-[2px] flex items-center gap-2">
                  <p className="m-0 text-[13px] text-[#554f49]">{formatEgp(item.priceEgp)}</p>
                  {compareAtPrice(item.priceEgp, item.originalPriceEgp) ? (
                    <p className="m-0 text-[11px] text-[#554f49]/60 line-through">
                      {formatEgp(compareAtPrice(item.priceEgp, item.originalPriceEgp) ?? 0)}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
