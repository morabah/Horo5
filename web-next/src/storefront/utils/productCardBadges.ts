import type { Product } from '../data/catalog-types';
import { zodiacCardBadgeLabel } from '../lib/launch-taxonomy-display';
import { productMeaningLine } from './productMeaningLine';

export type ProductCardBadge = {
  key: string;
  label: string;
  tone?: 'default' | 'accent' | 'gift';
};

function truncateLabel(value: string, max = 42): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

/** Meaning, fit, and gift-ready badges for PLP cards (audit P3.3). */
export function getProductCardBadges(product: Product, locale: 'en' | 'ar'): ProductCardBadge[] {
  const badges: ProductCardBadge[] = [];

  const zodiac = zodiacCardBadgeLabel(product, locale);
  if (zodiac) {
    badges.push({ key: 'zodiac', label: zodiac, tone: 'accent' });
  }

  const meaning = productMeaningLine(product);
  if (meaning && !zodiac) {
    badges.push({ key: 'meaning', label: truncateLabel(meaning), tone: 'default' });
  }

  if (product.fitLabel?.trim()) {
    badges.push({ key: 'fit', label: product.fitLabel.trim(), tone: 'default' });
  }

  if (product.giftable) {
    badges.push({
      key: 'gift',
      label: locale === 'ar' ? 'جاهز للهدايا' : 'Gift-ready',
      tone: 'gift',
    });
  } else if (product.merchandisingBadge?.trim()) {
    badges.push({ key: 'merch', label: product.merchandisingBadge.trim(), tone: 'default' });
  }

  return badges.slice(0, 3);
}
