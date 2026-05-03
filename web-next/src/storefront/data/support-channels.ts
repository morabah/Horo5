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
