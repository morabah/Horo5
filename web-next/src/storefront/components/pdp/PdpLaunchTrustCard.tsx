'use client';

import { PDP_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

export function PdpLaunchTrustCard() {
  const hasWhatsapp = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl);
  const hasInstagram = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.instagramUrl);

  return (
    <div className="min-h-[153px] rounded-[8px] border border-[#ded7ce] bg-white/88 p-[18px_18px_18px_27px] shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:grid md:grid-cols-[390px_210px_1fr] md:items-center md:gap-[12px]">
      {/* Honest launch message */}
      <div>
        <h2 className="mb-[12px] font-headline text-[34px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
          {copy.reviewsSoonTitle}
        </h2>
        <p className="text-[14px] leading-[1.45] text-[#3f3a35]">
          {copy.reviewsSoonBody}
        </p>
      </div>

      {/* Support / size help */}
      <div className="mt-5 md:mt-0">
        <p className="text-[14px] font-medium text-obsidian">Size help available</p>
        <p className="mt-1 text-[14px] text-[#403c37]">
          WhatsApp for sizing questions
        </p>
        {(hasWhatsapp || hasInstagram) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {hasWhatsapp ? (
              <a
                href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] min-w-[156px] items-center justify-center rounded-[4px] border border-[#d5cdc4] bg-white px-4 text-[13px] text-[#333] transition-colors hover:border-obsidian"
              >
                {copy.reviewsSoonWhatsappCta}
              </a>
            ) : null}
            {hasInstagram ? (
              <a
                href={HORO_SUPPORT_CHANNELS.instagramUrl!}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[44px] min-w-[156px] items-center justify-center rounded-[4px] border border-[#d5cdc4] bg-white px-4 text-[13px] text-[#333] transition-colors hover:border-obsidian"
              >
                {copy.reviewsSoonInstagramCta}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-[12px] text-[#5a554f]/60">
            {copy.reviewsSoonNoLinks}
          </p>
        )}
      </div>

      {/* Delivery / exchange / payment trust */}
      <div className="mt-5 md:mt-0">
        <ul className="m-0 space-y-2 pl-[18px]">
          {PDP_SCHEMA.trustStripItems.map((item) => (
            <li key={item} className="my-[1px] flex items-center gap-2 text-[14px] text-[#3f3a35]">
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
