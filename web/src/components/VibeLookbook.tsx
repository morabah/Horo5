import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { vibeEditorialBlocks } from '../data/homeEditorial';
import type { VibeEditorialBlock } from '../data/homeEditorial';
import { heroStreet, imgUrl, vibeCovers } from '../data/images';
import { getVibeMaterialIcon } from '../data/vibeIcons';
import { vibes } from '../data/site';

const VIBE_QUERY = 'vibe';
const RETURN_VIBE_KEY = 'horo_home_vibe';

const vibeSlugSet = new Set(vibes.map((v) => v.slug));

export function VibeLookbook() {
  const [searchParams, setSearchParams] = useSearchParams();
  const stripRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const editorialStackRef = useRef<HTMLDivElement>(null);
  const [scrollActiveSlug, setScrollActiveSlug] = useState<string | null>(null);

  const vibeParam = searchParams.get(VIBE_QUERY);
  const urlSlug = useMemo(
    () => (vibeParam && vibeSlugSet.has(vibeParam) ? vibeParam : null),
    [vibeParam],
  );

  const setVibeQuery = useCallback(
    (slug: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (slug) next.set(VIBE_QUERY, slug);
          else next.delete(VIBE_QUERY);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Card ring: scroll position first, then URL (e.g. before intersection runs or right after a tap) */
  const highlightedSlug = scrollActiveSlug ?? urlSlug;

  /** Only update URL here — one effect below handles scrolling (avoids double scroll + bounce). */
  const scrollToEditorial = useCallback(
    (slug: string) => {
      setVibeQuery(slug);
    },
    [setVibeQuery],
  );

  /** Observe editorial sections so card rings follow you as you scroll */
  useEffect(() => {
    const root = editorialStackRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-home-vibe-section]'));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const candidates = entries
          .filter((e) => e.isIntersecting && e.target instanceof HTMLElement)
          .map((e) => ({
            el: e.target as HTMLElement,
            ratio: e.intersectionRatio,
          }))
          .sort((a, b) => b.ratio - a.ratio);

        const best = candidates[0];
        if (best?.el.dataset.vibeSlug) {
          setScrollActiveSlug(best.el.dataset.vibeSlug);
        }
      },
      {
        root: null,
        rootMargin: '-42% 0px -42% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  /** Drop invalid ?vibe= values from the URL */
  useEffect(() => {
    if (vibeParam && !vibeSlugSet.has(vibeParam)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(VIBE_QUERY);
          return next;
        },
        { replace: true },
      );
    }
  }, [vibeParam, setSearchParams]);

  useEffect(() => {
    if (vibeParam && vibeSlugSet.has(vibeParam)) {
      try {
        sessionStorage.removeItem(RETURN_VIBE_KEY);
      } catch {
        /* ignore */
      }
    }
  }, [vibeParam]);

  useEffect(() => {
    if (searchParams.get(VIBE_QUERY)) return;
    try {
      const stored = sessionStorage.getItem(RETURN_VIBE_KEY);
      if (stored && vibeSlugSet.has(stored)) {
        sessionStorage.removeItem(RETURN_VIBE_KEY);
        setVibeQuery(stored);
      }
    } catch {
      /* ignore */
    }
  }, [searchParams, setVibeQuery]);

  /**
   * When ?vibe= changes: (1) move the horizontal strip only — never scrollIntoView on the card
   * (that scrolls the window vertically and fights the editorial scroll). (2) Then scroll to editorial once.
   */
  useEffect(() => {
    if (!urlSlug) return;
    const strip = stripRef.current;
    const card = cardRefs.current.get(urlSlug);

    if (strip && card && strip.scrollWidth > strip.clientWidth + 2) {
      const targetLeft = card.offsetLeft - strip.clientWidth / 2 + card.offsetWidth / 2;
      strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'auto' });
    }

    const t = window.setTimeout(() => {
      document.getElementById(`vibe-editorial-${urlSlug}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 32);
    return () => clearTimeout(t);
  }, [urlSlug]);

  const scrollStripBy = useCallback((delta: number) => {
    stripRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const scrollToVibeMenu = useCallback(() => {
    try {
      sessionStorage.removeItem(RETURN_VIBE_KEY);
    } catch {
      /* ignore */
    }
    setVibeQuery(null);
    requestAnimationFrame(() => {
      document.getElementById('vibe-lookbook-menu')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }, [setVibeQuery]);

  return (
    <section className="bg-papyrus px-4 pb-24 sm:px-6 sm:pb-32 lg:px-8 lg:pb-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 border-b border-label/15 pb-6 sm:mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <span className="font-headline text-base font-semibold uppercase tracking-[0.18em] text-label sm:text-lg md:text-xl">
              Find your vibe
            </span>
            <span className="font-body text-sm text-clay/70 md:text-base">Volume 01 / Lookbook</span>
          </div>
          <p className="font-body mt-3 max-w-2xl text-sm text-clay/90 sm:text-[15px]">
            <span className="lg:hidden">Swipe the row, then scroll down — every vibe has a full story.</span>
            <span className="hidden lg:inline">All five vibes above — scroll down to read each one in full.</span>
          </p>
        </div>

        <div
          id="vibe-lookbook-menu"
          className="relative scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:scroll-mt-32"
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-papyrus via-papyrus/80 to-transparent sm:w-12 lg:hidden"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-papyrus via-papyrus/80 to-transparent sm:w-12 lg:hidden"
            aria-hidden
          />

          <button
            type="button"
            onClick={() => scrollStripBy(-320)}
            className="font-label absolute left-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-label/15 bg-white/95 text-obsidian shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:left-1 lg:hidden"
            aria-label="Slide vibes left"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={() => scrollStripBy(320)}
            className="font-label absolute right-0 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-label/15 bg-white/95 text-obsidian shadow-md backdrop-blur-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:right-1 lg:hidden"
            aria-label="Slide vibes right"
          >
            <span className="material-symbols-outlined text-[22px]">chevron_right</span>
          </button>

          <div
            ref={stripRef}
            className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth overscroll-x-contain px-12 pb-3 pt-1 [scrollbar-width:none] touch-pan-x sm:gap-4 sm:px-14 [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-3 lg:pt-1 xl:gap-4"
          >
            {vibes.map((v) => {
              const cover = vibeCovers[v.slug] ?? heroStreet;
              const isActive = highlightedSlug === v.slug;

              return (
                <button
                  key={v.slug}
                  ref={(node) => {
                    if (node) cardRefs.current.set(v.slug, node);
                    else cardRefs.current.delete(v.slug);
                  }}
                  type="button"
                  onClick={() => scrollToEditorial(v.slug)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`group flex h-[min(360px,50vh)] w-[min(100%,280px)] shrink-0 snap-center snap-always flex-col overflow-hidden rounded-2xl text-left shadow-[0_8px_30px_rgba(26,26,26,0.12)] ring-1 transition-[transform,box-shadow] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:h-[380px] sm:w-[260px] md:h-[400px] md:w-[240px] lg:h-[min(340px,38vh)] lg:min-w-0 lg:w-full lg:shrink lg:snap-none xl:h-[min(380px,40vh)] ${
                    isActive
                      ? 'ring-2 ring-deep-teal/50 shadow-[0_16px_48px_rgba(43,117,150,0.18)]'
                      : 'ring-black/5 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(26,26,26,0.18)]'
                  }`}
                >
                  <div className="relative min-h-0 flex-1">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${imgUrl(cover, 960)})` }}
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 top-[38%] bg-gradient-to-t from-black/45 via-black/10 to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr opacity-25"
                      style={{
                        background: `linear-gradient(to top right, ${v.accent}55, transparent 50%)`,
                      }}
                      aria-hidden
                    />
                    {isActive ? (
                      <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-deep-teal text-white shadow-lg">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    ) : null}
                  </div>

                  <div className="glass-vibe-card-footer vibe-card-text-strip shrink-0 overflow-hidden border-t border-white/80 px-3 py-2.5 sm:px-3.5">
                    <div className="glass-text-inner flex items-start gap-2.5 px-3 py-2.5">
                      <span
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ring-2 ring-white/90"
                        style={{ backgroundColor: v.accent }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <h2 className="glass-text-heading font-headline mb-0.5 text-base font-semibold leading-tight tracking-tight text-obsidian lg:text-sm xl:text-base">
                          {v.name}
                        </h2>
                        <p className="font-body line-clamp-2 text-[13px] leading-snug text-warm-charcoal lg:line-clamp-2 lg:text-[11px] xl:text-[13px]">
                          {v.tagline}
                        </p>
                        <span className="font-label mt-1.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-deep-teal drop-shadow-sm">
                          Read below ↓
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* All vibe stories stacked — scroll the page to read each one */}
        <div
          ref={editorialStackRef}
          className="mt-14 space-y-14 md:mt-20 md:space-y-20 lg:space-y-24"
        >
          {vibeEditorialBlocks.map((block) => (
            <div
              key={block.vibe.slug}
              id={`vibe-editorial-${block.vibe.slug}`}
              className="scroll-mt-[calc(5.5rem+env(safe-area-inset-top,0px))] md:scroll-mt-32"
            >
              <VibeEditorialSection
                block={block}
                onBackToMenu={scrollToVibeMenu}
                onBeforeShopNavigate={() => {
                  try {
                    sessionStorage.setItem(RETURN_VIBE_KEY, block.vibe.slug);
                  } catch {
                    /* ignore */
                  }
                }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={scrollToVibeMenu}
          className="font-label fixed bottom-[max(1.25rem,env(safe-area-inset-bottom,0px)+0.5rem)] right-[max(1rem,env(safe-area-inset-right,0px))] z-40 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full border border-label/15 bg-white/95 text-obsidian shadow-[0_8px_32px_rgba(26,26,26,0.18)] backdrop-blur-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:bottom-8 md:right-8 md:h-auto md:w-auto md:rounded-2xl md:px-5 md:py-3"
          aria-label="Back to vibe cards"
        >
          <span className="material-symbols-outlined text-2xl md:text-[26px]">arrow_upward</span>
          <span className="hidden text-[9px] font-semibold uppercase tracking-[0.2em] md:block">Vibes</span>
        </button>
      </div>
    </section>
  );
}

function VibeEditorialSection({
  block,
  onBackToMenu,
  onBeforeShopNavigate,
}: {
  block: VibeEditorialBlock;
  onBackToMenu: () => void;
  onBeforeShopNavigate: () => void;
}) {
  const iconName = getVibeMaterialIcon(block.vibe.slug);

  return (
    <article
      data-home-vibe-section
      data-vibe-slug={block.vibe.slug}
      className="overflow-hidden rounded-3xl border border-label/10 bg-white shadow-[0_16px_64px_rgba(26,26,26,0.08)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-label/10 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: block.vibe.accent }} aria-hidden />
          <span className="font-label text-xs font-medium uppercase tracking-[0.2em] text-label">{block.kicker}</span>
        </div>
        <button
          type="button"
          onClick={onBackToMenu}
          className="font-label inline-flex min-h-11 items-center gap-1.5 rounded-full border border-label/15 bg-papyrus/80 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-obsidian transition-colors hover:bg-stone/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          <span className="material-symbols-outlined text-[18px] leading-none">arrow_upward</span>
          Vibe menu
        </button>
      </div>

      <div className="px-5 py-8 sm:px-8 sm:py-12 md:px-12 md:py-16">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
          <div className="flex-1">
            <h3 className="font-headline text-[clamp(2rem,7vw,3.5rem)] font-bold leading-[1.05] tracking-tighter text-obsidian">
              {block.vibe.name}
            </h3>
            <p className="font-body mt-3 max-w-xl text-base text-dusk-violet md:text-lg">{block.vibe.tagline}</p>
          </div>
          <div
            className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-label/10 bg-papyrus/50 px-6 py-5"
            aria-hidden
          >
            <span
              className="material-symbols-outlined text-[48px] leading-none md:text-[56px]"
              style={{
                color: block.vibe.accent,
                fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24",
              }}
            >
              {iconName}
            </span>
          </div>
        </div>

        <div className="editorial-shadow mb-10 aspect-[21/9] overflow-hidden rounded-xl">
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
              <div className="editorial-shadow aspect-video w-full overflow-hidden rounded-xl">
                <img alt={block.detailAlt} className="h-full w-full object-cover" src={imgUrl(block.detailSrc, 900)} loading="lazy" />
              </div>
            ) : block.detailLayout === 'square' ? (
              <div className="aspect-square w-48 overflow-hidden rounded-full border border-label/10">
                <img alt={block.detailAlt} className="h-full w-full object-cover grayscale" src={imgUrl(block.detailSrc, 600)} loading="lazy" />
              </div>
            ) : (
              <div className="aspect-[3/4] w-48 overflow-hidden rounded-xl">
                <img alt={block.detailAlt} className="h-full w-full object-cover" src={imgUrl(block.detailSrc, 600)} loading="lazy" />
              </div>
            )}
            <span className="font-label mt-3 text-[10px] font-medium uppercase tracking-widest text-label/60">{block.detailCaption}</span>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-label/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-sm text-clay">Ready to browse? See all designs in this vibe.</p>
          <Link
            to={`/vibes/${block.vibe.slug}`}
            onClick={onBeforeShopNavigate}
            className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-obsidian shadow-md transition-all hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            Shop {block.vibe.name} →
          </Link>
        </div>
      </div>
    </article>
  );
}
