import { Link } from 'react-router-dom';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { VibeCommerceCard } from '../components/VibeCommerceCard';
import { VIBES_SCHEMA } from '../data/domain-config';
import { vibeEditorialBlocks } from '../data/homeEditorial';
import { imgUrl, vibesHubHeroTiles } from '../data/images';
import { NAV_ROUTE } from '../lib/navLinks';
import { vibes } from '../data/site';

export function ShopByVibe() {
  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[
            { label: 'Home', to: '/' },
            { label: NAV_ROUTE.collection.label },
          ]}
        />
        <section
          className="relative isolate overflow-hidden"
          aria-label={VIBES_SCHEMA.copy.hubHeroAlt}
        >
          <div className="grid min-h-[28rem] grid-cols-5 gap-1 bg-obsidian sm:min-h-[32rem] sm:gap-2">
            {vibesHubHeroTiles.map((tile) => (
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
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.08)_0%,rgba(18,18,18,0.18)_30%,rgba(18,18,18,0.76)_100%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_34%),radial-gradient(circle_at_top_right,rgba(212,162,78,0.18),transparent_30%)]"
            aria-hidden
          />

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
            <div className="max-w-2xl px-2 py-4">
              <p className="font-label mb-2 text-[10px] font-medium uppercase tracking-[0.26em] text-white/76 sm:text-[11px]">
                {VIBES_SCHEMA.copy.hubEyebrow}
              </p>
              <h1 className="font-headline text-[clamp(2rem,5vw,4.1rem)] font-semibold leading-[0.94] tracking-tight text-white">
                {VIBES_SCHEMA.copy.hubTitle}
              </h1>
              <p className="mt-3 max-w-xl font-body text-[0.98rem] leading-relaxed text-white/86 sm:mt-4 sm:text-[1.05rem]">
                {VIBES_SCHEMA.copy.hubSubtitle}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="vibes-grid-title">
          <h2 id="vibes-grid-title" className="sr-only">
            {VIBES_SCHEMA.copy.hubEyebrow}
          </h2>
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-6 lg:gap-7">
            {vibes.map((vibe, index) => {
              const desktopPosition =
                index === 3 ? 'lg:col-start-2 lg:col-span-2' : index === 4 ? 'lg:col-start-4 lg:col-span-2' : 'lg:col-span-2';

              return (
                <VibeCommerceCard
                  key={vibe.slug}
                  vibe={vibe}
                  titleTag="h2"
                  variant="explore"
                  className={['h-full min-h-[23rem] sm:min-h-[25rem]', desktopPosition].join(' ')}
                />
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="vibes-editorial-title"
          className="px-2 py-6 md:py-7"
        >
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">Crawlable guide</p>
          <h2 id="vibes-editorial-title" className="font-headline mt-3 text-[1.45rem] font-semibold tracking-tight text-obsidian md:text-[1.8rem]">
            Graphic tees for every mood and story
          </h2>
          <div className="mt-4 space-y-4 font-body text-sm leading-relaxed text-warm-charcoal md:text-[0.98rem]">
            <p>
              Start with{' '}
              <Link className="font-medium text-deep-teal underline decoration-deep-teal/30 underline-offset-4" to={`/vibes/${vibeEditorialBlocks[0].vibe.slug}`}>
                {vibeEditorialBlocks[0].vibe.name} graphic tees
              </Link>
              ,{' '}
              <Link className="font-medium text-deep-teal underline decoration-deep-teal/30 underline-offset-4" to={`/vibes/${vibeEditorialBlocks[1].vibe.slug}`}>
                {vibeEditorialBlocks[1].vibe.name} streetwear
              </Link>
              ,{' '}
              <Link className="font-medium text-deep-teal underline decoration-deep-teal/30 underline-offset-4" to={`/vibes/${vibeEditorialBlocks[2].vibe.slug}`}>
                {vibeEditorialBlocks[2].vibe.name} designs
              </Link>
              , or{' '}
              <Link className="font-medium text-deep-teal underline decoration-deep-teal/30 underline-offset-4" to={`/vibes/${vibeEditorialBlocks[3].vibe.slug}`}>
                {vibeEditorialBlocks[3].vibe.name} oversized tees
              </Link>
              {' '}depending on whether you are shopping by feeling, sign, story, or ambition.
            </p>
            <p>
              HORO organizes graphic t-shirts around real browsing intent, so shoppers in Egypt can move from abstract taste to a concrete collection without losing the product story or the practical buying cues.
            </p>
          </div>
        </section>

        <section className="border-t border-stone/20 pt-6 md:pt-7">
          <p className="font-body text-sm text-clay/82">{VIBES_SCHEMA.copy.secondaryNavLabel}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="btn btn-secondary text-sm" to="/occasions">
              {VIBES_SCHEMA.copy.secondaryNavCta}
            </Link>
          </div>
        </section>
      </div>

      <RecentlyViewedStrip className="border-t border-stone/20" />
    </div>
  );
}
