import Image from 'next/image';
import { getDaysToLaunch, getLaunchAt } from '@/lib/pre-launch';
import { WaitlistForm } from './WaitlistForm';

const HERO_BLUR_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAFklEQVR4nGMQERP6TwxmGFUoQtfgAQAHCnsNFNbySQAAAABJRU5ErkJggg==';

const HERO_NAV_OFFSET = 'pt-[max(5rem,calc(env(safe-area-inset-top,0px)+4.25rem))]';

export function PreLaunchTeaseHero() {
  const launchAt = getLaunchAt();
  const daysToLaunch = getDaysToLaunch(launchAt);

  return (
    <section
      id="pre-launch-tease-hero"
      aria-labelledby="pre-launch-tease-heading"
      className={`relative isolate flex min-h-svh w-full flex-col overflow-hidden ${HERO_NAV_OFFSET}`}
    >
      <Image
        src="/images/hero/home-hero-wear-feel.png"
        alt="Abstract HORO art — art is coming to your wardrobe"
        fill
        sizes="100vw"
        priority
        fetchPriority="high"
        placeholder="blur"
        blurDataURL={HERO_BLUR_DATA_URL}
        className="absolute inset-0 h-full w-full object-cover object-[50%_70%] md:object-[50%_50%]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,8,0.45)_0%,rgba(9,10,8,0.25)_40%,rgba(9,10,8,0.55)_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-2 h-[34%] bg-linear-to-b from-black/70 via-black/30 to-transparent md:hidden"
      />

      <h1 id="pre-launch-tease-heading" className="sr-only">
        Art is coming to your wardrobe — HORO pre-launch
      </h1>

      <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom,0px))] sm:px-6 lg:px-10">
        <div className="w-full max-w-2xl text-center">
          <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-[#f5f0e6]/80 drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
            HORO Egypt
          </p>
          <h2 className="font-headline mt-4 text-[clamp(2.2rem,6.5vw,4.5rem)] font-semibold leading-[1.05] tracking-tight text-[#f5f0e6] drop-shadow-[0_6px_24px_rgba(0,0,0,0.5)]">
            Art is coming to your wardrobe.
          </h2>
          <p className="font-body mx-auto mt-4 max-w-lg text-[clamp(1rem,1.6vw,1.25rem)] leading-relaxed text-[#f5f0e6]/90 drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
            Original illustration by Egyptian artists, printed locally, shipped with care.
            Be the first to know when we go live.
          </p>

          {typeof daysToLaunch === 'number' ? (
            <div className="mt-6 inline-flex items-center rounded-full bg-[#f5f0e6]/10 px-5 py-2 ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm">
              <span className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-[#f5f0e6]/90">
                {daysToLaunch > 0
                  ? `${daysToLaunch} day${daysToLaunch === 1 ? '' : 's'} to launch`
                  : 'Launching soon'}
              </span>
            </div>
          ) : null}

          <div className="mt-8 flex justify-center">
            <WaitlistForm source="tease_hero" />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-[22%] bg-linear-to-t from-black/55 to-transparent"
      />
    </section>
  );
}
