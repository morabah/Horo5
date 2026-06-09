'use client';

import { useState } from 'react';

import { capturePostHogEvent } from '@/lib/posthog-client';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';

export function HomeFooterNewsletter() {
  const copy = useDictionary();
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [referralCode, setReferralCode] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed, locale, source: 'footer_newsletter' }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        duplicate?: boolean;
        referral_code?: string;
      };
      if (res.ok && data.ok) {
        setStatus('done');
        if (data.referral_code) setReferralCode(data.referral_code);
        capturePostHogEvent('waitlist_signed_up', {
          source: 'footer_newsletter',
          duplicate: data.duplicate === true,
        });
        return;
      }
      setStatus('error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="footer-newsletter">
      <h4 className="font-label mb-3 text-[0.9rem] font-semibold tracking-[0.08em] text-horo-breath">
        {copy.home.footerNewsletterTitle}
      </h4>
      <p className="mb-3 font-body text-sm leading-relaxed text-horo-breath/88">{copy.home.footerNewsletterBody}</p>
      <form className="footer-newsletter__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="footer-newsletter-email">
          {isArabic ? 'البريد الإلكتروني' : 'Email'}
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isArabic ? 'بريدك الإلكتروني' : 'Enter your email'}
          disabled={status === 'submitting' || status === 'done'}
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 font-body text-sm text-horo-root outline-none placeholder:text-horo-pulse/60"
        />
        <button
          type="submit"
          disabled={status === 'submitting' || status === 'done'}
          className="px-4 font-body text-lg text-horo-pulse transition-colors hover:bg-horo-breath/45 disabled:opacity-60"
          aria-label={isArabic ? 'اشترك' : 'Subscribe'}
        >
          →
        </button>
      </form>
      {status === 'done' ? (
        <div className="mt-2" role="status">
          <p className="font-body text-xs text-horo-breath/90">
            {isArabic
              ? 'تم — أول ما ينزل إصدار جديد هنبعتلك.'
              : "You're in — we'll email you before the next drop."}
          </p>
          {referralCode ? (
            <p className="mt-2 font-body text-xs text-horo-breath/80">
              {isArabic ? 'شارك رابطك:' : 'Share your link:'}{' '}
              <span className="break-all">{referralCode}</span>
            </p>
          ) : null}
        </div>
      ) : null}
      {status === 'error' ? (
        <p className="mt-2 font-body text-xs text-horo-breath" role="alert">
          {isArabic ? 'حاول مرة أخرى.' : 'Please try again.'}
        </p>
      ) : null}
    </div>
  );
}
