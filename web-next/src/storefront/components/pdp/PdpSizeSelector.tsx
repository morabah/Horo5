'use client';

import React from 'react';
import type { ProductSizeKey } from '../../data/catalog-types';
import { PDP_SCHEMA, type PdpSizeTableConfig } from '../../data/domain-config';
import {  useUiLocale, useDictionary  } from '../../i18n/ui-locale';
import { PdpSizeFlatDiagram } from '../PdpSizeFlatDiagram';


function localizedSizeTableLabel(config: PdpSizeTableConfig, locale: 'en' | 'ar') {
  const label = config.displayLabel;
  if (!label) return '';
  const preferred = locale === 'ar' ? label.ar : label.en;
  const fallback = locale === 'ar' ? label.en : label.ar;
  return (preferred || fallback || '').trim();
}

type PdpSizeSelectorProps = {
  sizeButtons: { key: string; disabled?: boolean }[];
  selectedSize: string | null;
  oosSelected: boolean;
  sizeReady: boolean;
  sizeTableResolved: PdpSizeTableConfig;
  silhouetteCueLabel: string | null | undefined;
  inlineFitModelDisplay: string;
  inlineFitMeasurementsPart: string;
  inventoryHint: string | undefined;
  sizeSectionRef: React.RefObject<HTMLDivElement | null>;
  sizeGuideTriggerRef: React.RefObject<HTMLButtonElement | null>;
  onSizeSelect: (size: ProductSizeKey, isSelected: boolean) => void;
  onOpenSizeGuide: () => void;
};

export function PdpSizeSelector({
  sizeButtons,
  selectedSize,
  oosSelected,
  sizeTableResolved,
  silhouetteCueLabel,
  inlineFitModelDisplay,
  inlineFitMeasurementsPart,
  inventoryHint,
  sizeSectionRef,
  sizeGuideTriggerRef,
  onSizeSelect,
  onOpenSizeGuide,
}: PdpSizeSelectorProps) {
  const { pdp: copy } = useDictionary();
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [diagramOpen, setDiagramOpen] = React.useState(false);
  const selectedMeasurementRow = selectedSize
    ? sizeTableResolved.measurements.find((row) => row.size === selectedSize) ?? null
    : null;
  const sizeTableLabel = localizedSizeTableLabel(sizeTableResolved, isArabic ? 'ar' : 'en');
  const fitConfidenceLine = isArabic
    ? 'مش متأكد؟ اختر مقاس أكبر — استبدال مجاني خلال ١٤ يوم.'
    : 'Unsure? Size up — exchange free for 14 days.';
  return (
    <div ref={sizeSectionRef} className="space-y-3 border-t border-stone/30 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.24em] text-label">
          {copy.pdpSizeSectionLabel}
        </p>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {sizeTableLabel ? (
            <span className="inline-flex max-w-full rounded-full border border-obsidian/25 bg-white px-3 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-obsidian">
              {sizeTableLabel}
            </span>
          ) : null}
          <button
            ref={sizeGuideTriggerRef}
            type="button"
            onClick={onOpenSizeGuide}
            className="font-label inline-flex min-h-11 items-center text-[11px] font-medium uppercase tracking-[0.18em] text-deep-teal underline decoration-deep-teal/35 underline-offset-4 transition-colors hover:text-obsidian"
          >
            {copy.sizeGuideLabel}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-stone/45 bg-white/72 px-3 py-3">
        <button
          type="button"
          onClick={() => setDiagramOpen((open) => !open)}
          aria-expanded={diagramOpen}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
        >
          <span className="min-w-0">
            <span className="font-label block text-[10px] font-semibold uppercase tracking-[0.18em] text-obsidian">
              {copy.sizeGuideFlatDiagramTitle}
            </span>
            <span className="font-body mt-1 block text-[12px] leading-snug text-warm-charcoal">
              {selectedMeasurementRow
                ? `${selectedMeasurementRow.size}: chest ${selectedMeasurementRow.chest} · length ${selectedMeasurementRow.length}`
                : copy.sizeGuideFlatDiagramSelectSize}
            </span>
          </span>
          <span className="font-label shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-deep-teal">
            {diagramOpen ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'عرض' : 'View')}
          </span>
        </button>
        {diagramOpen ? (
          <PdpSizeFlatDiagram
            className="mt-3"
            row={selectedMeasurementRow}
            noSelectionMessage={copy.sizeGuideFlatDiagramSelectSize}
            sectionTitle={copy.sizeGuideFlatDiagramTitle}
            disclaimer={copy.sizeGuideFlatDiagramDisclaimer}
            diagramAriaTemplate={copy.sizeGuideFlatDiagramAriaTemplate}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2.5" role="group" aria-label={copy.pdpSizeGroupAria}>
        {sizeButtons.map(({ key, disabled }) => {
          const isSelected = selectedSize === key;
          return (
            <button
              key={key}
              type="button"
              title={disabled ? copy.pdpSizeOosHint : undefined}
              onClick={() => onSizeSelect(key as ProductSizeKey, isSelected)}
              aria-pressed={isSelected}
              className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border px-4 font-headline text-sm font-medium transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                disabled
                  ? isSelected
                    ? 'border-obsidian bg-obsidian text-white line-through decoration-white/70'
                    : 'border-stone/40 text-clay line-through decoration-obsidian/30 hover:border-obsidian/45'
                  : isSelected
                    ? 'border-obsidian bg-obsidian text-white shadow-sm'
                    : 'border-stone/60 bg-white/80 text-obsidian hover:border-obsidian'
              }`}
            >
              <span aria-disabled={disabled}>{key}</span>
            </button>
          );
        })}
      </div>

      {silhouetteCueLabel ? (
        <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
          {silhouetteCueLabel}
        </p>
      ) : null}

      <p className="font-body text-sm leading-relaxed">
        <span className="text-obsidian">{inlineFitModelDisplay}</span>
        {inlineFitMeasurementsPart ? (
          <>
            {' '}
            <span className="font-medium text-obsidian">{inlineFitMeasurementsPart}</span>
          </>
        ) : null}
      </p>

      {inventoryHint ? (
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
          {inventoryHint}
        </p>
      ) : null}

      {/* Fit-confidence reassurance — reduces size-fit risk before CTA (audit P-Size). */}
      {!oosSelected ? (
        <p className="font-body text-[12px] leading-snug text-warm-charcoal/85">
          {fitConfidenceLine}
        </p>
      ) : null}

      {oosSelected ? (
        <p className="font-label text-[11px] font-medium uppercase tracking-[0.18em] text-warm-charcoal">
          {copy.pdpOutOfStockForSize}
        </p>
      ) : null}
    </div>
  );
}
