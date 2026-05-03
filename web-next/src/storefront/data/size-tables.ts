import { z } from 'zod';
import type { PdpFitModel } from './catalog-types';

/** One row in the PDP size chart (chest / shoulder / length / sleeve). */
export type PdpSizeTableRow = {
  size: string;
  chest: string;
  shoulder: string;
  length: string;
  sleeve: string;
};

/** Measurements + on-body model lines for one named preset. */
export type PdpSizeTablePresetBody = {
  measurements: PdpSizeTableRow[];
  fitModels: PdpFitModel[];
  displayLabel?: {
    en?: string;
    ar?: string;
  };
};

/** Resolved preset for PDP + size guide modal. */
export type PdpSizeTableConfig = PdpSizeTablePresetBody & {
  presetKeyUsed: string;
};

/** Built-in fallback when Medusa has no `store.metadata.sizeTables` (matches legacy PDP). */
export const PDP_DEFAULT_SIZE_PRESET: PdpSizeTablePresetBody = {
  measurements: [
    { size: 'XS', chest: '90 cm', shoulder: '43 cm', length: '68 cm', sleeve: '19 cm' },
    { size: 'S', chest: '96 cm', shoulder: '45 cm', length: '70 cm', sleeve: '20 cm' },
    { size: 'M', chest: '102 cm', shoulder: '47 cm', length: '72 cm', sleeve: '21 cm' },
    { size: 'L', chest: '108 cm', shoulder: '49 cm', length: '74 cm', sleeve: '22 cm' },
    { size: 'XL', chest: '114 cm', shoulder: '51 cm', length: '76 cm', sleeve: '23 cm' },
    { size: 'XXL', chest: '120 cm', shoulder: '53 cm', length: '78 cm', sleeve: '24 cm' },
  ],
  fitModels: [
    { heightCm: 178, heightImperial: `5'10"`, sizeWorn: 'M', fitNote: 'regular fit' },
    { heightCm: 165, heightImperial: `5'5"`, sizeWorn: 'S', fitNote: 'relaxed drape on a smaller frame' },
  ],
};

const PDP_BUILTIN_OVERSIZED_PRESET: PdpSizeTablePresetBody = {
  measurements: [
    { size: 'XS', chest: '94 cm', shoulder: '45 cm', length: '70 cm', sleeve: '20 cm' },
    { size: 'S', chest: '100 cm', shoulder: '47 cm', length: '72 cm', sleeve: '21 cm' },
    { size: 'M', chest: '106 cm', shoulder: '49 cm', length: '74 cm', sleeve: '22 cm' },
    { size: 'L', chest: '112 cm', shoulder: '51 cm', length: '76 cm', sleeve: '23 cm' },
    { size: 'XL', chest: '118 cm', shoulder: '53 cm', length: '78 cm', sleeve: '24 cm' },
    { size: 'XXL', chest: '124 cm', shoulder: '55 cm', length: '80 cm', sleeve: '25 cm' },
  ],
  fitModels: [
    { heightCm: 178, heightImperial: `5'10"`, sizeWorn: 'M', fitNote: 'intentional oversized silhouette' },
    { heightCm: 165, heightImperial: `5'5"`, sizeWorn: 'S', fitNote: 'roomy drape on a smaller frame' },
  ],
};

const PDP_BUILTIN_FITTED_PRESET: PdpSizeTablePresetBody = {
  measurements: [
    { size: 'XS', chest: '88 cm', shoulder: '42 cm', length: '67 cm', sleeve: '19 cm' },
    { size: 'S', chest: '94 cm', shoulder: '44 cm', length: '69 cm', sleeve: '19.5 cm' },
    { size: 'M', chest: '100 cm', shoulder: '46 cm', length: '71 cm', sleeve: '20.5 cm' },
    { size: 'L', chest: '106 cm', shoulder: '48 cm', length: '73 cm', sleeve: '21.5 cm' },
    { size: 'XL', chest: '112 cm', shoulder: '50 cm', length: '75 cm', sleeve: '22.5 cm' },
    { size: 'XXL', chest: '118 cm', shoulder: '52 cm', length: '77 cm', sleeve: '23.5 cm' },
  ],
  fitModels: [
    { heightCm: 175, heightImperial: `5'9"`, sizeWorn: 'M', fitNote: 'closer body fit' },
    { heightCm: 162, heightImperial: `5'4"`, sizeWorn: 'S', fitNote: 'tailored feel on a smaller frame' },
  ],
};

/**
 * Keys align with `medusa-backend/src/scripts/data/size-tables-defaults.json` and the Admin preset dropdown.
 * Used when the store has not published `sizeTables` yet so `product.sizeTableKey` still resolves.
 */
const PDP_BUILTIN_SIZE_PRESETS: Record<string, PdpSizeTablePresetBody> = {
  regular: PDP_DEFAULT_SIZE_PRESET,
  oversized: PDP_BUILTIN_OVERSIZED_PRESET,
  fitted: PDP_BUILTIN_FITTED_PRESET,
};

export type StorefrontSizeTableSettingsInput = {
  sizeTables?: unknown;
  defaultSizeTableKey?: unknown;
  /** Ignored; allows passing full `GET /storefront/settings` payload from Next. */
  delivery?: unknown;
};

const coerceString = z.string().trim().min(1);

const PdpFitModelSchema = z.object({
  heightCm: z.coerce.number().refine(n => Number.isFinite(n), "Invalid"),
  heightImperial: coerceString,
  sizeWorn: coerceString,
  fitNote: coerceString.optional(),
});

const PdpSizeTableRowSchema = z.object({
  size: coerceString,
  chest: coerceString,
  shoulder: coerceString,
  length: coerceString,
  sleeve: coerceString,
});

const PresetBodySchema = z.preprocess(
  (val: any) => {
    if (!val || typeof val !== 'object') return val;
    return {
      ...val,
      displayLabel: val.displayLabel ?? {
        en: val.label_en ?? val.labelEn,
        ar: val.label_ar ?? val.labelAr,
      }
    };
  },
  z.object({
    measurements: z.array(PdpSizeTableRowSchema).min(1),
    fitModels: z.array(PdpFitModelSchema).optional().default([]),
    displayLabel: z.object({
      en: coerceString.optional(),
      ar: coerceString.optional(),
    }).refine(val => val.en || val.ar, "Require at least one label").optional(),
  })
).catch(undefined as any);

const SizeTablesRecordSchema = z.record(z.string().trim().min(1), PresetBodySchema)
  .transform(record => {
    const out: Record<string, PdpSizeTablePresetBody> = {};
    for (const [k, v] of Object.entries(record)) {
      if (v !== undefined) out[k] = v;
    }
    return out;
  });

/**
 * Operators sometimes paste the whole defaults file into `store.metadata.sizeTables`, which nests presets under `tables`.
 */
function unwrapSizeTablesMetadata(raw: unknown): unknown {
  if (raw == null) return raw;
  if (typeof raw === 'string') {
    try {
      return unwrapSizeTablesMetadata(JSON.parse(raw) as unknown);
    } catch {
      return raw;
    }
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const o = raw as Record<string, unknown>;
  const inner = o.tables;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner;
  }
  return raw;
}

/**
 * Resolves PDP size chart + model lines from Medusa `GET /storefront/settings` and optional `product.sizeTableKey`.
 * When the store has no valid presets, falls back to built-in `regular` / `oversized` / `fitted` (same as apply script defaults).
 */
export function mergePdpSizeTableConfig(
  settings: StorefrontSizeTableSettingsInput | null | undefined,
  productSizeTableKey?: string | null,
): PdpSizeTableConfig {
  const builtInKey = 'regular';
  
  const rawData = unwrapSizeTablesMetadata(settings?.sizeTables);
  let remotePresets: Record<string, PdpSizeTablePresetBody> = {};
  
  if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
     const result = SizeTablesRecordSchema.safeParse(rawData);
     if (result.success) remotePresets = result.data;
  }

  const remoteKeys = Object.keys(remotePresets);
  const presets = remoteKeys.length > 0 ? remotePresets : PDP_BUILTIN_SIZE_PRESETS;
  const presetKeys = Object.keys(presets);

  const defaultKeyRaw = typeof settings?.defaultSizeTableKey === 'string' ? settings.defaultSizeTableKey.trim() : undefined;
  const defaultKey =
    defaultKeyRaw && defaultKeyRaw in presets ? defaultKeyRaw : presetKeys.includes(builtInKey) ? builtInKey : presetKeys[0]!;

  const want = typeof productSizeTableKey === 'string' ? productSizeTableKey.trim() : undefined;
  if (want && want in presets) {
    return { ...presets[want], presetKeyUsed: want };
  }
  if (defaultKey in presets) {
    return { ...presets[defaultKey], presetKeyUsed: defaultKey };
  }
  const first = presetKeys[0]!;
  return { ...presets[first], presetKeyUsed: first };
}

/**
 * Fit copy for PDP / accordion / size guide: use Medusa preset `fitModels` when present.
 * When operators publish measurements but omit `fitModels`, backfill from built-in presets
 * for the same key (aligned with `size-tables-defaults.json`), then `regular` defaults.
 */
export function resolvePdpDisplayFitModels(config: PdpSizeTableConfig): PdpFitModel[] {
  if (config.fitModels && config.fitModels.length > 0) {
    return config.fitModels;
  }
  const fromBuiltin = PDP_BUILTIN_SIZE_PRESETS[config.presetKeyUsed]?.fitModels;
  if (fromBuiltin?.length) {
    return [...fromBuiltin];
  }
  return [...PDP_DEFAULT_SIZE_PRESET.fitModels];
}
