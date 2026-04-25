'use client';

import { CART_SCHEMA } from '../../data/domain-config';

type PdpGiftReadyCardProps = {
  /** When true, show that gift wrap is available at cart. */
  giftWrapAvailable?: boolean;
};

export function PdpGiftReadyCard({ giftWrapAvailable = true }: PdpGiftReadyCardProps) {
  const { copy: cartCopy } = CART_SCHEMA;

  return (
    <div className="overflow-hidden rounded-[8px] border border-[#ded7ce] bg-white/88 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:grid md:grid-cols-[270px_1fr]">
      {/* Text column */}
      <div className="relative z-[1] p-[24px_0_24px_27px]">
        <h2 className="mb-[58px] font-headline text-[32px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
          {cartCopy.giftUpsellHeading}
        </h2>
        <p className="mb-[30px] text-[14px] text-[#514b45]">
          {cartCopy.giftUpsellBody}
        </p>

        {giftWrapAvailable ? (
          <ul className="m-0 space-y-2 pl-[18px]">
            <li className="my-[1px] flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[14px] text-[#3f3a35]">Artist story card included</span>
            </li>
            <li className="my-[1px] flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[14px] text-[#3f3a35]">Gift wrap add-on at checkout</span>
            </li>
            <li className="my-[1px] flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-obsidian/40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[14px] text-[#3f3a35]">No price on the package</span>
            </li>
          </ul>
        ) : (
          <p className="text-[14px] text-[#514b45]/60">
            Gift option coming soon.
          </p>
        )}
      </div>

      {/* Image column — placeholder pattern until real gift media exists */}
      <div className="hidden items-center justify-center bg-[#ece7de] md:flex" aria-hidden>
        <svg className="h-24 w-24 text-[#ded7ce]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    </div>
  );
}
