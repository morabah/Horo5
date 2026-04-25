'use client';

import React from 'react';
import type { ProductSizeKey } from '../../data/catalog-types';
import { PDP_SCHEMA, type PdpSizeTableConfig } from '../../data/domain-config';

const { copy } = PDP_SCHEMA;

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
  sizeReady: _sizeReady,
  sizeTableResolved: _sizeTableResolved,
  silhouetteCueLabel,
  inlineFitModelDisplay,
  inlineFitMeasurementsPart,
  inventoryHint,
  sizeSectionRef,
  sizeGuideTriggerRef,
  onSizeSelect,
  onOpenSizeGuide,
}: PdpSizeSelectorProps) {
  return (
    <div ref={sizeSectionRef} className="space-y-3 pt-4">
      <p className="m-0 mb-[10px] text-[16px] font-bold text-obsidian">
        {copy.pdpSizeSectionLabel}
      </p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-[12px]" role="group" aria-label={copy.pdpSizeGroupAria}>
        {sizeButtons.map(({ key, disabled }) => {
          const isSelected = selectedSize === key;
          return (
            <button
              key={key}
              type="button"
              title={disabled ? copy.pdpSizeOosHint : undefined}
              onClick={() => onSizeSelect(key as ProductSizeKey, isSelected)}
              aria-pressed={isSelected}
              className={`flex h-[45px] items-center justify-center rounded-[6px] border text-[14px] font-medium transition-colors focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal ${
                disabled
                  ? isSelected
                    ? 'border-obsidian bg-obsidian text-white line-through decoration-white/70'
                    : 'border-[#cfc8c0] bg-white text-[#514c48] line-through decoration-obsidian/30 hover:border-obsidian/45'
                  : isSelected
                    ? 'border-obsidian bg-obsidian text-white shadow-sm'
                    : 'border-[#cfc8c0] bg-white text-[#514c48] hover:border-obsidian'
              }`}
            >
              <span aria-disabled={disabled}>{key}</span>
            </button>
          );
        })}
      </div>

      {silhouetteCueLabel ? (
        <p className="m-0 mb-[12px] text-[14px] text-[#4b4641]">
          {silhouetteCueLabel}
        </p>
      ) : null}

      <p className="m-0 mb-[12px] text-[14px] text-[#4b4641]">
        <span className="text-obsidian">{inlineFitModelDisplay}</span>
        {inlineFitMeasurementsPart ? (
          <>
            {' '}
            <span className="font-medium text-obsidian">{inlineFitMeasurementsPart}</span>
          </>
        ) : null}
      </p>

      <p className="m-0 mb-[30px] flex gap-[10px] text-[14px] text-[#4b4641]">
        <button
          ref={sizeGuideTriggerRef}
          type="button"
          onClick={onOpenSizeGuide}
          className="text-[14px] text-[#4b4641] underline decoration-[#4b4641]/35 underline-offset-[3px] transition-colors hover:text-obsidian"
        >
          {copy.sizeGuideLabel}
        </button>
        <span aria-hidden>·</span>
        <span className="text-[14px] text-[#4b4641]">14d exchange</span>
      </p>

      {inventoryHint ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5a554f]">
          {inventoryHint}
        </p>
      ) : null}

      {oosSelected ? (
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5a554f]">
          {copy.pdpOutOfStockForSize}
        </p>
      ) : null}
    </div>
  );
}
