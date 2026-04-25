'use client';

import { PDP_SCHEMA } from '../../data/domain-config';

type PdpTrustStripProps = {
  /** Override items; defaults to PDP_SCHEMA.trustStripItems. */
  items?: readonly string[];
};

export function PdpTrustStrip({ items = PDP_SCHEMA.trustStripItems }: PdpTrustStripProps) {
  return (
    <div className="flex h-[34px] items-center justify-center bg-[#f0ece6] text-[13px] font-medium text-[#5c5650]">
      {items.join(' \u00A0·\u00A0 ')}
    </div>
  );
}
