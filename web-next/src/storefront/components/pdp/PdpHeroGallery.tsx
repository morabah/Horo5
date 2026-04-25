'use client';

import { TeeImage } from '../TeeImage';
import type { Product } from '../../data/catalog-types';
import { fillPdpCopyTemplate, PDP_SCHEMA } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

type GalleryItem = {
  key: string;
  src: string;
  label: string;
  alt: string;
};

type PdpHeroGalleryProps = {
  product: Product;
  gallery: GalleryItem[];
  photoIndex: number;
  hasGalleryRail: boolean;
  heroView: GalleryItem;
  galleryLiveRegionId: string;
  galleryLiveText: string;
  onSetPhotoIndex: (index: number) => void;
  onOpenLightbox: () => void;
  onBlurForMain: (src: string) => string | null;
};

function IconChevronLeft({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconChevronRight({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function PdpHeroGallery({
  product,
  gallery,
  photoIndex,
  hasGalleryRail,
  heroView,
  galleryLiveRegionId,
  galleryLiveText,
  onSetPhotoIndex,
  onOpenLightbox,
  onBlurForMain,
}: PdpHeroGalleryProps) {
  function handleGalleryKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (gallery.length < 2) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onSetPhotoIndex(photoIndex <= 0 ? gallery.length - 1 : photoIndex - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onSetPhotoIndex(photoIndex >= gallery.length - 1 ? 0 : photoIndex + 1);
    }
  }

  return (
    <div className="gallery min-w-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-4">
        {/* Vertical thumbnail rail (desktop) */}
        {hasGalleryRail ? (
          <div
            className="scrollbar-thin hidden max-h-[min(75vh,42rem)] w-[4.5rem] shrink-0 flex-col gap-2 overflow-y-auto overflow-x-hidden py-0.5 pr-1 [scrollbar-width:thin] md:flex lg:w-[5.25rem]"
            aria-label={copy.pdpGalleryThumbnailsAria}
          >
            {gallery.map((view, index) => (
              <button
                key={`${product.slug}-v-${view.key}`}
                id={`pdp-gallery-thumb-v-${product.slug}-${index}`}
                type="button"
                onClick={() => onSetPhotoIndex(index)}
                className={`h-[130px] w-full shrink-0 overflow-hidden rounded-[6px] border bg-[#ece4d9] transition-all focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                  photoIndex === index
                    ? 'border-[#d4cbc0] opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
                aria-pressed={photoIndex === index}
                aria-label={fillPdpCopyTemplate(copy.pdpGalleryShowImageTemplate, { label: view.label })}
              >
                <div className="aspect-[4/5] w-full">
                  <TeeImage
                    src={view.src}
                    alt=""
                    w={320}
                    className="h-full w-full"
                    blurDataURL={onBlurForMain(view.src)}
                    sizes="72px"
                  />
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Main image */}
        <div
          className="relative min-w-0 flex-1 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          onKeyDown={handleGalleryKeyDown}
          tabIndex={0}
          role="region"
          aria-label={copy.pdpGalleryRegionAria}
        >
          {hasGalleryRail ? (
            <span id={galleryLiveRegionId} className="sr-only" aria-live="polite" aria-atomic="true">
              {galleryLiveText}
            </span>
          ) : null}
          <button
            type="button"
            className="block w-full overflow-hidden rounded-[8px] bg-[#e7dfd4] shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            onClick={onOpenLightbox}
            aria-label={fillPdpCopyTemplate(copy.pdpGalleryOpenFullScreenTemplate, { label: heroView.label })}
          >
            <div className="aspect-[4/5] w-full overflow-hidden md:aspect-auto md:h-[525px]">
              <TeeImage
                src={heroView.src}
                alt={heroView.alt}
                w={1600}
                eager
                className="h-full w-full"
                blurDataURL={onBlurForMain(heroView.src)}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
            </div>
          </button>

          {/* Prev / Next arrows */}
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone/55 bg-white/92 text-obsidian shadow-md backdrop-blur-sm transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:left-3 md:h-12 md:w-12"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSetPhotoIndex(photoIndex <= 0 ? gallery.length - 1 : photoIndex - 1);
                }}
                aria-label={copy.pdpGalleryPrev}
              >
                <IconChevronLeft />
              </button>
              <button
                type="button"
                className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-stone/55 bg-white/92 text-obsidian shadow-md backdrop-blur-sm transition-colors hover:border-obsidian hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:right-3 md:h-12 md:w-12"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSetPhotoIndex(photoIndex >= gallery.length - 1 ? 0 : photoIndex + 1);
                }}
                aria-label={copy.pdpGalleryNext}
              >
                <IconChevronRight />
              </button>
            </>
          ) : null}
        </div>
      </div>

      {/* Mobile horizontal thumbnail strip */}
      {hasGalleryRail ? (
        <div
          className="-mx-4 mt-[11px] grid grid-cols-5 gap-2 overflow-x-auto px-4 pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] touch-pan-x md:hidden"
          aria-label={copy.pdpGalleryThumbnailsAria}
        >
          {gallery.map((view, index) => (
            <button
              key={`${product.slug}-h-${view.key}`}
              type="button"
              onClick={() => onSetPhotoIndex(index)}
              className={`h-[82px] min-w-[68px] shrink-0 snap-start overflow-hidden rounded-[6px] border bg-[#ece4d9] transition-all focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                photoIndex === index
                  ? 'border-[#d4cbc0] opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              aria-pressed={photoIndex === index}
              aria-label={fillPdpCopyTemplate(copy.pdpGalleryShowImageTemplate, { label: view.label })}
            >
              <TeeImage
                src={view.src}
                alt=""
                w={320}
                className="h-full w-full object-cover"
                blurDataURL={onBlurForMain(view.src)}
                sizes="72px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
