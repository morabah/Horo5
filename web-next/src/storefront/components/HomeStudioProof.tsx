import { HOME_COPY, HOME_PROOF_CARDS } from '../data/homeContent';
import { imgUrl } from '../data/images';
import { useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

export function HomeStudioProof() {
  const { copy } = useUiLocale();

  return (
    <section
      aria-labelledby="home-studio-proof-title"
      className="border-t border-stone/20 bg-papyrus px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl md:mb-12" data-reveal>
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-label">
            {copy.home.studioEyebrow}
          </p>
          <h2
            id="home-studio-proof-title"
            className="font-headline mt-2 text-xl font-semibold tracking-tight text-obsidian md:text-2xl"
          >
            {copy.home.studioTitle}
          </h2>
          <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
            {HOME_COPY.studioBody}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {HOME_PROOF_CARDS.map((card, index) => (
            <article
              key={card.title}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[index]}
              className="overflow-hidden rounded-[1.35rem] border border-stone/35 bg-white shadow-[0_18px_42px_-28px_rgba(26,26,26,0.22)]"
            >
              <TeeImage
                src={imgUrl(card.imageSrc, 900)}
                alt={card.imageAlt}
                w={900}
                className="aspect-[4/3] w-full"
              />
              <div className="space-y-3 p-5">
                <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-label">
                  {card.eyebrow}
                </p>
                <h3 className="font-headline text-lg font-semibold leading-snug tracking-tight text-obsidian">
                  {card.title}
                </h3>
                <p className="font-body text-sm leading-relaxed text-warm-charcoal">
                  {card.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
