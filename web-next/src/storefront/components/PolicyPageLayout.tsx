import { Link } from 'react-router-dom';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';

type PolicySection = {
  title: string;
  body: readonly string[];
};

export function PolicyPageLayout({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  const instagramUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl)
    ? HORO_SUPPORT_CHANNELS.instagramUrl
    : null;
  const whatsappSupportUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;
  const hasSupportLink = Boolean(instagramUrl || whatsappSupportUrl);

  return (
    <div className="bg-papyrus pb-16 pt-8 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <nav className="font-body mb-6 text-sm text-clay" aria-label="Breadcrumb">
          <Link to="/" className="transition-colors hover:text-obsidian">
            Home
          </Link>
          <span className="px-2 text-clay/50" aria-hidden>
            /
          </span>
          <span className="text-warm-charcoal">{title}</span>
        </nav>

        <section className="overflow-hidden rounded-[1.75rem] border border-stone/60 bg-white/82 shadow-[0_28px_68px_-36px_rgba(26,26,26,0.2)] backdrop-blur-sm">
          <div className="border-b border-stone/20 px-5 py-8 md:px-8 md:py-10">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.28em] text-label">{eyebrow}</p>
            <h1 className="font-headline mt-4 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[0.95] tracking-tight text-obsidian">
              {title}
            </h1>
            <p className="font-body mt-4 max-w-3xl text-[1rem] leading-relaxed text-warm-charcoal md:text-[1.05rem]">
              {intro}
            </p>
            <p className="font-label mt-5 text-[10px] font-medium uppercase tracking-[0.22em] text-clay">
              Effective {HORO_SUPPORT_CHANNELS.effectiveDate}
            </p>
          </div>

          <div className="space-y-8 px-5 py-8 md:px-8 md:py-10">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="font-headline text-[1.15rem] font-semibold tracking-tight text-obsidian md:text-[1.3rem]">
                  {section.title}
                </h2>
                <div className="space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="font-body text-sm leading-relaxed text-warm-charcoal md:text-[0.98rem]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-stone/50 bg-white/70 px-5 py-6 shadow-[0_18px_44px_-28px_rgba(26,26,26,0.2)] md:px-8">
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.24em] text-label">Contact HORO</p>
          {hasSupportLink ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {whatsappSupportUrl ? (
                <a
                  href={whatsappSupportUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-label inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  WhatsApp Support
                </a>
              ) : null}
              {instagramUrl ? (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-label inline-flex min-h-12 items-center justify-center rounded-sm border border-stone bg-white px-6 py-3 text-[11px] font-medium uppercase tracking-[0.2em] text-obsidian shadow-sm transition-colors hover:border-desert-sand"
                >
                  Instagram
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal">
              Live support links appear here as soon as they are activated for this build.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
