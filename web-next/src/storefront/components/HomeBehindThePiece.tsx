import { useUiLocale, useDictionary } from '../i18n/ui-locale';
import type { Artist } from '../data/catalog-types';

function hasArtistProcessMedia(artists: Artist[]): boolean {
  return artists.some((a) => Array.isArray(a.processMedia) && a.processMedia.length > 0);
}

/**
 * "Behind the piece" — conditionally renders only when at least one artist
 * record has process media (sketches, studio shots, work-in-progress).
 *
 * When process media exists, the section shows the first artist's process
 * images alongside the static proof cards. When no process media exists,
 * returns null so the homepage section is effectively hidden.
 */
export function HomeBehindThePiece({ artists }: { artists?: Artist[] }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();

  if (!artists || !hasArtistProcessMedia(artists)) {
    return null;
  }

  const cards = copy.home.behindThePieceCards;
  const featuredArtist = artists.find((a) => Array.isArray(a.processMedia) && a.processMedia.length > 0);
  const media = featuredArtist?.processMedia ?? [];
  const isArabic = locale === 'ar';

  return (
    <section
      aria-labelledby="home-behind-the-piece-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-12 sm:px-5 md:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-label">
          {copy.home.behindThePieceEyebrow}
        </p>
        <h2
          id="home-behind-the-piece-title"
          data-reveal
          className="font-headline mt-2 max-w-lg text-[1.6rem] font-semibold leading-tight tracking-tight text-obsidian md:text-[1.75rem]"
        >
          {copy.home.behindThePieceTitle}
        </h2>
        <p className="font-body mt-3 max-w-xl text-[15px] leading-relaxed text-warm-charcoal">
          {copy.home.behindThePieceBody}
        </p>

        {media.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
            {media.slice(0, 4).map((m, i) => (
              <figure key={i} className="overflow-hidden rounded-xl border border-stone/25 bg-white shadow-sm">
                <img src={m.src} alt={isArabic ? m.captionAr : m.captionEn} className="h-40 w-full object-cover" loading="lazy" />
                <figcaption className="p-3 font-body text-xs text-warm-charcoal">
                  {isArabic ? m.captionAr : m.captionEn}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              data-reveal="stagger-1"
              className="rounded-2xl border border-stone/30 bg-white p-5 shadow-sm"
            >
              <h3 className="font-headline text-base font-semibold text-obsidian">
                {card.title}
              </h3>
              <p className="font-body mt-2 text-sm leading-relaxed text-warm-charcoal">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
