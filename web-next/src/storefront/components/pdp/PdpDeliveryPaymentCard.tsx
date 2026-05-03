'use client';
import { useDictionary } from '../../i18n/ui-locale';

import type { PdpDeliveryRules } from '../../utils/deliveryEstimate';
import {
  formatPdpExpressBadgeLabel,
  formatPdpStandardBadgeLabel,
} from '../../utils/deliveryEstimate';
import { PDP_SCHEMA, HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../../data/domain-config';

const { pdp: copy } = useDictionary();

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
    <div className="rounded-2xl border border-stone/30 bg-white/60 p-6 md:p-8">
      <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
        {copy.deliveryEyebrow}
      </span>
      <h3 className="font-headline mt-2 text-lg font-semibold tracking-tight text-obsidian">
        {copy.deliveryEstimateTitle}
      </h3>

      <div className="mt-4 space-y-2">
        {deliveryDynamic ? (
          <p className="font-body text-sm font-medium leading-snug text-obsidian">
            {deliveryDynamic.urgencyLine}
          </p>
        ) : null}
        <p className="font-body text-sm leading-relaxed text-warm-charcoal">
          <span className="font-medium text-obsidian">{deliveryStandardBadgeLabel}</span>{' '}
          {standardDeliveryWindow}
          <span className="mx-2 text-clay/50" aria-hidden>·</span>
          <span className="font-medium text-obsidian">{deliveryExpressBadgeLabel}</span>{' '}
          {expressDeliveryWindow}
        </p>
        {deliveryDynamic ? (
          <p className="font-body text-sm leading-snug text-warm-charcoal">
            {deliveryDynamic.arrivesLine}
          </p>
        ) : null}
        <p className="font-body text-xs text-clay">{copy.deliveryEstimateNote}</p>
      </div>

      <div className="mt-5 border-t border-stone/25 pt-4 space-y-2">
        {copy.shippingSections.map((section) => (
          <div key={section.title}>
            <p className="font-body text-sm text-warm-charcoal">
              <span className="font-medium text-obsidian">{section.title}:</span> {section.body}
            </p>
          </div>
        ))}
      </div>

      {trustItems.length > 0 ? (
        <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2" aria-label="Product trust highlights">
          {trustItems.slice(0, 4).map((item) => (
            <li key={item} className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-warm-charcoal">
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      {hasWhatsapp ? (
        <a
          href={HORO_SUPPORT_CHANNELS.whatsappSupportUrl!}
          target="_blank"
          rel="noreferrer"
          className="font-label mt-4 inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
        >
          {copy.whatsappHelpLabel}
        </a>
      ) : null}
    </div>
  );
}
