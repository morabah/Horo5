import type { ReactNode } from 'react';
import {
  pickLocalizedStorefrontText,
  type LocalizedStorefrontText,
  type StorefrontHomepageSection,
} from '../data/catalog-types';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { HOME_TRUST_BADGES } from '../data/homeContent';
import {  useUiLocale, useDictionary  } from '../i18n/ui-locale';

const TRUST_ICONS: Record<string, ReactNode> = {
  premiumCotton: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mr-1.5 inline-block opacity-55"><path d="M3 22V12a9 9 0 0 1 18 0v10" /><path d="M3 17h18" /></svg>
  ),
  printedEgypt: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mr-1.5 inline-block opacity-55"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  codExchange: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mr-1.5 inline-block opacity-55"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  artistSigned: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mr-1.5 inline-block opacity-55"><path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l5 5" /><path d="M9.5 14.5L16 8" /></svg>
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
  const items = section?.payload?.items;
  if (!Array.isArray(items)) return [];
  return items.filter((item): item is TrustRibbonItem => {
    return Boolean(item && typeof item === 'object' && typeof (item as { key?: unknown }).key === 'string');
  });
}

function canShowTrustItem(item: { key: string }): boolean {
  if (item.key !== 'whatsappSupport') return true;
  return isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl);
}

export function HomeTrustRibbon({ section }: { section?: StorefrontHomepageSection }) {
  const { locale } = useUiLocale();
  const copy = useDictionary();
  const isArabic = locale === 'ar';
  const sectionItems = trustItemsFromSection(section);
  const items =
    sectionItems.length > 0
      ? sectionItems.filter(canShowTrustItem).map((item) => {
          const localizedLabel =
            pickLocalizedStorefrontText(item.label, locale as 'en' | 'ar') ||
            pickLocalizedStorefrontText({ en: item.label_en, ar: item.label_ar }, locale as 'en' | 'ar');
          return {
            key: item.key,
            icon: item.icon || item.key,
            label: localizedLabel || copy.home.trustBadges[item.key as keyof typeof copy.home.trustBadges],
          };
        })
      : HOME_TRUST_BADGES.filter(canShowTrustItem).map((badge) => ({
          key: badge.key,
          icon: badge.key,
          label: copy.home.trustBadges[badge.key],
        }));

  if (items.length === 0) return null;

  return (
    <div
      role="list"
      aria-label={isArabic ? 'مزايا الخدمة' : 'Service promises'}
      className="border-y border-obsidian/10 bg-linen"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 py-3 sm:gap-x-8 sm:px-6 lg:px-8">
        {items.map((badge, i) => (
          <span
            key={badge.key}
            role="listitem"
            className="font-label inline-flex items-center text-[12px] font-semibold uppercase tracking-[0.12em] text-obsidian sm:text-[13px]"
          >
            <span
              aria-hidden
              className={`mr-3 inline-block h-1 w-1 rounded-full bg-obsidian/40 ${i === 0 ? 'hidden' : ''}`}
            />
            {TRUST_ICONS[badge.icon ?? badge.key] ?? null}
            {badge.label}
          </span>
        ))}
      </div>
    </div>
  );
}
