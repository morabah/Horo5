export type GovernorateCode =
  | 'cairo'
  | 'giza'
  | 'alexandria'
  | 'delta'
  | 'upper_egypt'
  | 'other';

export type GovernorateRate = {
  code: GovernorateCode;
  labelEn: string;
  labelAr: string;
  shippingEgp: number;
  estimatedDays?: string;
};

/** Frontend fallback until Medusa `/storefront/shipping/governorates` is wired. */
export const GOVERNORATE_RATES: GovernorateRate[] = [
  { code: 'cairo', labelEn: 'Cairo', labelAr: 'القاهرة', shippingEgp: 70 },
  { code: 'giza', labelEn: 'Giza', labelAr: 'الجيزة', shippingEgp: 70 },
  { code: 'alexandria', labelEn: 'Alexandria', labelAr: 'الإسكندرية', shippingEgp: 90 },
  { code: 'other', labelEn: 'Other governorates', labelAr: 'محافظات أخرى', shippingEgp: 120 },
];

export const DELIVERY_GOVERNORATE_STORAGE_KEY = 'horo.delivery.governorate';

export function isGovernorateCode(value: string): value is GovernorateCode {
  return GOVERNORATE_RATES.some((row) => row.code === value);
}

export function getGovernorateRate(code: string | null | undefined): GovernorateRate | null {
  const normalized = code?.trim().toLowerCase();
  if (!normalized) return null;
  return GOVERNORATE_RATES.find((row) => row.code === normalized) ?? null;
}

export function governorateLabel(rate: GovernorateRate, isArabic: boolean): string {
  return isArabic ? rate.labelAr : rate.labelEn;
}

export function shippingEgpForGovernorateCode(code: string): number {
  return getGovernorateRate(code)?.shippingEgp ?? GOVERNORATE_RATES.find((row) => row.code === 'other')!.shippingEgp;
}

/** Maps cart governorate codes to checkout `EGYPT_CITY_OPTIONS` select values when possible. */
export function checkoutCityForGovernorateCode(code: string | null | undefined): string | null {
  const normalized = code?.trim().toLowerCase();
  if (!normalized || !isGovernorateCode(normalized)) return null;
  switch (normalized) {
    case 'cairo':
      return 'Cairo';
    case 'giza':
      return 'Giza';
    case 'alexandria':
      return 'Alexandria';
    case 'delta':
      return 'Sharqia';
    case 'upper_egypt':
      return 'Assiut';
    case 'other':
      return null;
    default:
      return null;
  }
}
