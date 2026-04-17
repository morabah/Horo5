import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { VIBES_SCHEMA } from '../data/domain-config';
import { getFeelingsHubHeroTiles, heroVectorizedV2, imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import { getFeelings } from '../data/site';

export function ShopByFeeling() {
  const { copy } = useUiLocale();
  const feelings = getFeelings();
  const heroTiles = getFeelingsHubHeroTiles();
  const heroTileCount = Math.max(1, heroTiles.length);
  const [brokenHeroTiles, setBrokenHeroTiles] = useState<Record<string, boolean>>({});
  const safeHeroTiles = useMemo(
    () =>
      heroTiles.map((tile) => ({
        ...tile,
        src: brokenHeroTiles[tile.slug] ? heroVectorizedV2 : tile.src,
      })),
    [brokenHeroTiles, heroTiles],
  );

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[
            { label: copy.shell.home, to: '/' },
            { label: copy.shell.shopByFeeling },
          ]}
        />
        <section
          className="relative isolate overflow-hidden"
          aria-label={VIBES_SCHEMA.copy.hubHeroAlt}
        >
          <div
            className="grid min-h-[26rem] grid-cols-2 gap-0.5 bg-obsidian sm:min-h-[30rem] sm:grid-cols-3 sm:gap-1 lg:min-h-[34rem] lg:[grid-template-columns:repeat(var(--hero-tile-count),minmax(0,1fr))]"
            style={{ ['--hero-tile-count' as string]: String(heroTileCount) }}
          >
            {safeHeroTiles.map((tile) => (
              <img
                key={tile.slug}
                src={imgUrl(tile.src, 900)}
                alt={tile.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: tile.objectPosition }}
                width={900}
                height={1200}
                decoding="async"
                onError={() =>
                  setBrokenHeroTiles((current) =>
                    current[tile.slug] ? current : { ...current, [tile.slug]: true })
                }
              />
            ))}
          </div>
          {/* Minimal vignette — photos are the hero */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.2)_100%)]"
            aria-hidden
          />

          {/* Bottom glass bar — headline only */}
          <div className="absolute inset-x-0 bottom-0">
            <div className="feelings-hub-glass-bar flex items-center justify-center px-4 py-5 sm:py-6">
              <h1 className="text-center font-headline text-[clamp(1.5rem,5vw,2.5rem)] font-semibold leading-tight tracking-tight text-white">
                {VIBES_SCHEMA.copy.hubTitle}
              </h1>
            </div>
          </div>

          {/* Shop All pill — top left */}
          <div className="absolute left-4 top-4 sm:left-6 sm:top-6 md:left-8 md:top-8">
            <Link
              to="/products"
              className="feelings-hub-glass-pill font-label inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:text-[10px]"
            >
              {copy.shell.shopAll}
              <span className="text-white/50" aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section aria-labelledby="feelings-grid-title" className="bg-papyrus px-4 pb-16 pt-10 sm:px-6 md:px-8 md:pb-20 md:pt-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">Start here</p>
                <h2
                  id="feelings-grid-title"
                  className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]"
                >
                  Browse by feeling, then filter inside
                </h2>
              </div>
              <Link
                to="/products"
                className="font-label inline-flex min-h-11 items-center text-[11px] font-semibold uppercase tracking-[0.18em] text-deep-teal transition-colors hover:text-obsidian"
              >
                {copy.shell.shopAll}
              </Link>
            </div>
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7 xl:grid-cols-4">
              {feelings.map((feeling) => (
                <VibeCommerceCard
                  key={feeling.slug}
                  feeling={feeling}
                  titleTag="h3"
                  variant="explore"
                  className="h-full min-h-[23rem] sm:min-h-[25rem]"
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
