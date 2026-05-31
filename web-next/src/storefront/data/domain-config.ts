// src/data/domain-config.ts
import type { PdpFitModel, ProductSizeKey } from './catalog-types';
export type PdpSizeSchemaEntry = { key: ProductSizeKey; disabled?: boolean };

export * from './delivery';
export * from './size-tables';
export * from './icon-key-registry';
export * from './search-synonyms';
export * from './constants';
export * from './support-channels';

import { PDP_DEFAULT_DELIVERY_RULES } from './delivery';
import { PDP_DEFAULT_SIZE_PRESET } from './size-tables';

export const PDP_SCHEMA = {
  viewLabels: ['front on-body', 'back fit card', 'print proof', 'fabric and tag', 'flat lay', 'lifestyle', 'weight proof', 'wash check'],
  surfacePhrases: [
    'front on-body fit view',
    'back fit verification card',
    'print proof panel',
    'fabric and tag proof panel',
    'warm textured flat lay',
    'street lifestyle setting',
    'fabric proof card',
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
    { label: 'Cotton tee', icon: 'FabricIcon' as const },
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
  trustStripItems: ['Artist-made design', 'Licensed art', '14-day exchange — see policy', 'COD when shown at checkout'] as const,
  /** StoryBrand micro-plan strip */
  storyPlanSteps: ['Find your feeling', 'Pick your design', 'It arrives at your door'] as const,
  /** Gallery image indices (0-based) for the “See it styled” grid */
  wornByGalleryIndices: [1, 2, 0] as const,
  /** Same-day ship cutoff (local) + delivery windows for PDP copy (overridable via Medusa store metadata). */
  deliveryRules: PDP_DEFAULT_DELIVERY_RULES,

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
  trustStripItems: ['14-day exchange — see policy', 'Final payment methods confirmed at checkout', 'Artist-made design'] as const,

} as const;

export const MINI_CART_SCHEMA = {

  trustItems: ['14-day exchange — see policy', 'Final payment methods confirmed at checkout', 'Secure checkout'] as const,
  trustItemsAr: ['استبدال خلال ١٤ يوم — راجع السياسة', 'طرق الدفع النهائية بتتأكد في صفحة الدفع', 'دفع آمن'] as const,
} as const;

export const OCCASION_SCHEMA = {

} as const;

export const VIBES_SCHEMA = {

} as const;

export const ABOUT_SCHEMA = {

} as const;

export const QUICK_VIEW_SCHEMA = {

} as const;

export const SEARCH_SCHEMA = {

} as const;

/** Static checkout reassurance only — payment types are rendered from live Medusa `payment_providers`. */
export const CHECKOUT_SCHEMA = {
  trustStripItemsStatic: [
    'SSL-encrypted checkout',
    '14-day exchange',
    'Guest checkout',
  ] as const,
} as const;
