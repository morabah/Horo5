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
      role="region"
      aria-label={isArabic ? 'موافقة ملفات تعريف الارتباط' : 'Cookie consent'}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-[80] mx-auto max-w-md rounded-[10px] border border-stone/30 bg-white/95 p-3 shadow-[0_12px_34px_rgba(79,17,31,0.16)] backdrop-blur-sm md:bottom-6 md:left-6 md:right-auto md:mx-0 md:p-4"
    >
      <p className="font-body text-[12px] leading-snug text-obsidian md:text-sm md:leading-relaxed">
        {isArabic
          ? 'نستخدم أدوات تحليلية لتحسين تجربتك. هل توافق على جمع البيانات المجهولة؟'
          : 'We use analytics to improve your experience. Do you agree to anonymous data collection?'}
      </p>
      <div className="mt-3 flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={grant}
          className="font-label inline-flex min-h-9 items-center rounded-[7px] bg-obsidian px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-deep-teal md:min-h-10 md:px-5 md:text-[11px]"
        >
          {isArabic ? 'موافق' : 'Agree'}
        </button>
        <button
          type="button"
          onClick={deny}
          className="font-label inline-flex min-h-9 items-center rounded-[7px] border border-stone/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-obsidian transition-colors hover:border-obsidian md:min-h-10 md:px-5 md:text-[11px]"
        >
          {isArabic ? 'رفض' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
