import { Link } from 'react-router-dom';
import { HOME_PRIMARY_ROUTES } from '../data/homeContent';
import {
  getFeelingCollectionVisual,
  getOccasionCollectionVisual,
  heroVectorizedV2,
  imgUrl,
} from '../data/images';
import { getFeelings, getOccasions } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';

function byHomepageOrder<T extends { active?: boolean; sortOrder?: number }>(items: T[]) {
  return items
    .filter((item) => item.active !== false)
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (a.item.sortOrder ?? a.index) - (b.item.sortOrder ?? b.index) || a.index - b.index)
    .map((entry) => entry.item);
}

function getRouteVisual(routeKey: (typeof HOME_PRIMARY_ROUTES)[number]['key']) {
  if (routeKey === 'feeling') {
    const feeling = byHomepageOrder(getFeelings())[0];
    if (!feeling) return '';
    const visual = getFeelingCollectionVisual(feeling.slug);
    const src = visual.cover.src || visual.hero.src || visual.proof.src;
    return src && src !== heroVectorizedV2 ? src : '';
  }

  const occasion = byHomepageOrder(getOccasions())[0];
  if (!occasion) return '';
  const visual = getOccasionCollectionVisual(occasion.slug);
  const src = visual.hero.src || visual.proof.src || occasion.cardImageSrc;
  return src && src !== heroVectorizedV2 ? src : '';
}

export function HomePrimaryRoutes() {
  const { copy } = useUiLocale();

  return (
    <section
      aria-labelledby="home-primary-routes-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-8 sm:px-5 md:py-12 lg:px-8"
    >
      <h2 id="home-primary-routes-title" className="sr-only">
        {copy.shell.shopHeading}
      </h2>
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          {HOME_PRIMARY_ROUTES.map((route) => {
            const isFeeling = route.key === 'feeling';
            const title = isFeeling ? copy.home.routesFeelingLabel : copy.home.routesOccasionLabel;
            const body = isFeeling ? copy.home.routesFeelingBlurb : copy.home.routesOccasionBlurb;
            const imageSrc = getRouteVisual(route.key);

            return (
              <Link
                key={route.key}
                to={route.href}
                className={`home-route-card group relative isolate flex min-h-[132px] overflow-hidden rounded-[18px] border border-stone/55 p-5 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.2)] transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal md:min-h-[190px] md:p-6 ${
                  imageSrc ? 'bg-obsidian text-white' : 'bg-white/82 text-obsidian'
                }`}
                data-reveal
              >
                {imageSrc ? (
                  <img
                    src={imgUrl(imageSrc, 1000)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : null}
                <span
                  aria-hidden
                  className={`absolute inset-0 ${
                    imageSrc
                      ? 'bg-linear-to-r from-obsidian/78 via-obsidian/46 to-obsidian/16'
                      : 'bg-linear-to-r from-white/0 to-linen/55'
                  }`}
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1.5"
                  style={{ backgroundColor: route.accent }}
                />
                <span className="relative mt-auto flex max-w-[86%] flex-col justify-end gap-3">
                  <span className="font-headline text-[1.35rem] font-semibold leading-tight tracking-tight md:text-[1.65rem]">
                    {title}
                  </span>
                  <span className={`font-body text-[15px] leading-snug md:text-base ${imageSrc ? 'text-white/84' : 'text-warm-charcoal'}`}>
                    {body}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-5 text-center">
          <Link
            to="/products"
            className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {copy.home.routesBrowseAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
