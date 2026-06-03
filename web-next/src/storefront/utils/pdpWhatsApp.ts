import { isConfiguredExternalUrl, withSupportMessage } from '../data/support-channels';

export type PdpWhatsAppContext = {
  productName: string;
  size?: string | null;
  locale?: 'en' | 'ar';
};

export function buildPdpWhatsAppSupportMessage({
  productName,
  size,
  locale = 'en',
}: PdpWhatsAppContext): string {
  const name = productName.trim() || 'this tee';
  const sizePart = size?.trim() ? (locale === 'ar' ? ` (مقاس ${size.trim()})` : ` (size ${size.trim()})`) : '';

  if (locale === 'ar') {
    return `مرحباً HORO — محتاج مساعدة في المقاس لـ "${name}"${sizePart}. ممكن تأكدوا المقاس قبل الطلب؟`;
  }

  return `Hi HORO — I need size help for "${name}"${sizePart}. Can you confirm fit before I order?`;
}

export function buildPdpWhatsAppSupportUrl(
  baseUrl: string | null | undefined,
  context: PdpWhatsAppContext,
): string | null {
  if (!isConfiguredExternalUrl(baseUrl)) return null;
  return withSupportMessage(baseUrl, buildPdpWhatsAppSupportMessage(context));
}
