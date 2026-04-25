'use client';

import type { PdpDeliveryRules } from '../../utils/deliveryEstimate';
import {
  formatPdpExpressBadgeLabel,
  formatPdpStandardBadgeLabel,
} from '../../utils/deliveryEstimate';
import { PDP_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

type PdpDeliveryPaymentCardProps = {
  deliveryRules: PdpDeliveryRules;
  deliveryDynamic: { urgencyLine: string; arrivesLine: string } | null;
  standardDeliveryWindow: string;
  expressDeliveryWindow: string;
  /** Product trust badges (for COD / exchange lines). */
  trustItems: readonly string[];
};

export function PdpDeliveryPaymentCard({
  deliveryRules,
  deliveryDynamic,
  standardDeliveryWindow,
  expressDeliveryWindow,
  trustItems,
}: PdpDeliveryPaymentCardProps) {
  const deliveryStandardBadgeLabel = formatPdpStandardBadgeLabel(deliveryRules);
  const deliveryExpressBadgeLabel = formatPdpExpressBadgeLabel(deliveryRules);
  const hasWhatsapp = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl);

  return (
    <div className="rounded-lg border border-stone/25 bg-white/88 p-6 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:p-7">
      <h2 className="font-headline text-[clamp(1.5rem,3vw,2.05rem)] font-normal leading-1 tracking-tight text-obsidian">
        Delivery &amp; Payment
      </h2>

      {/* Delivery info row */}
      <div className="mt-5 grid grid-cols-[52px_1fr] gap-5 items-start">
        <div className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-papyrus text-warm-charcoal" aria-hidden>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677" />
          </svg>
        </div>
        <ul className="space-y-1">
          <li className="font-body text-[14px] text-warm-charcoal">
            <span className="font-medium text-obsidian">{deliveryStandardBadgeLabel}</span> {standardDeliveryWindow}
          </li>
          {expressDeliveryWindow ? (
            <li className="font-body text-[14px] text-warm-charcoal">
              <span className="font-medium text-obsidian">{deliveryExpressBadgeLabel}</span> {expressDeliveryWindow}
            </li>
          ) : null}
          {deliveryDynamic ? (
            <li className="font-body text-[14px] text-warm-charcoal">{deliveryDynamic.urgencyLine}</li>
          ) : null}
          {(trustItems as readonly string[]).some(t => t.includes('COD')) || PDP_SCHEMA.trustStripItems.some(t => t.includes('COD')) ? (
            <li className="font-body text-[14px] text-warm-charcoal">COD available</li>
          ) : null}
          <li className="font-body text-[14px] text-warm-charcoal">Card / wallet payment available</li>
        </ul>
      </div>

      {/* Divider */}
      <hr className="my-5 border-0 border-t border-stone/25" />

      {/* Exchange section */}
      <div className="grid grid-cols-[52px_1fr] gap-5 items-start">
        <div className="flex h-[45px] w-[45px] items-center justify-center rounded-full bg-papyrus text-warm-charcoal" aria-hidden>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </div>
        <div>
          <h3 className="font-headline text-[1.375rem] font-normal tracking-tight text-obsidian">Exchange</h3>
          <ul className="mt-1 space-y-1">
            {copy.shippingSections.map((section) => (
              <li key={section.title} className="font-body text-[14px] text-warm-charcoal">
                {section.body}
              </li>
            ))}
            {hasWhatsapp ? (
              <li>
                <a
                  href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl!}
                  target="_blank"
                  rel="noreferrer"
                  className="font-body text-[14px] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
                >
                  {copy.whatsappHelpLabel}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <p className="mt-4 font-body text-[12px] text-warm-charcoal/50">{copy.deliveryEstimateNote}</p>
    </div>
  );
}
