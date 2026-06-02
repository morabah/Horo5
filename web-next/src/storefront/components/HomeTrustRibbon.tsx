import { type CSSProperties, type ReactNode } from 'react';
import {
  pickLocalizedStorefrontText,
  type LocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { HOME_TRUST_BADGES } from '../data/homeContent';
import { useUiLocale, useDictionary } from '../i18n/ui-locale';

const TRUST_ICONS: Record<string, ReactNode> = {
  artistMade: (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.5 7.5c3.5 3.5 7.3 4.5 12 3.5-.5 5.3 1.6 8.8 6.2 11.4-4.6 2.2-6.3 5.6-5.3 10.6-5.2-.6-8.6 1.2-10.8 5.7-2.3-4.4-5.8-6.1-10.8-5.2.7-5-1-8.4-5.5-10.8 4.6-2.4 6.4-5.9 5.5-11 4.9.8 8.1-.7 8.7-4.2z" />
      <circle cx="19" cy="19" r="1.7" />
      <circle cx="29.5" cy="18" r="1.5" />
      <circle cx="25" cy="29" r="1.8" />
    </svg>
  ),
  printedEgypt: (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 39h36" />
      <path d="M10 38l10-28 10 28H10z" />
      <path d="M21 38l9-22 10 22H21z" />
      <path d="M20 10l8 28" />
      <path d="M30 16l10 22" />
      <path d="M15 24h10" />
      <path d="M28 29h8" />
    </svg>
  ),
  paymentAtCheckout: (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="8" y="14" width="32" height="22" rx="3" />
      <path d="M8 21h32" />
      <path d="M14 30h6" />
      <path d="M30 30h4" />
    </svg>
  ),
  exchange14d: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  clearFitDetails: (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 12l7-4 7 4 7 2-4 9-5-2v19H19V21l-5 2-4-9 7-2z" />
      <path d="M20 11c1 2.5 2.3 3.8 4 3.8s3-1.3 4-3.8" />
    </svg>
  ),
  whatsappSupport: (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M39 23.5a14.5 14.5 0 01-21 13L9 39l2.5-8.4A14.5 14.5 0 1139 23.5z" />
      <path d="M18.5 17.5c.7-1.1 1.4-1.1 2.2-.2l1.4 2.8c.3.6.2 1.1-.2 1.6l-.7.8c1 1.9 2.5 3.3 4.5 4.3l.8-.8c.5-.5 1-.6 1.6-.3l2.8 1.3c.8.4 1 .9.5 1.7-.7 1.2-1.8 1.8-3.1 1.8-2.2 0-5.2-1.5-7.5-3.8-2.4-2.4-3.9-5.2-3.9-7.4 0-.7.2-1.3.6-1.8z" />
    </svg>
  ),
  premiumCotton: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 22V12a9 9 0 0 1 18 0v10" />
      <path d="M3 17h18" />
    </svg>
  ),
};

type TrustRibbonItem = {
  key: string;
  icon?: string;
  label?: LocalizedStorefrontText;
  label_en?: string;
  label_ar?: string;
};

function trustItemsFromSection(section: StorefrontHomepageSection | undefined): TrustRibbonItem[] {
  const trustStripItems = section?.payload?.trustStripItems;
  const items = Array.isArray(trustStripItems) ? trustStripItems : section?.payload?.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is TrustRibbonItem => {
    return Boolean(item && typeof item === 'object' && typeof (item as { key?: unknown }).key === 'string');
  });
}

export function HomeTrustRibbon({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const sectionItems = trustItemsFromSection(section);
  const displaySectionItems = sectionItems.length > 0 ? sectionItems : [];

  const items =
    displaySectionItems.length > 0
      ? displaySectionItems.map((item) => {
          const localizedLabel =
            pickLocalizedStorefrontText(item.label, locale as 'en' | 'ar') ||
            pickLocalizedStorefrontText({ en: item.label_en, ar: item.label_ar }, locale as 'en' | 'ar');
          return {
            key: item.key,
            icon: item.icon || item.key,
            label: localizedLabel || copy.home.trustBadges[item.key as keyof typeof copy.home.trustBadges],
          };
        })
      : HOME_TRUST_BADGES.map((badge) => ({
          key: badge.key,
          icon: badge.key,
          label: copy.home.trustBadges[badge.key],
        }));

  if (items.length === 0) return null;

  return (
    <section className="home-trust-bar" aria-label={isArabic ? 'مزايا الخدمة' : 'Service promises'}>
      <div
        role="list"
        className="home-trust-bar__grid mx-auto max-w-6xl"
        style={{ '--home-trust-columns': items.length } as CSSProperties}
      >
        {items.map((badge) => (
          <div key={badge.key} role="listitem" className="home-trust-bar__cell">
            <div className="home-trust-bar__icon mx-auto">{TRUST_ICONS[badge.icon ?? badge.key] ?? TRUST_ICONS[badge.key] ?? null}</div>
            <p className="home-trust-bar__label">{badge.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
