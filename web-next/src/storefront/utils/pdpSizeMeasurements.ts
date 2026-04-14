import type { PdpSizeTableRow } from '../data/domain-config';

/**
 * Extracts the first decimal number from a PDP measurement string (e.g. `"102 cm"`, `"20.5 cm"`).
 * Used only for relative diagram scaling; labels should stay the original operator strings.
 */
export function parsePdpMeasurementToNumberCm(raw: string): number | null {
  const s = raw?.trim() ?? '';
  if (!s) return null;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export type PdpSizeRowParsedCm = {
  chest: number | null;
  shoulder: number | null;
  length: number | null;
  sleeve: number | null;
};

export function parsePdpSizeTableRowCm(row: PdpSizeTableRow): PdpSizeRowParsedCm {
  return {
    chest: parsePdpMeasurementToNumberCm(row.chest),
    shoulder: parsePdpMeasurementToNumberCm(row.shoulder),
    length: parsePdpMeasurementToNumberCm(row.length),
    sleeve: parsePdpMeasurementToNumberCm(row.sleeve),
  };
}

/** Max of parsed cm values for this row; used to normalize arrow extents in the flat sketch. */
export function maxParsedCmForRow(parsed: PdpSizeRowParsedCm): number {
  const vals = [parsed.chest, parsed.shoulder, parsed.length, parsed.sleeve].filter(
    (v): v is number => v != null && Number.isFinite(v),
  );
  if (vals.length === 0) return 1;
  return Math.max(...vals);
}

/**
 * Maps a parsed cm value to ~0.35–1.0 for visual variation (illustrative, not to-scale engineering).
 */
export function relativeDiagramScale(cm: number | null, rowMaxCm: number): number {
  if (cm == null || rowMaxCm <= 0) return 0.55;
  const t = cm / rowMaxCm;
  return Math.min(1, Math.max(0.35, 0.35 + t * 0.65));
}
