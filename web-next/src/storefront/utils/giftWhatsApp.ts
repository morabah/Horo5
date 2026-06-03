import { isConfiguredExternalUrl, withSupportMessage } from '../data/support-channels';

export function buildGiftHubWhatsAppMessage(locale: 'en' | 'ar', occasionHint?: string): string {
  const occasion = occasionHint?.trim();
  if (locale === 'ar') {
    return occasion
      ? `مرحباً HORO — عايز أشتري هدية لمناسبة "${occasion}". ممكن تساعدوني في المقاس والتصميم؟`
      : 'مرحباً HORO — عايز أشتري هدية. ممكن تساعدوني في المقاس والتصميم المناسب؟';
  }
  return occasion
    ? `Hi HORO — I'm buying a gift for "${occasion}". Can you help with size and which design fits?`
    : `Hi HORO — I'm buying a gift. Can you help with size and which design fits best?`;
}

export function buildGiftHubWhatsAppUrl(
  baseUrl: string | null | undefined,
  locale: 'en' | 'ar',
  occasionHint?: string,
): string | null {
  if (!isConfiguredExternalUrl(baseUrl)) return null;
  return withSupportMessage(baseUrl, buildGiftHubWhatsAppMessage(locale, occasionHint));
}
