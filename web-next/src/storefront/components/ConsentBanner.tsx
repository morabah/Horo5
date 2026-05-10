'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUiLocale } from '../i18n/ui-locale';

const CONSENT_KEY = 'horo_analytics_consent';

type ConsentState = 'undecided' | 'granted' | 'denied';

function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'undecided';
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw === 'granted' || raw === 'denied') return raw;
  } catch {}
  return 'undecided';
}

function setConsent(value: ConsentState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

export function useAnalyticsConsent(): { consent: ConsentState; grant: () => void; deny: () => void } {
  const [consent, setLocal] = useState<ConsentState>('undecided');

  useEffect(() => {
    setLocal(getConsent());
  }, []);

  const grant = () => {
    setConsent('granted');
    setLocal('granted');
  };
  const deny = () => {
    setConsent('denied');
    setLocal('denied');
  };

  return { consent, grant, deny };
}

export function ConsentBanner() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const { consent, grant, deny } = useAnalyticsConsent();
  const pathname = usePathname() ?? '/';

  // Brain & Code §13: No distractions during checkout
  if (consent !== 'undecided' || pathname.startsWith('/checkout')) return null;

  return (
    <div
      role="dialog"
      aria-label={isArabic ? 'موافقة ملفات تعريف الارتباط' : 'Cookie consent'}
      className="fixed bottom-4 left-4 right-4 z-[500] mx-auto max-w-xl rounded-xl border border-stone/30 bg-white/95 p-4 shadow-lg backdrop-blur-sm md:bottom-6 md:left-6 md:right-auto md:p-5"
    >
      <p className="font-body text-sm leading-relaxed text-obsidian">
        {isArabic
          ? 'نستخدم أدوات تحليلية لتحسين تجربتك. هل توافق على جمع البيانات المجهولة؟'
          : 'We use analytics to improve your experience. Do you agree to anonymous data collection?'}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={grant}
          className="font-label inline-flex min-h-10 items-center rounded-full bg-obsidian px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-deep-teal"
        >
          {isArabic ? 'موافق' : 'Agree'}
        </button>
        <button
          type="button"
          onClick={deny}
          className="font-label inline-flex min-h-10 items-center rounded-full border border-stone/50 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
        >
          {isArabic ? 'رفض' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
