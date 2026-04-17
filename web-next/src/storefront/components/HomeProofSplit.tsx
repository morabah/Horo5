import { AppIcon } from './AppIcon';
import { imgUrl } from '../data/images';
import { HOME_COPY, HOME_PROOF_MACRO, HOME_TRUST_BADGES } from '../data/homeContent';
import { useUiLocale } from '../i18n/ui-locale';
import { TeeImage } from './TeeImage';

export function HomeProofSplit() {
  const { copy } = useUiLocale();

  return (
    <section
      aria-labelledby="home-trust-title"
      className="relative border-t border-white/10 bg-obsidian px-4 py-16 sm:px-6 md:py-20 lg:px-8 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-xl md:mb-12" data-reveal>
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.22em] text-stone">
            {HOME_COPY.proofEyebrow}
          </p>
          <h2
            id="home-trust-title"
            className="font-headline mt-3 text-[clamp(1.5rem,3vw,2.25rem)] font-medium leading-snug tracking-tight text-clean-white"
          >
            {copy.home.trustTitle}
          </h2>
          <p className="mt-3 font-body text-sm leading-relaxed text-stone md:text-[15px]">{HOME_COPY.proofBody}</p>
        </div>

        {/* Large decorative quality callout */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[3%] top-[8%] z-0 select-none font-headline text-[min(22vw,16rem)] font-bold leading-none tracking-tighter text-white/[0.06]"
        >
          COTTON
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-10">
          <div
            className="relative min-h-[min(56vh,460px)] flex-1 overflow-hidden rounded-xl lg:max-w-[52%]"
            data-reveal="stagger-1"
          >
            <TeeImage
              src={imgUrl(HOME_PROOF_MACRO.imageSrc, 900)}
              alt={HOME_PROOF_MACRO.imageAlt}
              w={900}
              className="h-full w-full object-center"
            />
          </div>

          <div
            className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:max-w-[48%] lg:content-center"
            data-reveal="stagger-2"
          >
            {HOME_TRUST_BADGES.map((item, i) => (
              <article
                key={item.title}
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
                className="home-trust-glass flex gap-3 rounded-lg border-desert-sand/35 p-4 sm:p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-desert-sand/55 text-desert-sand">
                  <AppIcon name={item.icon} className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-clean-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 font-body text-[13px] leading-snug text-stone md:text-sm">{item.sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
