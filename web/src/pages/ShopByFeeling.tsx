import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { VIBES_SCHEMA } from '../data/domain-config';
import { getFeelingsHubHeroTiles, imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import { getFeelings } from '../data/site';

export function ShopByFeeling() {
  const { copy } = useUiLocale();
  const feelings = getFeelings();
  const heroTiles = getFeelingsHubHeroTiles();
  const heroTileCount = Math.max(1, heroTiles.length);

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
            className="grid min-h-[28rem] grid-cols-2 gap-1 bg-obsidian sm:min-h-[32rem] sm:grid-cols-3 sm:gap-2 lg:[grid-template-columns:repeat(var(--hero-tile-count),minmax(0,1fr))]"
            style={{ ['--hero-tile-count' as string]: String(heroTileCount) }}
          >
            {heroTiles.map((tile) => (
              <img
                key={tile.slug}
                src={imgUrl(tile.src, 900)}
                alt={tile.alt}
                className="h-full w-full object-cover"
                style={{ objectPosition: tile.objectPosition }}
                width={900}
                height={1200}
                decoding="async"
              />
            ))}
          </div>
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.12)_0%,rgba(18,18,18,0.28)_35%,rgba(18,18,18,0.82)_100%)]"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl rounded-2xl border border-white/12 bg-obsidian/82 px-5 py-5 shadow-[0_24px_56px_-28px_rgba(0,0,0,0.75)] backdrop-blur-md sm:px-6 sm:py-6 md:px-7 md:py-7">
              <p className="font-label mb-2 text-[10px] font-medium uppercase tracking-[0.26em] text-stone sm:text-[11px]">
                {VIBES_SCHEMA.copy.hubEyebrow}
              </p>
              <h1 className="font-headline text-[clamp(2rem,5vw,4.1rem)] font-semibold leading-[0.94] tracking-tight text-white">
                {VIBES_SCHEMA.copy.hubTitle}
              </h1>
              <p className="mt-3 max-w-xl font-body text-[0.98rem] leading-relaxed text-white/95 sm:mt-4 sm:text-[1.05rem]">
                Start with a feeling if you want a tighter edit. If you just want to browse tees fast, jump straight to Shop All and filter later.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/products"
                  className="font-label inline-flex min-h-11 items-center justify-center rounded-sm border border-white/25 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-obsidian transition-colors hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {copy.shell.shopAll}
                </Link>
                <Link
                  to="/occasions"
                  className="font-label inline-flex min-h-11 items-center justify-center rounded-sm border border-white/20 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {copy.shell.shopByMoment}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="feelings-grid-title">
          <div className="flex flex-col gap-3 px-1 md:flex-row md:items-end md:justify-between">
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
                titleTag="h2"
                variant="explore"
                className="h-full min-h-[23rem] sm:min-h-[25rem]"
              />
            ))}
          </div>
        </section>

        <section className="border-t border-stone/20 pt-6 md:pt-7">
          <p className="font-body text-sm text-clay/82">{VIBES_SCHEMA.copy.secondaryNavLabel}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="btn btn-secondary text-sm" to="/products">
              {copy.shell.shopAll}
            </Link>
            <Link className="btn btn-secondary text-sm" to="/occasions">
              {copy.shell.shopByMoment}
            </Link>
          </div>
        </section>
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
