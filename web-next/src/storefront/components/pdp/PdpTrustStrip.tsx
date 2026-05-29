'use client';

import { PDP_SCHEMA } from '../../data/domain-config';

const TRUST_ICON_MAP: Record<string, React.ReactNode> = {
  'Artist-made design': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l5 5" /><path d="M9.5 14.5L16 8" /></svg>
  ),
  'Licensed art': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
  ),
  '14-day exchange — see policy': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
  ),
  'COD when shown at checkout': (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
};

type PdpTrustStripProps = {
  /** Override items; defaults to PDP_SCHEMA.trustStripItems. */
  items?: readonly string[];
};

export function PdpTrustStrip({ items = PDP_SCHEMA.trustStripItems }: PdpTrustStripProps) {
  return (
    <div className="border-b border-stone/25 bg-papyrus">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2.5 md:px-12 lg:px-12">
        {items.map((item, i) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 font-label text-[10px] font-medium uppercase tracking-[0.2em] text-warm-charcoal/80"
          >
            <span className="text-clay">{TRUST_ICON_MAP[item] ?? null}</span>
            {item}
            {i < items.length - 1 && (
              <span className="ml-5 text-stone/40" aria-hidden>·</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
