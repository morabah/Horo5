'use client';

import { PDP_SCHEMA } from '../../data/domain-config';
import { PDP_FEATURE_ICONS } from '../../data/pdpIconRegistry';

const featureStripItems = PDP_SCHEMA.features.map((feature) => ({
  label: feature.label,
  Icon: PDP_FEATURE_ICONS[feature.icon],
}));

type PdpQualityProofCardProps = {
  /** Physical attributes from Medusa (material, weight, origin). */
  physicalLines: string[];
};

export function PdpQualityProofCard({ physicalLines }: PdpQualityProofCardProps) {
  return (
    <div className="rounded-lg border border-stone/25 bg-white/88 p-6 shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)] md:p-7">
      <h2 className="font-headline text-[clamp(1.5rem,3vw,1.95rem)] font-normal leading-1 tracking-tight text-obsidian">
        Quality you can feel
      </h2>

      <div className="relative mt-5 grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-6">
        {/* Center divider on 2-col */}
        <div className="absolute left-1/2 top-1 bottom-1 hidden w-px bg-stone/25 sm:block" aria-hidden />
        {featureStripItems.map(({ label, Icon }) => (
          <p key={label} className="flex items-center gap-2 font-body text-[14px] text-warm-charcoal">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-obsidian/5 text-obsidian">
              <Icon />
            </span>
            {label}
          </p>
        ))}
      </div>

      {physicalLines.length > 0 ? (
        <ul className="mt-5 space-y-1 border-t border-stone/25 pt-4 pl-4">
          {physicalLines.map((line, idx) => (
            <li key={idx} className="font-body text-[14px] text-warm-charcoal/80">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
