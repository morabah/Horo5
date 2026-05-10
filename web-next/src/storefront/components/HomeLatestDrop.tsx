'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { getProducts, productHasRealImage } from '../data/site';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import { getProductComparisonImageSrc, imgUrl } from '../data/images';
import { TeeImage } from './TeeImage';
import { formatEgp } from '../utils/formatPrice';

export function HomeLatestDrop() {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';

  const latest = useMemo(() => {
    const pool = getProducts()
      .filter(productHasRealImage)
      .filter((p) => p.priceEgp != null)
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
    return pool[0] ?? null;
  }, []);

  if (!latest) return null;

  const imageSrc = getProductComparisonImageSrc(latest);
  const scarcityLabel = isArabic
    ? 'قطع محدودة'
    : 'Limited pieces';

  return (
    <section
      aria-labelledby="home-latest-drop-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between" data-reveal>
          <div>
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {isArabic ? 'أحدث إطلاق' : 'Latest drop'}
            </p>
            <h2
              id="home-latest-drop-title"
              className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
            >
              {isArabic ? 'وصل لسه من المطبعة' : 'Fresh from the studio'}
            </h2>
          </div>
          <Link
            href="/products"
            className="font-body inline-flex min-h-11 w-fit items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {copy.shell.shopAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 md:gap-10" data-reveal="stagger-1">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] border border-stone/40 bg-papyrus/50 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)]">
            <TeeImage
              src={imgUrl(imageSrc, 1200)}
              alt={`HORO "${latest.name}" graphic tee`}
              w={1200}
              className="h-full w-full"
              objectPosition="center 24%"
              eager
            />
            <span className="absolute left-3 top-3 rounded-full border border-ember/30 bg-white/92 px-3 py-1.5 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-ember shadow-sm backdrop-blur-sm md:left-4 md:top-4">
              {scarcityLabel}
            </span>
          </div>

          <div className="flex flex-col justify-center">
            <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
              {latest.artistDisplay?.name ?? latest.artistSlug}
            </p>
            <h3 className="font-headline mt-2 text-[1.5rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.8rem]">
              {latest.name}
            </h3>
            <p className="font-body mt-3 text-[15px] leading-relaxed text-warm-charcoal md:text-base">
              {latest.story}
            </p>
            <p className="font-headline mt-4 text-[1.35rem] font-semibold text-obsidian">
              {formatEgp(latest.priceEgp)}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/products/${latest.slug}`}
                className="font-body inline-flex min-h-12 items-center justify-center rounded-md bg-obsidian px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {copy.home.viewPiece}
              </Link>
              <Link
                href="/products"
                className="font-body inline-flex min-h-12 items-center justify-center rounded-md border border-obsidian/30 px-6 py-3 text-sm font-medium text-obsidian transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
              >
                {copy.shell.shopAll}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
