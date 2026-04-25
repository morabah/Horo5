'use client';

import { PDP_SCHEMA } from '../../data/domain-config';

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
            className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-warm-charcoal/80"
          >
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
