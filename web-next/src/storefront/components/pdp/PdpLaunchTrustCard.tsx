'use client';

import { PDP_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

export function PdpLaunchTrustCard() {
  const hasWhatsapp = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl);
  const hasInstagram = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl);

  return (
    <section className="border-t border-stone/25 bg-papyrus">
      <div className="mx-auto max-w-[1320px] px-4 py-14 md:px-12 md:py-16 lg:px-12">
        <div className="mx-auto max-w-[640px] text-center">
          <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
            {copy.reviewsSoonEyebrow}
          </span>
          <h2 className="font-headline mt-3 text-2xl font-semibold tracking-tight text-obsidian md:text-3xl">
            {copy.reviewsSoonTitle}
          </h2>
          <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal md:text-[15px]">
            {copy.reviewsSoonBody}
          </p>

          {(hasWhatsapp || hasInstagram) ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {hasWhatsapp ? (
                <a
                  href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="font-label inline-flex min-h-11 items-center rounded-full border border-obsidian/60 bg-white/80 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-white"
                >
                  {copy.reviewsSoonWhatsappCta}
                </a>
              ) : null}
              {hasInstagram ? (
                <a
                  href={HORO_SUPPORT_CHANNELS.instagramUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="font-label inline-flex min-h-11 items-center rounded-full border border-obsidian/60 bg-white/80 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian hover:bg-obsidian hover:text-white"
                >
                  {copy.reviewsSoonInstagramCta}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 font-body text-xs text-clay">
              {copy.reviewsSoonNoLinks}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
