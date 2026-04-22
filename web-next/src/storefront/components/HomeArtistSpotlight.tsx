import { Link } from 'react-router-dom';
import { HOME_FEATURED_ARTIST } from '../data/homeContent';
import { getProductComparisonImageSrc, heroVectorizedV2, imgUrl } from '../data/images';
import { getArtist, getArtists, getProducts, productHasRealImage } from '../data/site';
import { useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

function isCuratedAsset(src: string | undefined) {
  return Boolean(src && src.trim() && src !== heroVectorizedV2);
}

export function HomeCraftFallback() {
  const { copy } = useUiLocale();
  const proofProduct = getProducts().find(productHasRealImage);
  const proofImageSrc = proofProduct ? getProductComparisonImageSrc(proofProduct) : '';

  return (
    <section
      aria-labelledby="home-craft-fallback-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className={`home-detail-fallback mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:items-stretch ${
        proofImageSrc ? 'md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]' : ''
      }`}>
        {proofImageSrc ? (
          <div className="relative min-h-[220px] bg-papyrus md:min-h-[320px]" data-reveal>
            <TeeImage
              src={imgUrl(proofImageSrc, 1000)}
              alt={proofProduct ? `HORO ${proofProduct.name} artwork and print detail.` : 'HORO artwork and print detail.'}
              w={1000}
              className="h-full w-full"
              objectPosition="center 18%"
            />
          </div>
        ) : null}
        <div className="flex flex-col justify-center p-6 md:p-8" data-reveal="stagger-1">
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {copy.home.artistSpotlightTitle}
          </p>
          <h2 id="home-craft-fallback-title" className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
            {copy.home.craftFallbackTitle}
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-warm-charcoal md:text-base">
            {copy.home.craftFallbackBody}
          </p>
        </div>
      </div>
    </section>
  );
}

export function HomeArtistSpotlight() {
  const { copy } = useUiLocale();

  const configuredArtist =
    HOME_FEATURED_ARTIST && isCuratedAsset(HOME_FEATURED_ARTIST.imageSrc)
      ? {
          artist: getArtist(HOME_FEATURED_ARTIST.artistSlug),
          imageAlt: HOME_FEATURED_ARTIST.imageAlt,
          imageSrc: HOME_FEATURED_ARTIST.imageSrc,
          line: HOME_FEATURED_ARTIST.line,
        }
      : null;

  const medusaArtist = configuredArtist?.artist
    ? configuredArtist
    : getArtists()
        .filter((artist) => artist.active !== false && isCuratedAsset(artist.avatarSrc))
        .sort((a, b) => b.designCount - a.designCount || a.name.localeCompare(b.name))
        .map((artist) => ({
          artist,
          imageAlt: artist.name,
          imageSrc: artist.avatarSrc ?? '',
          line: artist.style,
        }))[0] ?? null;

  const artist = medusaArtist?.artist;
  if (!artist) {
    return <HomeCraftFallback />;
  }

  return (
    <section
      aria-labelledby="home-artist-spotlight-title"
      className="border-t border-stone/20 bg-linen px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="home-artist-spotlight mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[18px] border border-stone/55 bg-white/82 shadow-[0_18px_44px_-30px_rgba(26,26,26,0.18)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] md:items-stretch">
        <div className="relative min-h-[220px] bg-papyrus md:min-h-[320px]" data-reveal>
          <TeeImage
            src={imgUrl(medusaArtist.imageSrc, 1000)}
            alt={medusaArtist.imageAlt}
            w={1000}
            className="h-full w-full"
          />
        </div>
        <div className="flex flex-col justify-center p-6 md:p-8" data-reveal="stagger-1">
          <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
            {copy.home.artistSpotlightTitle}
          </p>
          <h2 id="home-artist-spotlight-title" className="font-headline mt-2 text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]">
            {artist.name}
          </h2>
          <p className="mt-4 font-body text-[15px] leading-relaxed text-warm-charcoal md:text-base">
            {medusaArtist.line}
          </p>
          <div className="mt-6">
            <Link
              to="/artists"
              className="font-body inline-flex min-h-11 items-center justify-center text-sm font-medium text-deep-teal underline-offset-4 transition-colors hover:text-obsidian hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              {copy.home.artistSpotlightCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
