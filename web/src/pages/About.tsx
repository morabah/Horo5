import { Link } from 'react-router-dom';
import { AppIcon } from '../components/AppIcon';
import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { ABOUT_SCHEMA, BRAND_TRUST_POINTS, PDP_SCHEMA } from '../data/domain-config';
import { aboutBridgeAlt, aboutBridgeImage, aboutHero, aboutHeroAlt, imgUrl } from '../data/images';

const STORY_PLAN_STEP_ICONS = ['explore', 'checkroom', 'local_shipping'] as const;

export function About() {
  useScrollReveal();

  return (
    <div className="bg-papyrus pb-16 md:pb-20">
      <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col gap-10 px-4 pt-8 md:gap-12 md:px-8 md:pt-10">
        <PageBreadcrumb
          className="mb-0 md:-mb-2"
          items={[{ label: 'Home', to: '/' }, { label: 'About' }]}
        />
        <section
          aria-label={ABOUT_SCHEMA.copy.heroRegionLabel}
          className="relative isolate overflow-hidden rounded-[1.75rem] border border-white/65 bg-obsidian shadow-[0_28px_68px_-36px_rgba(26,26,26,0.35)]"
        >
          <div className="grid min-h-[34rem] lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
            <div className="relative min-h-[20rem] lg:min-h-full">
              <img
                src={imgUrl(aboutHero, 1600)}
                alt={aboutHeroAlt}
                className="absolute inset-0 h-full w-full object-cover object-center"
                width={1600}
                height={1200}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.12)_0%,rgba(18,18,18,0.28)_42%,rgba(18,18,18,0.68)_100%)] lg:bg-[linear-gradient(90deg,rgba(18,18,18,0.06)_0%,rgba(18,18,18,0.14)_48%,rgba(18,18,18,0.64)_100%)]"
                aria-hidden
              />
            </div>

            <div className="relative flex items-end lg:items-center">
              <div className="relative z-10 m-4 w-full rounded-[1.35rem] border border-white/65 bg-[linear-gradient(135deg,rgba(26,26,26,0.78),rgba(26,26,26,0.5))] px-5 py-5 shadow-[0_18px_48px_-28px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:m-6 sm:px-6 sm:py-6 md:px-8 md:py-8 lg:m-8">
                <h1 className="font-headline text-[clamp(2.2rem,5vw,4.3rem)] font-semibold leading-[0.94] tracking-tight text-white">Our story</h1>
                <div className="mt-5 space-y-6 font-body text-[1.02rem] leading-relaxed text-white/88 md:text-[1.08rem]">
                  <p>
                    HORO exists to turn original illustration into graphic tees that feel worth buying in Egypt: meaning first, proof visible, and service clear enough for a first order.
                  </p>
                  <p>
                    The job is simple: choose the artwork carefully, print it on heavyweight cotton, credit it honestly, and deliver it without the fuzzy promises that make new brands feel risky.
                  </p>
                  <p className="text-[1.15rem] text-secondary-fixed md:text-[1.22rem]">Wear what you mean.</p>
                </div>

                <div className="mt-7 flex flex-col gap-5">
                  <Link
                    to="/vibes"
                    className="font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium uppercase tracking-[0.22em] text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-auto"
                  >
                    {ABOUT_SCHEMA.copy.primaryCta}
                  </Link>

                  <div className="flex flex-wrap gap-2">
                    {PDP_SCHEMA.trustStripItems.map((item) => (
                      <span
                        key={item}
                        className="font-label inline-flex min-h-11 items-center rounded-full border border-white/28 bg-white/10 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/88"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="HORO trust points">
          {BRAND_TRUST_POINTS.map((item, i) => (
            <div
              key={item.title}
              data-reveal={(['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4'] as const)[i]}
              className="flex items-start gap-4 rounded-[1.5rem] border border-label/10 bg-white/58 px-5 py-5 shadow-[0_12px_32px_rgba(26,26,26,0.05)] backdrop-blur-sm"
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-obsidian text-white">
                <AppIcon name={item.icon} className="h-[21px] w-[21px]" />
              </span>
              <div className="min-w-0">
                <span className="font-label block text-[11px] font-semibold uppercase tracking-[0.2em] text-label">{item.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-warm-charcoal">{item.sub}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="border-y border-label/10 py-5" aria-label="Simple plan">
          <ol className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
            {PDP_SCHEMA.storyPlanSteps.map((step, i) => (
              <li
                key={step}
                data-reveal={(['stagger-1', 'stagger-2', 'stagger-3'] as const)[i]}
                className="flex items-center gap-4 rounded-2xl px-2 py-2 md:justify-center"
              >
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/6 text-primary">
                  <AppIcon name={STORY_PLAN_STEP_ICONS[i]} className="h-[22px] w-[22px]" />
                </span>
                <span className="font-label text-[11px] uppercase tracking-[0.22em] text-label md:text-[12px]">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label={ABOUT_SCHEMA.copy.bridgeRegionLabel}
          className="relative isolate overflow-hidden rounded-[1.75rem] border border-stone/65 bg-obsidian shadow-[0_28px_68px_-36px_rgba(26,26,26,0.32)]"
        >
          <div className="relative min-h-[20rem] sm:min-h-[24rem]">
            <img
              src={imgUrl(aboutBridgeImage, 1600)}
              alt={aboutBridgeAlt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              width={1600}
              height={1200}
              decoding="async"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.24)_0%,rgba(18,18,18,0.36)_42%,rgba(18,18,18,0.82)_100%)]"
              aria-hidden
            />
            <div className="relative z-10 flex min-h-[20rem] items-end justify-center p-5 sm:min-h-[24rem] sm:p-8">
              <Link
                to="/vibes"
                data-reveal="stagger-1"
                className="font-label inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-sm bg-primary px-8 py-4 text-sm font-medium uppercase tracking-[0.22em] text-obsidian shadow-xl transition-all duration-300 hover:scale-[1.02] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal sm:w-auto"
              >
                {ABOUT_SCHEMA.copy.bridgeCta}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
