import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { VIBES_SCHEMA } from '../data/domain-config';
import { getFeelingsHubHeroTiles, getSubfeelingCollectionVisual, imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import { getFeelings, getFeelingLines } from '../data/site';

export function ShopByFeeling() {
  const { copy } = useUiLocale();
  const feelings = getFeelings();
  const feelingLines = getFeelingLines();
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
                {feelings.length > 0
                  ? `Rendering ${feelings.length} live feeling ${feelings.length === 1 ? 'category' : 'categories'} from Medusa.`
                  : VIBES_SCHEMA.copy.hubSubtitle}
              </p>
            </div>
          </div>
        </section>

        {feelingLines.length > 0 ? (
          <section aria-labelledby="feeling-lines-heading" className="px-1">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">Browse by subcategory</p>
            <h2
              id="feeling-lines-heading"
              className="font-headline mt-2 text-[1.35rem] font-semibold tracking-tight text-obsidian md:text-[1.6rem]"
            >
              {feelingLines.length} live sub{feelingLines.length === 1 ? 'category' : 'categories'} from Medusa
            </h2>
            <p className="mt-2 max-w-2xl font-body text-sm text-warm-charcoal md:text-[0.98rem]">
              Each subcategory card is rendered from the native Medusa category tree. Add, rename, or delete a child category there and this section updates with it.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {feelingLines.map((line) => {
                const visual = getSubfeelingCollectionVisual(line.slug);
                return (
                  <Link
                    key={line.slug}
                    to={`/feelings/${line.feelingSlug}/${line.slug}`}
                    className="group relative isolate flex min-h-[14rem] flex-col overflow-hidden rounded-2xl border border-stone/20 bg-obsidian shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-h-[16rem]"
                  >
                    <img
                      src={imgUrl(visual.src, 720)}
                      alt={visual.alt}
                      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      width={720}
                      height={960}
                      loading="lazy"
                      decoding="async"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.1)_0%,rgba(18,18,18,0.45)_40%,rgba(18,18,18,0.88)_100%)]"
                      aria-hidden
                    />
                    <div className="relative mt-auto p-4 md:p-5">
                      <p className="font-headline text-lg font-semibold leading-tight text-white md:text-xl">{line.name}</p>
                      <p className="mt-2 font-body text-[13px] leading-snug text-white/92 line-clamp-3 md:text-sm">{line.blurb}</p>
                      <span className="font-label mt-3 inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.2em] text-white/95">
                        {VIBES_SCHEMA.copy.cardExploreCta}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="feelings-grid-title">
          <h2 id="feelings-grid-title" className="sr-only">
            {VIBES_SCHEMA.copy.hubEyebrow}
          </h2>
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

        <section
          aria-labelledby="feelings-editorial-title"
          className="px-2 py-6 md:py-7"
        >
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">Crawlable guide</p>
          <h2 id="feelings-editorial-title" className="font-headline mt-3 text-[1.45rem] font-semibold tracking-tight text-obsidian md:text-[1.8rem]">
            Native category-driven feeling browse
          </h2>
          <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-warm-charcoal md:text-[0.98rem]">
            <p>
              This page renders the top-level feeling cards directly from the active Medusa category children under the feelings root. If you add a new feeling category in Medusa, the storefront gains a new card. If you delete one, the card disappears here without code changes.
            </p>
            <p>
              Product browse pages follow the same category tree. Opening a feeling shows products assigned to that feeling branch, and child subcategories flow from the same native Medusa CRUD.
            </p>
          </div>
        </section>

        <section className="border-t border-stone/20 pt-6 md:pt-7">
          <p className="font-body text-sm text-clay/82">{VIBES_SCHEMA.copy.secondaryNavLabel}</p>
          <div className="mt-3 flex flex-wrap gap-3">
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
