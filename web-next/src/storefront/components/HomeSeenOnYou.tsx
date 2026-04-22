import { HOME_SEEN_ON_YOU } from '../data/homeContent';
import { getProductComparisonImageSrc, heroVectorizedV2, imgUrl } from '../data/images';
import { getProducts, productHasRealImage } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

function isCuratedAsset(src: string | undefined) {
  return Boolean(src && src.trim() && src !== heroVectorizedV2);
}

export function HomeDetailFallback() {
  const { copy } = useUiLocale();
  const proofProduct = getProducts().find(productHasRealImage);
  const proofImageSrc = proofProduct ? getProductComparisonImageSrc(proofProduct) : '';

  return (
    <section
      aria-labelledby="home-detail-fallback-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className={`home-detail-fallback mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:items-stretch ${
        proofImageSrc ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]' : ''
      }`}>
        <div className="flex flex-col justify-center p-6 md:p-8" data-reveal>
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {copy.home.seenOnYouTitle}
          </p>
          <h2 id="home-detail-fallback-title" className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
            {copy.home.detailFallbackTitle}
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-warm-charcoal md:text-base">
            {copy.home.detailFallbackBody}
          </p>
        </div>
        {proofImageSrc ? (
          <div className="relative min-h-[220px] bg-linen md:min-h-[320px]" data-reveal="stagger-1">
            <TeeImage
              src={imgUrl(proofImageSrc, 1000)}
              alt={proofProduct ? `HORO ${proofProduct.name} product detail.` : 'HORO product detail.'}
              w={1000}
              className="h-full w-full"
              objectPosition="center 18%"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function HomeSeenOnYou() {
  const { copy } = useUiLocale();
  const entries = HOME_SEEN_ON_YOU.filter((entry) => isCuratedAsset(entry.imageSrc)).slice(0, 6);

  if (entries.length < 4) {
    return <HomeDetailFallback />;
  }

  return (
    <section
      aria-labelledby="home-seen-on-you-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="home-seen-on-you-title"
          data-reveal
          className="font-headline text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
        >
          {copy.home.seenOnYouTitle}
        </h2>
        <div className="home-ugc-grid mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {entries.map((entry, index) => {
            const reveal = (['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[index % 4];
            return (
              <figure
                key={`${entry.imageSrc}-${index}`}
                data-reveal={reveal}
                className="overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)]"
              >
                <div className="relative aspect-[4/5] bg-linen">
                  <TeeImage
                    src={imgUrl(entry.imageSrc, 900)}
                    alt={entry.imageAlt}
                    w={900}
                    className="h-full w-full"
                  />
                </div>
                {entry.handle ? (
                  <figcaption className="font-body px-3 py-2 text-[13px] text-warm-charcoal">
                    {entry.handle}
                  </figcaption>
                ) : null}
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
