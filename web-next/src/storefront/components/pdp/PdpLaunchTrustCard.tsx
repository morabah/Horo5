'use client';

import { PDP_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

export function PdpLaunchTrustCard() {
  const hasWhatsapp = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl);
  const hasInstagram = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl);

  return (
    <div className="rounded-lg border border-stone/25 bg-white/88 p-5 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:grid md:grid-cols-3 md:items-center md:gap-3 md:px-7 md:py-5">
      {/* Honest launch message */}
      <div>
        <h2 className="font-headline text-[clamp(1.5rem,3vw,2.15rem)] font-normal leading-1 tracking-tight text-obsidian">
          {copy.reviewsSoonTitle}
        </h2>
        <p className="mt-2 font-body text-[14px] leading-relaxed text-warm-charcoal/80">
          {copy.reviewsSoonBody}
        </p>
      </div>

      {/* Support / size help */}
      <div className="mt-5 md:mt-0">
        <p className="font-body text-[14px] font-medium text-obsidian">Size help available</p>
        <p className="mt-1 font-body text-[14px] text-warm-charcoal/80">
          WhatsApp for sizing questions
        </p>
        {(hasWhatsapp || hasInstagram) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {hasWhatsapp ? (
              <a
                href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-sm border border-stone/40 bg-white px-4 text-[13px] font-medium text-obsidian transition-colors hover:border-obsidian"
              >
                {copy.reviewsSoonWhatsappCta}
              </a>
            ) : null}
            {hasInstagram ? (
              <a
                href={HORO_SUPPORT_CHANNELS.instagramUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center rounded-sm border border-stone/40 bg-white px-4 text-[13px] font-medium text-obsidian transition-colors hover:border-obsidian"
              >
                {copy.reviewsSoonInstagramCta}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 font-body text-[12px] text-warm-charcoal/50">
            {copy.reviewsSoonNoLinks}
          </p>
        )}
      </div>

      {/* Delivery / exchange / payment trust */}
      <div className="mt-5 md:mt-0">
        <ul className="space-y-2">
          {PDP_SCHEMA.trustStripItems.map((item) => (
            <li key={item} className="flex items-center gap-2 font-body text-[14px] text-warm-charcoal">
              <svg className="h-4 w-4 shrink-0 text-obsidian/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
