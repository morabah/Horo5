'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { capturePostHogEvent } from '@/lib/posthog-client';
import { HYPOTHESIS_PRIMARY_SEGMENT } from '../analytics/hypothesisContext';
import { EXIT_INTENT_FLAG, isEnabled } from '../utils/featureFlags';

const EXIT_INTENT_KEY = 'horo_exit_intent_shown';
const ABANDON_EMAIL_KEY = 'horo_abandon_email_saved';

function hasShownExitIntent(): boolean {
  try {
    return sessionStorage.getItem(EXIT_INTENT_KEY) === '1';
  } catch {
    return false;
  }
}

function markExitIntentShown() {
  try {
    sessionStorage.setItem(EXIT_INTENT_KEY, '1');
  } catch {
    // ignore
  }
}

function saveAbandonEmail(email: string) {
  try {
    localStorage.setItem(ABANDON_EMAIL_KEY, email);
  } catch {
    // ignore
  }
}

function getSavedAbandonEmail(): string | null {
  try {
    return localStorage.getItem(ABANDON_EMAIL_KEY);
  } catch {
    return null;
  }
}

type ExitIntentModalProps = {
  cartValueEgp?: number;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ExitIntentModal({ cartValueEgp }: ExitIntentModalProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const flagEnabled = isEnabled(EXIT_INTENT_FLAG);

  const handleDismiss = useCallback(() => {
    setOpen(false);
    setDismissed(true);
    markExitIntentShown();
  }, []);

  const handleEmailSubmit = useCallback(() => {
    if (isValidEmail(email)) {
      saveAbandonEmail(email.trim());
      setEmailSaved(true);
      capturePostHogEvent('cart_abandon_email_saved', {
        hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
        cart_value_egp: cartValueEgp ?? 0,
      });
    }
  }, [email, cartValueEgp]);

  useEffect(() => {
    if (!flagEnabled || hasShownExitIntent() || dismissed) return;

    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !hasShownExitIntent()) {
        setOpen(true);
        markExitIntentShown();
        capturePostHogEvent('exit_intent_shown', {
          hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
          cart_value_egp: cartValueEgp ?? 0,
        });
      }
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [flagEnabled, dismissed, cartValueEgp]);

  useEffect(() => {
    const saved = getSavedAbandonEmail();
    if (saved) setEmail(saved);
  }, []);

  if (!flagEnabled || !open) return null;

  const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isArabic ? 'لا تغادر بعد!' : 'Wait — don\'t go yet!'}
      onClick={handleDismiss}
    >
      <div
        className="relative w-full max-w-md rounded-[20px] border border-stone/30 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-warm-charcoal transition-colors hover:bg-stone/10"
          aria-label={isArabic ? 'إغلاق' : 'Close'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-deep-teal">
          {isArabic ? 'لا تغادر بعد!' : "Wait — don't go yet!"}
        </p>
        <h2 className="font-headline mt-2 text-[1.5rem] font-semibold leading-tight tracking-tight text-obsidian">
          {isArabic ? 'عندك حاجة في السلة' : 'You have something in your bag'}
        </h2>
        <p className="font-body mt-3 text-[15px] leading-relaxed text-warm-charcoal">
          {isArabic
            ? 'اكمل طلبك الآن — الشحن سريع والاستبدال مجاني لمدة 14 يوم.'
            : 'Complete your order now — fast delivery and free 14-day exchange.'}
        </p>

        {cartValueEgp && cartValueEgp > 0 ? (
          <p className="font-headline mt-4 text-[1.25rem] font-semibold text-obsidian">
            {isArabic
              ? `قيمة السلة: ${cartValueEgp} ج.م`
              : `Cart value: EGP ${cartValueEgp}`}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/checkout"
            className="font-body inline-flex min-h-12 items-center justify-center rounded-md bg-obsidian px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-deep-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
          >
            {isArabic ? 'اكمل الطلب →' : 'Complete checkout →'}
          </Link>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="font-body inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-stone/60 bg-white px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:border-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {isArabic ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
            </a>
          ) : null}

          {/* Email capture for cart abandonment */}
          <div className="rounded-xl border border-stone/30 bg-papyrus/60 p-4">
            <p className="font-body text-sm text-warm-charcoal">
              {isArabic
                ? 'سيب بريدك ونرسللك تفاصيل السلة.'
                : 'Leave your email and we\'ll send your cart details.'}
            </p>
            {emailSaved ? (
              <p className="mt-2 text-sm font-medium text-deep-teal">
                {isArabic ? 'تم الحفظ! نشوفك قريب.' : 'Saved! See you soon.'}
              </p>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isArabic ? 'بريدك الإلكتروني' : 'Your email'}
                  className="min-h-10 flex-1 rounded-lg border border-stone bg-white px-3 text-sm text-obsidian placeholder:text-clay focus-visible:border-deep-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-deep-teal/25"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEmailSubmit();
                  }}
                />
                <button
                  type="button"
                  onClick={handleEmailSubmit}
                  disabled={!isValidEmail(email)}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-deep-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-deep-teal/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isArabic ? 'حفظ' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="font-body text-sm text-clay underline-offset-4 transition-colors hover:text-obsidian hover:underline"
          >
            {isArabic ? 'لا شكراً، أنا بشوف بس' : "No thanks, I'm just browsing"}
          </button>
        </div>
      </div>
    </div>
  );
}
