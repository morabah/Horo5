'use client';

import { PDP_SCHEMA } from '../../data/domain-config';

type PdpTrustStripProps = {
  /** Override items; defaults to PDP_SCHEMA.trustStripItems. */
  items?: readonly string[];
};

export function PdpTrustStrip({ items = PDP_SCHEMA.trustStripItems }: PdpTrustStripProps) {
  return (
    <div className="flex h-[34px] items-center justify-center bg-papyrus/80 text-[13px] font-medium text-warm-charcoal/70">
      {items.join(' \u00A0·\u00A0 ')}
    </div>
  );
}
