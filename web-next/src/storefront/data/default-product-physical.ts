import type { ProductPhysicalAttributes } from './catalog-types';

/** Interim PDP fabric/print proof copy until Medusa variant dimensions are populated. */
export const HORO_DEFAULT_PHYSICAL_ATTRIBUTES: ProductPhysicalAttributes = {
  material: 'Premium cotton jersey (~220 GSM)',
  originCountry: 'Egypt',
  weight: '~220 GSM',
};

export const HORO_DEFAULT_CARE_INSTRUCTIONS =
  'Machine wash cold, inside out. Do not iron directly on the print. Hang dry when possible.';
