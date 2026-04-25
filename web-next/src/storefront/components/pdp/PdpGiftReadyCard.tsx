'use client';

import { CART_SCHEMA } from '../../data/domain-config';

type PdpGiftReadyCardProps = {
  /** When true, show that gift wrap is available at cart. */
  giftWrapAvailable?: boolean;
};

export function PdpGiftReadyCard({ giftWrapAvailable = true }: PdpGiftReadyCardProps) {
  const { copy: cartCopy } = CART_SCHEMA;

  return (
    <div className="rounded-2xl border border-stone/30 bg-white/60 p-6 md:p-8">
      <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
        Gift-ready
      </span>
      <h3 className="font-headline mt-2 text-lg font-semibold tracking-tight text-obsidian">
        {cartCopy.giftUpsellHeading}
      </h3>
      <p className="mt-3 font-body text-sm leading-relaxed text-warm-charcoal">
        {cartCopy.giftUpsellBody}
      </p>

      {giftWrapAvailable ? (
        <ul className="mt-4 space-y-2">
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-body text-sm text-warm-charcoal">Artist story card included</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-body text-sm text-warm-charcoal">Gift wrap add-on at checkout</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-deep-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-body text-sm text-warm-charcoal">No price on the package</span>
          </li>
        </ul>
      ) : (
        <p className="mt-3 font-body text-sm text-warm-charcoal">
          Gift wrap and artist card available at checkout.
        </p>
      )}
    </div>
  );
}
