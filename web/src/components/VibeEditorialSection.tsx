import { Link } from 'react-router-dom';
import type { VibeEditorialBlock } from '../data/homeEditorial';
import { imgUrl } from '../data/images';
import { productsByVibe } from '../data/site';
import { VibeAnimatedArt } from './VibeAnimatedArt';

type VibeEditorialSectionProps = {
  block: VibeEditorialBlock;
  onQuickView: (productSlug: string) => void;
};

/**
 * Long-form vibe story — lives on /vibes/:slug (moved from homepage lookbook).
 */
export function VibeEditorialSection({ block, onQuickView }: VibeEditorialSectionProps) {
  const showcaseProduct = productsByVibe(block.vibe.slug)[0];

  return (
    <article className="mb-10 overflow-hidden rounded-3xl border border-label/10 bg-white shadow-[0_16px_64px_rgba(26,26,26,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-label/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: block.vibe.accent }} aria-hidden />
          <span className="font-label text-xs font-medium uppercase tracking-[0.2em] text-label">{block.kicker}</span>
        </div>
        <Link
          to="/vibes"
          className="font-label inline-flex min-h-11 items-center gap-1 rounded-full border border-label/15 bg-papyrus/80 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-stone/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          All vibes
        </Link>
      </div>

      <div className="px-5 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          <div className="flex-1">
            <h2 className="font-headline text-[clamp(2rem,7vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-obsidian">{block.vibe.name}</h2>
            <p className="font-body mt-3 max-w-xl text-base text-dusk-violet md:text-lg">{block.vibe.tagline}</p>
          </div>
          <div className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-label/10 bg-papyrus/50 px-4 py-4 md:px-6 md:py-5">
            <VibeAnimatedArt slug={block.vibe.slug} accent={block.vibe.accent} />
          </div>
        </div>

        <div className="editorial-shadow mb-10 aspect-21/9 overflow-hidden rounded-xl">
          <img alt={block.wideAlt} className="h-full w-full object-cover" src={imgUrl(block.wideSrc, 1600)} loading="lazy" />
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <div className="glass-text-inner rounded-2xl px-5 py-5 sm:px-6 sm:py-6">
              <p className="font-body text-lg leading-relaxed text-warm-charcoal md:text-xl">{block.body}</p>
            </div>
          </div>
          <div className="flex flex-col items-center md:col-span-5">
            {block.detailLayout === 'video' ? (
              <div className="editorial-shadow relative aspect-video w-full overflow-hidden rounded-xl">
                <img alt={block.detailAlt} className="h-full w-full object-cover" src={imgUrl(block.detailSrc, 900)} loading="lazy" />
                {showcaseProduct?.merchandisingBadge ? (
                  <span className="font-label absolute left-3 top-3 z-10 rounded border border-desert-sand bg-[rgba(255,245,230,0.92)] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-label shadow-sm">
                    {showcaseProduct.merchandisingBadge}
                  </span>
                ) : null}
                {showcaseProduct ? (
                  <button
                    type="button"
                    onClick={() => onQuickView(showcaseProduct.slug)}
                    className="quick-view-pill font-label absolute bottom-3 left-3 right-3 z-10 min-h-12 rounded-full px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.2em] text-obsidian transition-shadow hover:shadow-lg"
                    aria-label={`Quick view: ${showcaseProduct.name}`}
                  >
                    Quick view
                  </button>
                ) : null}
              </div>
            ) : block.detailLayout === 'square' ? (
              <div className="relative aspect-square w-48 overflow-hidden rounded-full border border-label/10">
                <img alt={block.detailAlt} className="h-full w-full object-cover grayscale" src={imgUrl(block.detailSrc, 600)} loading="lazy" />
                {showcaseProduct?.merchandisingBadge ? (
                  <span className="font-label absolute left-2 top-2 z-10 max-w-[calc(100%-1rem)] rounded border border-desert-sand bg-[rgba(255,245,230,0.92)] px-1.5 py-0.5 text-[7px] font-semibold uppercase leading-tight tracking-[0.12em] text-label shadow-sm">
                    {showcaseProduct.merchandisingBadge}
                  </span>
                ) : null}
                {showcaseProduct ? (
                  <button
                    type="button"
                    onClick={() => onQuickView(showcaseProduct.slug)}
                    className="quick-view-pill quick-view-pill--compact font-label absolute bottom-2 left-2 right-2 z-10 rounded-full text-center font-medium uppercase text-obsidian transition-shadow hover:shadow-md"
                    aria-label={`Quick view: ${showcaseProduct.name}`}
                  >
                    Quick view
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="relative aspect-3/4 w-48 overflow-hidden rounded-xl">
                <img alt={block.detailAlt} className="h-full w-full object-cover" src={imgUrl(block.detailSrc, 600)} loading="lazy" />
                {showcaseProduct?.merchandisingBadge ? (
                  <span className="font-label absolute left-2 top-2 z-10 rounded border border-desert-sand bg-[rgba(255,245,230,0.92)] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-label shadow-sm">
                    {showcaseProduct.merchandisingBadge}
                  </span>
                ) : null}
                {showcaseProduct ? (
                  <button
                    type="button"
                    onClick={() => onQuickView(showcaseProduct.slug)}
                    className="quick-view-pill quick-view-pill--compact font-label absolute bottom-2 left-2 right-2 z-10 rounded-full text-center font-medium uppercase text-obsidian transition-shadow hover:shadow-md"
                    aria-label={`Quick view: ${showcaseProduct.name}`}
                  >
                    Quick view
                  </button>
                ) : null}
              </div>
            )}
            <span className="font-label mt-3 text-[10px] font-medium uppercase tracking-widest text-label/60">{block.detailCaption}</span>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-label/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-clay">Ready to browse? See all designs in this vibe.</p>
          <a
            href="#vibe-collection-products"
            className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-obsidian shadow-md transition-all hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            Shop designs ↓
          </a>
        </div>
      </div>
    </article>
  );
}
