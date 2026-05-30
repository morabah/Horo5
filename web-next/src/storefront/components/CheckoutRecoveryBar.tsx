'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl } from '../data/domain-config';
import { ABANDON_EMAIL_CONSENT_LABEL, recoveryBodyCopy } from '../data/commerce-copy';
import { submitAbandonedCartLead } from '../lib/abandoned-cart-client';

type CheckoutRecoveryBarProps = {
  cartId?: string | null;
  cartValueEgp?: number;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Non-blocking checkout recovery — no exit-intent modal. */
export function CheckoutRecoveryBar({ cartId, cartValueEgp }: CheckoutRecoveryBarProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? HORO_SUPPORT_CHANNELS.whatsappSupportUrl
    : null;

  const handleSave = useCallback(async () => {
    if (!isValidEmail(email) || !consent) {
      setError(isArabic ? 'أدخل بريداً صالحاً ووافق على التذكير.' : 'Enter a valid email and agree to the reminder.');
      return;
    }
    setError(null);
    const ok = await submitAbandonedCartLead({
      email: email.trim(),
      cartId: cartId ?? null,
      surface: 'checkout',
      locale: isArabic ? 'ar' : 'en',
      cartValueEgp,
      marketingConsent: true,
    });
    if (ok) setSaved(true);
    else setError(isArabic ? 'تعذّر الحفظ. حاول مرة أخرى.' : 'Could not save. Try again.');
  }, [cartId, cartValueEgp, consent, email, isArabic]);

  return (
    <aside
      className="sticky bottom-0 z-30 border-t border-stone/40 bg-papyrus/95 px-4 py-3 backdrop-blur-md"
      role="region"
      aria-label={isArabic ? 'مساعدة إتمام الطلب' : 'Checkout help'}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-2">
        <p className="font-body text-xs text-warm-charcoal">{recoveryBodyCopy(isArabic)}</p>
        {saved ? (
          <p className="font-body text-sm font-medium text-deep-teal" role="status">
            {isArabic ? 'تم الحفظ — سنرسل تذكيراً واحداً إذا لم تكمل الطلب.' : 'Saved — we will send one reminder if you do not finish.'}
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isArabic ? 'بريدك' : 'Your email'}
                className="min-h-10 min-w-[12rem] flex-1 rounded-lg border border-stone bg-white px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!isValidEmail(email) || !consent}
                className="btn btn-secondary min-h-10 px-4 text-sm disabled:opacity-50"
              >
                {isArabic ? 'حفظ' : 'Save'}
              </button>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost min-h-10 px-4 text-sm"
                >
                  {isArabic ? 'واتساب' : 'WhatsApp'}
                </a>
              ) : null}
              <Link href="/cart" className="btn btn-ghost min-h-10 px-4 text-sm">
                {isArabic ? 'السلة' : 'Bag'}
              </Link>
            </div>
            <label className="flex items-start gap-2 font-body text-xs text-warm-charcoal">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              {isArabic ? ABANDON_EMAIL_CONSENT_LABEL.ar : ABANDON_EMAIL_CONSENT_LABEL.en}
            </label>
            {error ? (
              <p className="font-body text-xs text-ember" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
