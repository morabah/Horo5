'use client';
import { useDictionary } from '../../i18n/ui-locale';

import { PDP_SCHEMA } from '../../data/domain-config';
import { PDP_FEATURE_ICONS } from '../../data/pdpIconRegistry';

const featureStripItems = PDP_SCHEMA.features.map((feature) => ({
  label: feature.label,
  Icon: PDP_FEATURE_ICONS[feature.icon],
}));

type PdpQualityProofCardProps = {
  /** Physical attributes from Medusa (material, weight, origin). */
  physicalLines: string[];
  careInstructions?: string;
};

export function PdpQualityProofCard({ physicalLines, careInstructions }: PdpQualityProofCardProps) {
  const { pdp: copy } = useDictionary();
  const safeCareInstructions =
    careInstructions?.trim() || 'Follow the care label. Wash inside out and avoid ironing directly over the print.';

  return (
    <div className="rounded-2xl border border-stone/30 bg-white/60 p-6 md:p-8">
      <span className="font-label text-[10px] font-medium uppercase tracking-[0.25em] text-clay">
        Quality & Craft
      </span>
      <h3 className="font-headline mt-2 text-lg font-semibold tracking-tight text-obsidian">
        What goes into your piece
      </h3>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4">
        {featureStripItems.map(({ label, Icon }) => (
          <div key={label} className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-obsidian/5 text-obsidian">
              <Icon />
            </div>
            <p className="mt-2 font-body text-[11px] font-medium leading-snug text-warm-charcoal">
              {label}
            </p>
          </div>
        ))}
      </div>

      {physicalLines.length > 0 ? (
        <div className="mt-5 border-t border-stone/25 pt-4">
          <ul className="space-y-1.5">
            {physicalLines.map((line, idx) => (
              <li key={idx} className="font-body text-sm text-warm-charcoal">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-4 font-body text-sm leading-relaxed text-warm-charcoal/80">
        {copy.designStoryAccordionBody}
      </p>

      <div className="mt-5 border-t border-stone/25 pt-4">
        <p className="font-label text-[10px] font-medium uppercase tracking-[0.2em] text-clay">
          Care
        </p>
        <p className="mt-2 font-body text-sm leading-relaxed text-warm-charcoal">
          {safeCareInstructions}
        </p>
      </div>
    </div>
  );
}
