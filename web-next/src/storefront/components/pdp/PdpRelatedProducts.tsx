'use client';
import { useDictionary } from '../../i18n/ui-locale';

import Link from 'next/link';
import type { Product, Feeling } from '../../data/catalog-types';
import { fillPdpCopyTemplate } from '../../data/domain-config';
import { formatEgp } from '../../utils/formatPrice';
import { compareAtPrice } from '../../utils/productPricing';
import { TeeImageFrame } from '../TeeImage';
import { getProductMedia } from '../../data/images';
import { QuickViewTrigger } from '../QuickViewTrigger';


type PdpRelatedProductsProps = {
  products: Product[];
  feeling: Feeling | undefined;
  shopByFeelingLabel: string;
  onQuickView: (slug: string) => void;
};

export function PdpRelatedProducts({
  products,
  onQuickView,
}: PdpRelatedProductsProps) {
  const { pdp: copy, shell } = useDictionary();
  if (products.length < 3) return null;

  const showGiftComplete =
    products.some((item) => item.giftable) &&
    'pdpCompleteTheGiftEyebrow' in copy &&
    typeof copy.pdpCompleteTheGiftEyebrow === 'string';
  const sectionEyebrow = showGiftComplete ? copy.pdpCompleteTheGiftEyebrow : copy.pdpRelatedEyebrow;

  return (
    <section className="bg-papyrus">
      <div className="mx-auto max-w-[1080px] px-4 pb-14 pt-12 md:px-12 lg:px-8 md:pb-16 md:pt-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
              {sectionEyebrow}
            </span>
            <h2 className="font-headline mt-1 text-2xl font-semibold uppercase tracking-tight text-obsidian md:text-3xl">
              {'pdpRelatedMoreFromTitle' in copy ? copy.pdpRelatedMoreFromTitle : 'More from the Founding Drop'}
            </h2>
            <p className="mt-1.5 max-w-[40rem] font-body text-sm text-clay">{copy.relatedMoreFromSubtitle}</p>
          </div>
          <Link
            href="/products"
            className="font-label inline-flex min-h-12 items-center rounded-xl border border-obsidian/80 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-obsidian hover:text-white"
          >
            {'pdpRelatedBrowseCta' in copy ? copy.pdpRelatedBrowseCta : shell.shopAll}
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {products.slice(0, 4).map((item) => (
            <article
              key={item.slug}
              className="group relative overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-black/5 transition-shadow hover:shadow-md"
            >
              <Link
                href={`/products/${item.slug}`}
                className="absolute inset-0 z-[1] rounded-[18px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                <span className="sr-only">
                  {fillPdpCopyTemplate(copy.pdpRelatedCardSrTemplate, {
                    name: item.name,
                    price: formatEgp(item.priceEgp),
                  })}
                </span>
              </Link>

              <div className="pointer-events-none relative z-[2]">
                <div className="relative overflow-hidden rounded-t-[18px]">
                  <div className="transition-transform duration-700 ease-out group-hover:scale-[1.03]">
                    <TeeImageFrame
                      src={item.media?.main ?? item.thumbnail ?? getProductMedia(item.slug).main}
                      alt={fillPdpCopyTemplate(copy.pdpRelatedCardImageAltTemplate, { name: item.name })}
                      w={500}
                      aspectRatio="4/5"
                      borderRadius="1.125rem 1.125rem 0 0"
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

                <div className="p-4">
                  <h3 className="font-headline text-[11px] font-semibold uppercase tracking-wide text-obsidian group-hover:text-deep-teal md:text-xs">
                    {item.name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="font-body text-xs text-clay">{formatEgp(item.priceEgp)}</p>
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
