'use client';

import { useState, useCallback } from 'react';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, withSupportMessage } from '../data/domain-config';
import { capturePostHogEvent } from '@/lib/posthog-client';
import { HYPOTHESIS_PRIMARY_SEGMENT } from '../analytics/hypothesisContext';

const SHARE_YOUR_FIT_KEY = 'horo-share-fit-cta-seen';

function hasSeenShareCTA(): boolean {
  try {
    return sessionStorage.getItem(SHARE_YOUR_FIT_KEY) === '1';
  } catch {
    return false;
  }
}

function markShareCTASeen() {
  try {
    sessionStorage.setItem(SHARE_YOUR_FIT_KEY, '1');
  } catch {
    // ignore
  }
}

export function ShareYourFit() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [dismissed, setDismissed] = useState(hasSeenShareCTA());
  const [copied, setCopied] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    markShareCTASeen();
    capturePostHogEvent('share_your_fit_dismissed', {
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
    });
  }, []);

  const handleCopyShareText = useCallback(() => {
    const text = isArabic
      ? 'اشتريت من HORO — تصاميم فنية مصرية ملهمة. شوفوا القطع من هنا: https://horo.eg'
      : 'Just got my HORO piece — art-driven Egyptian fashion that actually means something. Check them out: https://horo.eg';

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        capturePostHogEvent('share_your_fit_copied', {
          hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
        });
        window.setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        /* ignore */
      });
    }
  }, [isArabic]);

  const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? withSupportMessage(
        HORO_SUPPORT_CHANNELS.whatsappSupportUrl,
        isArabic ? 'أنا حابب أشارك لبسي من HORO!' : "I'd love to share my HORO look!"
      )
    : null;

  const instagramUrl = 'https://instagram.com/horo.eg';

  if (dismissed) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-dusk-violet/20 bg-gradient-to-br from-dusk-violet/5 to-papyrus px-5 py-6 md:px-7 md:py-7">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-dusk-violet">
            {isArabic ? 'شارك لبسك' : 'Share your look'}
          </p>
          <h2 className="font-headline mt-2 text-[1.35rem] font-semibold leading-tight text-obsidian">
            {isArabic
              ? 'البسي HORO وانتي واثقة — شاركيها معانا'
              : 'Wear it with confidence — share it with us'}
          </h2>
          <p className="mt-2 max-w-md font-body text-sm text-warm-charcoal">
            {isArabic
              ? 'صوري القطعة لما توصلك وشاركيها على إنستجرام مع #HOROmylook. كل شهر بنختار أفضل صورة ونبعتلك هدية.'
              : 'Snap a photo when it arrives and share on Instagram with #HOROmylook. Each month we pick the best shot and send a gift.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-warm-charcoal transition-colors hover:bg-stone/10"
          aria-label={isArabic ? 'إغلاق' : 'Dismiss'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone/60 bg-white px-5 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
          {isArabic ? 'تابع @horo.eg' : 'Follow @horo.eg'}
        </a>
        <button
          type="button"
          onClick={handleCopyShareText}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone/60 bg-white px-5 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          {copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'انسخ النص' : 'Copy share text')}
        </button>
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone/60 bg-white px-5 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {isArabic ? 'شارك عبر واتساب' : 'Share via WhatsApp'}
          </a>
        ) : null}
      </div>
    </section>
  );
}
