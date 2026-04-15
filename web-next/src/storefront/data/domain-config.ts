// src/data/domain-config.ts

import type { PdpFitModel, ProductSizeKey } from './catalog-types';

/** PDP size ladder entries; `disabled` marks sizes never sold for this storefront build. */
export type PdpSizeSchemaEntry = { key: ProductSizeKey; disabled?: boolean };
import type { PdpDeliveryRules } from '../utils/deliveryEstimate';

/** Partial override from Medusa `store.metadata.delivery` (see medusa-backend README). */
export type StorefrontDeliveryMetadata = Partial<{
  standardMinDays: number;
  standardMaxDays: number;
  expressMinDays: number;
  expressMaxDays: number;
  cutoffHourLocal: number;
  cutoffMinuteLocal: number;
  /** If set, used for “arrives by”; otherwise `standardMaxDays` is used. */
  standardMaxBusinessDays: number;
  /**
   * Optional display-only standard shipping in EGP for Product JSON-LD `OfferShippingDetails`.
   * Must match checkout reality — set in Medusa Admin store metadata `delivery` when operators want Rich Results shipping hints.
   */
  jsonLdStandardShippingEgp: number;
}>;

const INT_FIELDS: (keyof StorefrontDeliveryMetadata)[] = [
  'standardMinDays',
  'standardMaxDays',
  'expressMinDays',
  'expressMaxDays',
  'cutoffHourLocal',
  'cutoffMinuteLocal',
  'standardMaxBusinessDays',
];

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Defaults match previous hard-coded PDP behavior. */
export const PDP_DEFAULT_DELIVERY_RULES: PdpDeliveryRules = {
  cutoffHourLocal: 14,
  cutoffMinuteLocal: 0,
  standardMaxBusinessDays: 5,
  standardMinDays: 3,
  standardMaxDays: 5,
  expressMinDays: 1,
  expressMaxDays: 2,
};

/**
 * Merge Medusa `store.metadata.delivery` into PDP delivery rules. Invalid or missing keys keep defaults.
 */
export function mergePdpDeliveryRules(remote: unknown): PdpDeliveryRules {
  const out: PdpDeliveryRules = { ...PDP_DEFAULT_DELIVERY_RULES };
  let parsed: unknown = remote;
  if (typeof remote === 'string') {
    try {
      parsed = JSON.parse(remote) as unknown;
    } catch {
      return out;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return out;
  }
  const d = parsed as Record<string, unknown>;
  for (const key of INT_FIELDS) {
    const v = d[key as string];
    if (typeof v !== 'number' && typeof v !== 'string') continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (key === 'cutoffHourLocal') {
      out.cutoffHourLocal = clampInt(n, 0, 23);
    } else if (key === 'cutoffMinuteLocal') {
      out.cutoffMinuteLocal = clampInt(n, 0, 59);
    } else if (key === 'standardMinDays') {
      out.standardMinDays = clampInt(n, 1, 30);
    } else if (key === 'standardMaxDays') {
      out.standardMaxDays = clampInt(n, 1, 30);
    } else if (key === 'expressMinDays') {
      out.expressMinDays = clampInt(n, 1, 30);
    } else if (key === 'expressMaxDays') {
      out.expressMaxDays = clampInt(n, 1, 30);
    } else if (key === 'standardMaxBusinessDays') {
      out.standardMaxBusinessDays = clampInt(n, 1, 30);
    }
  }
  if (out.standardMinDays > out.standardMaxDays) {
    [out.standardMinDays, out.standardMaxDays] = [out.standardMaxDays, out.standardMinDays];
  }
  if (out.expressMinDays > out.expressMaxDays) {
    [out.expressMinDays, out.expressMaxDays] = [out.expressMaxDays, out.expressMinDays];
  }
  const rawBiz = d.standardMaxBusinessDays;
  const explicitBiz =
    rawBiz !== undefined &&
    rawBiz !== null &&
    (typeof rawBiz === 'number' || (typeof rawBiz === 'string' && rawBiz.trim() !== ''));
  if (!explicitBiz || !Number.isFinite(Number(rawBiz))) {
    out.standardMaxBusinessDays = out.standardMaxDays;
  } else {
    out.standardMaxBusinessDays = clampInt(Number(rawBiz), 1, 30);
  }
  return out;
}

/**
 * Reads `jsonLdStandardShippingEgp` from Medusa `store.metadata.delivery` (number or numeric string).
 * Returns null if unset or invalid — callers must not invent a fallback price.
 */
export function parseJsonLdStandardShippingEgpFromStoreDelivery(remote: unknown): number | null {
  let parsed: unknown = remote;
  if (typeof remote === 'string') {
    try {
      parsed = JSON.parse(remote) as unknown;
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const d = parsed as Record<string, unknown>;
  const v = d.jsonLdStandardShippingEgp ?? d.json_ld_standard_shipping_egp;
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : NaN;
  if (!Number.isFinite(n) || n < 0) {
    return null;
  }
  return clampInt(n, 0, 500_000);
}

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

function coalesceTrimmedString(v: unknown): string | undefined {
  if (typeof v !== 'string' || !v.trim()) return undefined;
  return v.trim();
}

function parseFitModelsArray(raw: unknown): PdpFitModel[] {
  if (!Array.isArray(raw)) return [];
  const out: PdpFitModel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const heightCm = typeof o.heightCm === 'number' ? o.heightCm : Number(o.heightCm);
    const heightImperial = coalesceTrimmedString(o.heightImperial);
    const sizeWorn = coalesceTrimmedString(o.sizeWorn);
    if (!Number.isFinite(heightCm) || !heightImperial || !sizeWorn) continue;
    const fitNote = coalesceTrimmedString(o.fitNote);
    out.push({ heightCm, heightImperial, sizeWorn, ...(fitNote ? { fitNote } : {}) });
  }
  return out;
}

function parseMeasurementsArray(raw: unknown): PdpSizeTableRow[] {
  if (!Array.isArray(raw)) return [];
  const out: PdpSizeTableRow[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const size = coalesceTrimmedString(o.size);
    const chest = coalesceTrimmedString(o.chest);
    const shoulder = coalesceTrimmedString(o.shoulder);
    const length = coalesceTrimmedString(o.length);
    const sleeve = coalesceTrimmedString(o.sleeve);
    if (!size || !chest || !shoulder || !length || !sleeve) continue;
    out.push({ size, chest, shoulder, length, sleeve });
  }
  return out;
}

function parsePresetBody(raw: unknown): PdpSizeTablePresetBody | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const measurements = parseMeasurementsArray(o.measurements);
  if (measurements.length === 0) return null;
  const fitModels = parseFitModelsArray(o.fitModels);
  return { measurements, fitModels };
}

function parseSizeTablesRecord(raw: unknown): Record<string, PdpSizeTablePresetBody> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const out: Record<string, PdpSizeTablePresetBody> = {};
  for (const [k, v] of Object.entries(src)) {
    const key = k.trim();
    if (!key) continue;
    const body = parsePresetBody(v);
    if (body) out[key] = body;
  }
  return out;
}

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
  const remotePresets = parseSizeTablesRecord(unwrapSizeTablesMetadata(settings?.sizeTables));
  const remoteKeys = Object.keys(remotePresets);
  const presets = remoteKeys.length > 0 ? remotePresets : PDP_BUILTIN_SIZE_PRESETS;
  const presetKeys = Object.keys(presets);

  const defaultKeyRaw = coalesceTrimmedString(settings?.defaultSizeTableKey);
  const defaultKey =
    defaultKeyRaw && defaultKeyRaw in presets ? defaultKeyRaw : presetKeys.includes(builtInKey) ? builtInKey : presetKeys[0]!;

  const want = coalesceTrimmedString(productSizeTableKey);
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
  if (config.fitModels.length > 0) {
    return config.fitModels;
  }
  const fromBuiltin = PDP_BUILTIN_SIZE_PRESETS[config.presetKeyUsed]?.fitModels;
  if (fromBuiltin?.length) {
    return [...fromBuiltin];
  }
  return [...PDP_DEFAULT_SIZE_PRESET.fitModels];
}

export const EGYPT_CITY_OPTIONS = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Sharqia',
  'Dakahlia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Port Said',
  'Ismailia',
  'Suez',
  'North Sinai',
  'South Sinai',
  'Faiyum',
  'Beni Suef',
  'Minya',
  'Assiut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Red Sea',
  'New Valley',
  'Matrouh',
] as const

export const PDP_SCHEMA = {
  viewLabels: ['front on-body', 'back fit card', 'print proof', 'fabric and tag', 'flat lay', 'lifestyle', 'weight proof', 'wash check'],
  surfacePhrases: [
    'front on-body fit view',
    'back fit verification card',
    'print proof panel',
    'fabric and tag proof panel',
    'warm textured flat lay',
    'street lifestyle setting',
    '220 GSM proof card',
    '3x wash proof card',
  ],
  sizes: [
    { key: 'XS' },
    { key: 'S' },
    { key: 'M' },
    { key: 'L' },
    { key: 'XL' },
    { key: 'XXL' },
  ] as PdpSizeSchemaEntry[],
  sizeTable: [...PDP_DEFAULT_SIZE_PRESET.measurements],
  features: [
    { label: '220 GSM heavyweight cotton', icon: 'FabricIcon' as const },
    { label: 'High-fidelity DTF print', icon: 'PrintIcon' as const },
    { label: 'Relaxed unisex fit', icon: 'SilhouetteIcon' as const },
    { label: 'Machine wash cold', icon: 'CareIcon' as const },
  ],
  trustSignals: [
    { label: 'Express shipping', icon: 'Truck' as const },
    { label: 'Small batch', icon: 'Shield' as const },
    { label: 'Secure checkout', icon: 'Lock' as const },
  ],
  /** Persistent PDP trust line (Guidelines §8.3) */
  trustStripItems: ['220 GSM cotton', 'Licensed art', 'Free exchange 14d', 'COD available'] as const,
  /** StoryBrand micro-plan strip */
  storyPlanSteps: ['Find your feeling', 'Pick your design', 'It arrives at your door'] as const,
  /** Gallery image indices (0-based) for the “See it styled” grid */
  wornByGalleryIndices: [1, 2, 0] as const,
  /** Same-day ship cutoff (local) + delivery windows for PDP copy (overridable via Medusa store metadata). */
  deliveryRules: PDP_DEFAULT_DELIVERY_RULES,
  copy: {
    addBtnCTA: 'Add to Bag',
    shippingLine: 'Express shipping · 14-day hassle-free returns · Secure checkout',
    deliveryEyebrow: 'Delivery',
    deliveryEstimateTitle: 'Estimated arrival',
    /** PDP uses `formatPdpStandardBadgeLabel` / `formatPdpExpressBadgeLabel` from merged rules; these are fallbacks only. */
    deliveryStandardBadge: 'Standard · 3–5 business days',
    deliveryExpressBadge: 'Express · 1–2 business days',
    deliveryEstimateNote: 'Final speed and shipping cost are confirmed at checkout.',
    deliveryUrgencyBeforeCutoff: 'About {hours}h left to ship today (before {cutoffTime}).',
    deliveryUrgencyTight: 'Order within the next {hours}h — ships today.',
    deliveryAfterCutoff: 'Orders placed now ship on the next business day.',
    deliveryWeekendHold: 'We ship Monday — order anytime; your place in queue is saved.',
    deliveryArrivesByStandard: 'Standard delivery often arrives by {date} (Egypt).',
    reviewsSoonEyebrow: 'Reviews',
    reviewsSoonTitle: 'We’re just getting started',
    reviewsSoonBody:
      'Public product reviews aren’t live yet — we’re a new label building trust one shipment at a time. Questions, fit help, or a photo of your tee? Reach us on WhatsApp or Instagram.',
    reviewsSoonWhatsappCta: 'WhatsApp us',
    reviewsSoonInstagramCta: 'Instagram',
    reviewsSoonNoLinks:
      'Support links are configured via site settings when you’re ready to publish them.',
    crossSellBundleFbtCta: 'Add pair to bag',
    crossSellBundleStyleCta: 'Add outfit to bag',
    crossSellNeedSize: 'Choose a size first to add bundles.',
    crossSellBundleAdded: 'Bundle added — open bag to review.',
    notifyMeCTA: 'Notify Me',
    lowStockLabel: 'Only a few left',
    sizeGuideLabel: 'Size guide',
    selectSizePrompt: 'Choose Size',
    pdpStickySelectSizeHint: 'Select a size',
    sizeRequiredPrompt: 'Choose a size above first.',
    storyCardHeading: 'For the one who…',
    illustratedByLabel: 'Illustrated by',
    accordionProductDetails: 'Product Details & Fit',
    accordionDesignStory: 'The Design Story',
    accordionShipping: 'Shipping & Returns',
    shippingSections: [
      {
        title: 'Secure delivery',
        body:
          'Next-day shipping available within Cairo & Giza. 2–3 days for wider regions.',
      },
      {
        title: 'Returns',
        body:
          '14-day hassle-free returns. If you’re not entirely satisfied with your purchase, you may return it within 14 days of receipt for an exchange or full refund.',
      },
    ],
    trustReturnsLine: '14-day hassle-free returns',
    sizeGuideModelNote: 'Open the size guide for measurements and on-body fit notes.',
    sizeGuideFlatDiagramTitle: 'Flat sketch (your size)',
    sizeGuideFlatDiagramSelectSize:
      'Select a size in the table above to see the flat measurement sketch.',
    sizeGuideFlatDiagramDisclaimer:
      'Illustrative only — use the chart values as the source of truth.',
    /** Placeholders: `{heightCm}`, `{heightImperial}`, `{sizeWorn}`, `{fitNoteSuffix}` (empty or localized note). */
    sizeGuideFitModelTemplate:
      'Model is {heightCm} cm / {heightImperial}, wearing size {sizeWorn}{fitNoteSuffix}.',
    /** Appended when `fitNote` is set; `{fitNote}` = operator text from size preset. */
    sizeGuideFitNoteSuffix: ' — {fitNote}',
    /** One line under the model line(s); placeholders match `PdpSizeTableRow` fields. */
    sizeGuideFlatMeasurementsTemplate:
      'Flat measurements for {size}: chest {chest}, shoulder {shoulder}, length {length}, sleeve {sleeve}.',
    /** Shown in the size guide when product `physicalAttributes` exist but preset has no `fitModels`. */
    sizeGuidePhysicalWeight: 'Weight: {value}',
    sizeGuidePhysicalDimensions: 'Dimensions (L × W × H): {length} × {width} × {height}',
    sizeGuidePhysicalMaterial: 'Material: {value}',
    sizeGuidePhysicalOrigin: 'Origin: {value}',
    sizeGuidePhysicalHs: 'HS code: {value}',
    sizeGuidePhysicalMid: 'MID code: {value}',
    /** Fallback when no size-table fit data is available */
    modelLineTemplate: 'See the size guide for how this piece fits on the body{fit}.',
    wornByEyebrow: 'Styling',
    wornByTitle: 'See it styled',
    relatedMoreFromSubtitle: 'Designs from the same feeling.',
    styleItWithTitle: 'Style it with',
    styleItWithSubtitle: 'Pieces that pair across feelings and occasions.',
    wearerStoriesEyebrow: 'From the studio',
    wearerStoriesTitle: 'Why we made this piece',
    wearerStoriesNote: 'Design intent and craft notes — not customer reviews or verified purchases.',
    wornByCaptions: ['Studio days', 'Street light', 'Your rotation'],
    whatsappHelpLabel: 'Questions? WhatsApp us',
    notifyEmailPlaceholder: 'Email for restock reminder',
    notifyFieldLabel: 'Save this size for a restock reminder',
    notifySubmitLabel: 'Save reminder',
    notifySuccess: 'Saved on this device for the restock reminder preview.',
    notifyInvalidEmail: 'Enter a valid email address.',
    inventoryLowFormat: 'Only {n} left',
    /** Accordion “Design story” — making / craft (card above = emotional hook) */
    designStoryAccordionBody:
      'Printed with care using high-fidelity DTF: crisp edges, wash-fast color, and a hand that stays soft after repeat wears. Each piece is inspected before it ships so the graphic matches what you saw in the gallery.',
    frequentlyBoughtTogetherEyebrow: 'Often paired',
    frequentlyBoughtTogetherTitle: 'Frequently bought together',
    frequentlyBoughtTogetherSubtitle: 'Popular pairings from the studio — add each in your size from the product page.',
    customersAlsoBoughtEyebrow: 'Trending picks',
    customersAlsoBoughtTitle: 'Customers also bought',
    customersAlsoBoughtSubtitle: 'Designs others checked out with this one — browse in your size on each product page.',
    buyNowCta: 'Buy now',
    lightboxClose: 'Close',
    lightboxPrev: 'Previous image',
    lightboxNext: 'Next image',
    lightboxCounterTemplate: '{current} / {total}',
    lightboxDialogLabel: 'Enlarged product gallery',
    videoEyebrow: 'Motion',
    videoTitle: 'Drape & movement',
    videoPlaceholderBody: 'Product video placeholder — clip coming soon.',
    videoAriaLabel: 'Product video area. Motion preview not available yet; still image shown as poster.',
    /** When product name is missing before data resolves. */
    pdpHeroImageNameFallback: 'this design',
    /** Hero / gallery fallback alt — `{name}` only (no garment type). */
    pdpHeroImageAltTemplate: 'HORO “{name}”.',
    pdpRelatedCardImageAltTemplate: 'HORO “{name}”.',
    pdpPriceSelectedSizeTemplate: 'Selected size {size}',
    pdpPriceForSizeTemplate: 'Price shown for size {size}',
    /** Screen reader when the main gallery image changes; placeholders `{current}`, `{total}`, `{label}`. */
    pdpGalleryLiveTemplate: 'Image {current} of {total}: {label}',
    pdpGalleryThumbnailsAria: 'Product image thumbnails',
    pdpGalleryRegionAria: 'Product images',
    pdpGalleryPrev: 'Previous product image',
    pdpGalleryNext: 'Next product image',
    /** `{label}` = view label from gallery builder. */
    pdpGalleryShowImageTemplate: 'Show {label}',
    pdpGalleryOpenFullScreenTemplate: 'Open full screen — {label}',
    pdpProductNotFound: 'Product not found.',
    pdpSizeSectionLabel: 'Size',
    pdpSizeGroupAria: 'Size',
    pdpQuickViewSelectSizeLabel: 'Select size',
    pdpOutOfStockForSize: 'Out of stock for this size',
    /** Shown as `title` on unavailable size buttons (inventory ladder). */
    pdpSizeOosHint: 'Back soon — use Notify me below for this size.',
    pdpPrimaryCtaAddedLabel: 'Added to bag',
    styleItWithEyebrow: 'Pairing',
    pdpZodiacCapsuleLabel: 'Zodiac capsule',
    pdpRelatedEyebrow: 'Discovery',
    pdpRelatedMoreFromTemplate: 'More from {feeling}',
    pdpRelatedFallbackFeeling: 'this feeling',
    pdpRelatedCardSrTemplate: 'View {name}, {price}',
    sizeGuidePresetEyebrow: 'Guide preset',
    sizeGuideTableSize: 'Size',
    sizeGuideTableChest: 'Chest',
    sizeGuideTableShoulder: 'Shoulder',
    sizeGuideTableLength: 'Length',
    sizeGuideTableSleeve: 'Sleeve',
    /** Flat diagram `<title>` / `aria-label`; placeholders `{size}`, `{chest}`, `{shoulder}`, `{length}`, `{sleeve}`. */
    sizeGuideFlatDiagramAriaTemplate:
      'Flat sketch for size {size}: chest {chest}, shoulder {shoulder}, length {length}, sleeve {sleeve}. Illustrative only.',
  },
};

/** Replace `{key}` placeholders in PDP copy templates (order-independent). */
export function fillPdpCopyTemplate(template: string, vars: Record<string, string | number>): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.split(`{${key}}`).join(String(value));
  }
  return out;
}

export const CART_SCHEMA = {
  trustStripItems: ['Free exchange 14d', 'COD available', '220 GSM cotton'] as const,
  copy: {
    heading: 'Your cart',
    emptyCta: 'Find Your Design',
    primaryCta: 'Proceed to checkout',
    secondaryCta: 'Continue shopping',
    orderSummaryHeading: 'Order summary',
    shippingExplainer: 'Estimated shipping (standard, Egypt): you’ll confirm speed at checkout.',
    shippingLabel: 'Est. shipping',
    shippingConfirmedAtCheckout: 'Confirmed at checkout',
    totalLabel: 'Est. order total',
    subtotalLabel: 'Subtotal',
    quantityLabel: 'Qty',
    removeLabel: 'Remove',
    itemLabelSingular: 'item',
    itemLabelPlural: 'items',
    giftWrapLabel: 'Gift wrap + story card',
    giftUpsellHeading: 'Make it a gift',
    giftUpsellIncludedHeading: 'Gift add-ons',
    giftUpsellBody: 'Add story card + gift wrap',
    giftUpsellIncludedBody: 'Story card + gift wrap is included in your estimate.',
    giftUpsellCta: 'Add Gift Wrap +200',
    giftUpsellDecline: 'No thanks',
    giftUpsellRemove: 'Remove gift wrap',
    bundleUpsellHeading: 'Add a 3rd, save 100 EGP',
    bundleUpsellBody: 'Pick one more design and get 100 EGP off your order.',
    bundleUpsellCta: 'Browse designs →',
    emptyBody: 'Your bag is empty. Explore feelings and add a design in your size when you’re ready.',
    quantityUpdated: 'Quantity updated for {name}.',
    quantityMinReached: '{name} is already at the minimum quantity.',
    itemRemoved: '{name} removed from your cart.',
    removeUndoPrompt: '{name} removed.',
    undoRemoveCta: 'Undo',
    itemRestored: '{name} is back in your bag.',
    giftWrapAdded: 'Gift wrap added to your order estimate.',
    giftWrapRemoved: 'Gift wrap removed from your order estimate.',
    estimatedDeliveryLabel: 'Est. delivery (standard)',
    estimatedDeliveryCheckoutNote: 'Express options and exact dates are confirmed at checkout.',
  },
} as const;

export const MINI_CART_SCHEMA = {
  copy: {
    addedLabel: 'Added to bag',
    addedLabelAr: 'أُضيف إلى الحقيبة',
    checkoutCta: 'Checkout',
    checkoutCtaAr: 'الدفع',
    viewBagCta: 'View Bag',
    viewBagCtaAr: 'عرض الحقيبة',
    continueCta: 'Continue shopping',
    continueCtaAr: 'واصل التسوق',
    subtotalLabel: 'Subtotal',
    subtotalLabelAr: 'الإجمالي الفرعي',
    shippingAtCheckoutNote: 'Shipping is confirmed at checkout.',
    shippingAtCheckoutNoteAr: 'يُؤكَّد الشحن عند الدفع.',
    itemSingular: 'item',
    itemSingularAr: 'قطعة',
    itemPlural: 'items',
    itemPluralAr: 'قطع',
    sizeLabel: 'Size',
    sizeLabelAr: 'المقاس',
    qtyLabel: 'Qty',
    qtyLabelAr: 'الكمية',
    closeLabel: 'Close',
    closeLabelAr: 'إغلاق',
    dialogLabel: 'Item added to bag',
    dialogLabelAr: 'تمت إضافة قطعة إلى الحقيبة',
    scrimLabel: 'Close mini cart',
    scrimLabelAr: 'إغلاق السلة المصغرة',
  },
  trustItems: ['Free exchange 14d', 'COD available', 'Secure checkout'] as const,
  trustItemsAr: ['استبدال مجاني ١٤ يوم', 'الدفع عند الاستلام', 'دفع آمن'] as const,
} as const;

export const OCCASION_SCHEMA = {
  copy: {
    hubEyebrow: 'Shop by occasion',
    hubTitle: 'Give something that means something',
    hubSubtitle: 'Find the design that fits the moment.',
    featuredCta: 'Explore gifts →',
    secondaryCta: 'Explore →',
    secondaryNavLabel: 'Or explore by feeling:',
    secondaryNavCta: 'Shop by feeling',
    breadcrumbLabel: 'Breadcrumb',
    giftBannerHeading: 'Make it a gift',
    giftBannerBody: 'Add a story card + gift wrap at checkout.',
    giftBannerChip: 'Gift option at cart',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Feeling',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All feelings',
    filterAndSortCta: 'Filter & sort',
    searchThisOccasionCta: 'Search this occasion',
    resetFiltersCta: 'Reset filters',
    moreOccasionsHeading: 'More occasions',
    noFilteredResults: 'No designs match these filters.',
    noOccasionResults: 'No designs in this occasion yet.',
    showCountCta: 'Show {count} {label}',
    designSingular: 'design',
    designPlural: 'designs',
    notFoundTitle: 'Occasion not found.',
    backToOccasionsCta: 'Back to occasions',
  },
} as const;

export const BRAND_TRUST_POINTS = [
  { icon: 'layers', title: '220 GSM Cotton', sub: 'Heavyweight feel that keeps its shape' },
  { icon: 'verified', title: 'Original Licensed Design', sub: 'Clearly credited and properly sourced' },
  { icon: 'history', title: 'Free Exchange 14 Days', sub: 'Less sizing stress, easier decisions' },
  { icon: 'payments', title: 'COD Available', sub: 'Pay at your doorstep' },
] as const;

export const VIBES_SCHEMA = {
  copy: {
    hubEyebrow: 'Shop by feeling',
    hubTitle: 'Which feeling is yours?',
    hubSubtitle: 'Every design starts with a feeling. Start with yours.',
    hubHeroAlt: 'Editorial collage showing the five HORO feelings through graphic-tee styling.',
    cardExploreCta: 'Explore →',
    cardSeeVibeCta: 'See feeling →',
    secondaryNavLabel: 'Or explore another way',
    secondaryNavCta: 'Shop by moment',
    cardAriaTemplate: '{cta} the {name} feeling collection',
  },
} as const;

export const ABOUT_SCHEMA = {
  copy: {
    primaryCta: 'Shop by feeling',
    bridgeCta: 'Shop by feeling',
    heroRegionLabel: 'HORO story hero',
    bridgeRegionLabel: 'HORO collection bridge',
  },
} as const;

export const QUICK_VIEW_SCHEMA = {
  copy: {
    openCta: 'Quick view',
    openAriaTemplate: 'Quick view: {name}',
    closeLabel: 'Close quick view',
    chooseSizeCta: 'Choose Size',
    addToBagCta: 'Add to Bag — {price}',
    viewBagCta: 'View Bag',
    continueBrowsingCta: 'Continue browsing',
    viewFullProductCta: 'View full product',
    sizeChartLabel: 'Size chart',
    sizeChartRegionLabel: 'Quick view size chart',
    addedStatus: 'Added to bag.',
  },
} as const;

/**
 * Extra localized / colloquial tokens merged into `expandQueryVariants` (search/view.ts).
 * Values are expansion phrases scored against catalog text — not SQL column names.
 */
export const SEARCH_SYNONYMS_SCHEMA: Record<string, readonly string[]> = {
  tshirt: ['graphic tee', 't shirt', 't-shirt', 'tee'],
  tee: ['graphic tee', 't shirt'],
  shirt: ['graphic tee', 't shirt'],
  تيشيرت: ['graphic tee', 't shirt', 'tee'],
  تيشرت: ['graphic tee', 't shirt'],
  obsidian: ['black', 'dark', 'midnight'],
  black: ['obsidian', 'midnight', 'dark tee'],
  'أسود': ['obsidian', 'black', 'midnight'],
  papyrus: ['off white', 'cream', 'natural'],
  white: ['papyrus', 'clean white', 'natural tee'],
  egp: ['price', 'egypt', 'cairo'],
  cairo: ['egypt', 'shipping', 'giza'],
  giza: ['cairo', 'egypt'],
  oversized: ['relaxed unisex fit', 'quiet revolt', 'loose fit'],
  birthday: ['birthday pick', 'gift something real'],
  ramadan: ['eid and ramadan', 'eid', 'festive'],
} as const;

export const SEARCH_SCHEMA = {
  copy: {
    placeholder: 'Search designs, feelings, or occasions...',
    searchLabel: 'Search',
    searchAllLabel: 'Search all designs',
    searchingInLabel: 'Searching in',
    popularLabel: 'Popular',
    designsTab: 'Designs',
    vibesTab: 'Feelings',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Feeling',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All feelings',
    filterAndSortCta: 'Filter & sort',
    resetFiltersCta: 'Reset filters',
    quickViewCta: 'Quick view',
    showCountCta: 'Show {count} {label}',
    designSingular: 'design',
    designPlural: 'designs',
    viewDesignsCta: 'See designs →',
    viewVibeCta: 'Explore feeling →',
    shopByVibeCta: 'Shop by feeling',
    browseAllDesignsCta: 'Browse All Designs',
    noFilteredResults: 'No designs match these filters.',
    noDesignResults: 'No designs match this search yet.',
    noVibeResults: 'No feelings match this search yet.',
    resultsFallback: 'Browse everything — or try a popular search below.',
    scopedResultsFallback: 'Browse designs in {scope} — or try a popular search below.',
    resultsForQuery: '{count} results for “{query}”',
    noResultsForQuery: 'No results for “{query}”',
    zeroResultsSuggestionsHeading: 'Try these instead',
    shopByOccasionCta: 'Shop by moment',
    sizeFilterLabel: 'Size in stock',
    allSizesLabel: 'All sizes',
    artistLabel: 'Artist',
    allArtistsLabel: 'All artists',
    occasionFilterLabel: 'Occasion',
    allOccasionsFilterLabel: 'All occasions',
    colorLabel: 'Tee color',
    allColorsLabel: 'All colors',
  },
} as const;

/** Static checkout reassurance only — payment types are rendered from live Medusa `payment_providers`. */
export const CHECKOUT_SCHEMA = {
  trustStripItemsStatic: [
    'SSL-encrypted checkout',
    '14-day exchange',
    'Guest checkout',
  ] as const,
} as const;

function optionalEnvValue(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export const HORO_SUPPORT_CHANNELS = {
  effectiveDate: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_SUPPORT_EFFECTIVE_DATE) ?? 'March 25, 2026',
  instagramUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_INSTAGRAM_URL),
  whatsappSupportUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_WHATSAPP_SUPPORT_URL),
  whatsappTrackingUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_WHATSAPP_TRACKING_URL),
} as const;

export function isConfiguredExternalUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url);
}

export function withSupportMessage(url: string | null | undefined, message: string): string | null {
  if (!isConfiguredExternalUrl(url)) return null;

  try {
    const next = new URL(url);
    next.searchParams.set('text', message);
    return next.toString();
  } catch {
    return url;
  }
}

export type PdpFeatureIconKey = (typeof PDP_SCHEMA.features)[number]['icon'];
export type PdpTrustIconKey = (typeof PDP_SCHEMA.trustSignals)[number]['icon'];
