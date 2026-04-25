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
    <div className="min-h-[268px] rounded-[8px] border border-[#ded7ce] bg-white/88 p-[24px_27px] shadow-[0_1px_2px_rgba(32,25,18,.04),0_12px_26px_rgba(32,25,18,.04)]">
      <h2 className="mb-[18px] font-headline text-[31px] font-normal leading-1 tracking-[-1.1px] text-obsidian">
        Quality you can feel
      </h2>

      <div className="relative grid grid-cols-1 gap-y-[9px] sm:grid-cols-2 sm:gap-x-[26px]">
        {/* Center divider on 2-col */}
        <div className="absolute left-1/2 top-[4px] bottom-[4px] hidden w-px bg-[#ded7ce] sm:block" aria-hidden />
        {featureStripItems.map(({ label, Icon }) => (
          <p key={label} className="m-0 text-[14px] text-[#4d4741]">
            <span className="inline-block w-[22px] text-[#625c55]"><Icon /></span>
            {label}
          </p>
        ))}
      </div>

      {physicalLines.length > 0 ? (
        <ul className="mt-5 space-y-1 border-t border-[#ded7ce] pt-4 pl-[18px]">
          {physicalLines.map((line, idx) => (
            <li key={idx} className="my-[1px] text-[14px] text-[#3f3a35]">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
