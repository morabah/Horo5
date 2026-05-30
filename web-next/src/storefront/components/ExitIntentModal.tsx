'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { capturePostHogEvent } from '@/lib/posthog-client';
import { HYPOTHESIS_PRIMARY_SEGMENT } from '../analytics/hypothesisContext';
import { trackExitIntentShown } from '../analytics/events';
import { submitAbandonedCartLead } from '../lib/abandoned-cart-client';
import { EXIT_INTENT_FLAG, isEnabled } from '../utils/featureFlags';

const ABANDON_EMAIL_KEY = 'horo_abandon_email_saved';

export type ExitIntentSurface = 'cart' | 'checkout' | 'plp';

function sessionKeyForSurface(surface: ExitIntentSurface): string {
  return `horo_exit_intent_shown_${surface}`;
}

function hasShownExitIntent(surface: ExitIntentSurface): boolean {
  try {
    return sessionStorage.getItem(sessionKeyForSurface(surface)) === '1';
  } catch {
    return false;
  }
}

function markExitIntentShown(surface: ExitIntentSurface) {
  try {
    sessionStorage.setItem(sessionKeyForSurface(surface), '1');
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
  surface?: ExitIntentSurface;
  cartValueEgp?: number;
  cartId?: string | null;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function ExitIntentModal({ surface = 'cart', cartValueEgp, cartId }: ExitIntentModalProps) {
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
    markExitIntentShown(surface);
  }, [surface]);

  const handleEmailSubmit = useCallback(() => {
    if (!isValidEmail(email)) return;
    const trimmed = email.trim();
    saveAbandonEmail(trimmed);
    setEmailSaved(true);
    capturePostHogEvent('cart_abandon_email_saved', {
      hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
      cart_value_egp: cartValueEgp ?? 0,
      surface,
    });
    void submitAbandonedCartLead({
      email: trimmed,
      cartId: cartId ?? null,
      surface,
      locale: isArabic ? 'ar' : 'en',
      cartValueEgp: cartValueEgp,
    });
  }, [cartId, cartValueEgp, email, isArabic, surface]);

  useEffect(() => {
    if (!flagEnabled || hasShownExitIntent(surface) || dismissed) return;

    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0 && !hasShownExitIntent(surface)) {
        setOpen(true);
        markExitIntentShown(surface);
        trackExitIntentShown(surface, cartValueEgp ?? 0);
      }
    };

    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [flagEnabled, dismissed, cartValueEgp, surface]);

  useEffect(() => {
    const saved = getSavedAbandonEmail();
    if (saved) setEmail(saved);
  }, []);

  if (!flagEnabled || !open) return null;

  const title =
    surface === 'checkout'
      ? isArabic
        ? 'لا تترك الطلب الآن'
        : "Don't leave checkout yet"
      : surface === 'plp'
        ? isArabic
          ? 'قبل ما تمشي'
          : 'Before you go'
        : isArabic
          ? 'لا تغادر بعد!'
          : "Wait — don't go yet!";

  const body =
    surface === 'checkout'
      ? isArabic
        ? 'أكمل الدفع — الدفع عند الاستلام متاح والاستبدال خلال 14 يوماً.'
        : 'Finish checkout — COD is available and 14-day exchange applies.'
      : surface === 'plp'
        ? isArabic
          ? 'احفظ بريدك ونرسللك القطع اللي شوفتها.'
          : "Save your email and we'll send the pieces you browsed."
        : isArabic
          ? 'اكمل طلبك الآن — الشحن سريع والاستبدال مجاني لمدة 14 يوم.'
          : 'Complete your order now — fast delivery and free 14-day exchange.';

  const primaryHref = surface === 'checkout' ? '/checkout' : surface === 'plp' ? '/cart' : '/checkout';
  const primaryLabel =
    surface === 'checkout'
      ? isArabic
        ? 'اكمل الدفع →'
        : 'Complete checkout →'
      : surface === 'plp'
        ? isArabic
          ? 'افتح السلة →'
          : 'View your bag →'
        : isArabic
          ? 'اكمل الطلب →'
          : 'Complete checkout →';

  const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
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

        <p className="font-label text-[12px] font-semibold uppercase tracking-[0.2em] text-deep-teal">{title}</p>
        <h2 className="font-headline mt-2 text-[1.5rem] font-semibold leading-tight tracking-tight text-obsidian">
          {surface === 'cart' && cartValueEgp && cartValueEgp > 0
            ? isArabic
              ? 'عندك حاجة في السلة'
              : 'You have something in your bag'
            : isArabic
              ? 'HORO ينتظرك'
              : 'HORO is still here'}
        </h2>
        <p className="font-body mt-3 text-[15px] leading-relaxed text-warm-charcoal">{body}</p>

        {cartValueEgp && cartValueEgp > 0 ? (
          <p className="font-headline mt-4 text-[1.25rem] font-semibold text-obsidian">
            {isArabic ? `قيمة السلة: ${cartValueEgp} ج.م` : `Cart value: EGP ${cartValueEgp}`}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href={primaryHref}
            className="btn btn-primary font-body inline-flex min-h-12 items-center justify-center px-6 py-3 text-sm font-semibold"
          >
            {primaryLabel}
          </Link>

          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="font-body inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-stone/60 bg-white px-6 py-3 text-sm font-semibold text-obsidian transition-colors hover:border-obsidian focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-teal"
            >
              {isArabic ? 'اطلب عبر واتساب' : 'Order on WhatsApp'}
            </a>
          ) : null}

          <div className="rounded-xl border border-stone/30 bg-papyrus/60 p-4">
            <p className="font-body text-sm text-warm-charcoal">
              {isArabic ? 'سيب بريدك ونرسللك تفاصيل السلة.' : "Leave your email and we'll send your cart details."}
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
