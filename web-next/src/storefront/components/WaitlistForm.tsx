'use client';

import { useState, useEffect } from 'react';
import { capturePostHogEvent } from '@/lib/posthog-client';
import { useUiLocale } from '../i18n/ui-locale';

export function WaitlistForm({ source }: { source: string }) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [urlRef, setUrlRef] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setUrlRef(ref);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('submitting');
    setErrorMessage(null);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          locale,
          source,
          ...(urlRef ? { referralCode: urlRef } : {}),
        }),
      });

      const data = (await res.json()) as { ok?: boolean; duplicate?: boolean; referral_code?: string; error?: string };

      if (res.ok && data.ok) {
        setStatus('success');
        if (data.referral_code) setReferralCode(data.referral_code);
        capturePostHogEvent('waitlist_signed_up', {
          source,
          locale,
          duplicate: data.duplicate === true,
        });
      } else {
        setStatus('error');
        setErrorMessage(data.error || (isArabic ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.'));
      }
    } catch {
      setStatus('error');
      setErrorMessage(isArabic ? 'حدث خطأ. حاول مرة أخرى.' : 'Something went wrong. Please try again.');
    }
  };

  const baseShareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const shareUrl = referralCode ? `${baseShareUrl}?ref=${referralCode}` : baseShareUrl;
  const shareText = isArabic
    ? 'سجّلت في قائمة الانتظار لـ HORO — فن مصري ترتديه.'
    : "I'm on the HORO waitlist — Egyptian art you can wear.";

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
  const xShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;

  if (status === 'success') {
    return (
      <div className="w-full max-w-md">
        <p className="font-body text-[1.05rem] leading-relaxed text-[#f5f0e6] drop-shadow-[0_4px_18px_rgba(0,0,0,0.4)]">
          {isArabic
            ? 'تم التسجيل — ستصلك التفاصيل عند الإطلاق.'
            : "You're on the list — we'll reach out at launch."}
        </p>
        {referralCode ? (
          <div className="mt-4 rounded-md bg-[#f5f0e6]/10 p-3 ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm">
            <p className="font-label text-[11px] font-medium uppercase tracking-[0.2em] text-[#f5f0e6]/80">
              {isArabic ? 'رابط الإحالة الخاص بك' : 'Your referral link'}
            </p>
            <p className="font-body mt-1 break-all text-sm text-[#f5f0e6]/90">{shareUrl}</p>
          </div>
        ) : null}
        <p className="font-label mt-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#f5f0e6]/80">
          {isArabic ? 'شارك مع صديق' : 'Share with a friend'}
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href={whatsappShare}
            target="_blank"
            rel="noreferrer"
            className="font-body inline-flex min-h-11 items-center rounded-md bg-[#f5f0e6]/10 px-4 text-sm font-medium text-[#f5f0e6] ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm transition-colors hover:bg-[#f5f0e6]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
          >
            WhatsApp
          </a>
          <a
            href={xShare}
            target="_blank"
            rel="noreferrer"
            className="font-body inline-flex min-h-11 items-center rounded-md bg-[#f5f0e6]/10 px-4 text-sm font-medium text-[#f5f0e6] ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm transition-colors hover:bg-[#f5f0e6]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
          >
            X
          </a>
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                void navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="font-body inline-flex min-h-11 items-center rounded-md bg-[#f5f0e6]/10 px-4 text-sm font-medium text-[#f5f0e6] ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm transition-colors hover:bg-[#f5f0e6]/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
          >
            {isArabic ? 'نسخ الرابط' : 'Copy link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isArabic ? 'بريدك الإلكتروني' : 'Your email'}
          required
          disabled={status === 'submitting'}
          className="font-body min-h-12 flex-1 rounded-md bg-[#f5f0e6]/10 px-4 text-base text-[#f5f0e6] placeholder:text-[#f5f0e6]/50 ring-1 ring-inset ring-[#f5f0e6]/20 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6]"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="font-body inline-flex min-h-12 items-center justify-center rounded-md bg-[#f5f0e6] px-6 text-sm font-semibold text-[#2a2d26] transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f0e6] disabled:opacity-60"
        >
          {status === 'submitting'
            ? isArabic
              ? 'جارٍ...'
              : 'Joining...'
            : isArabic
              ? 'انضم إلى القائمة'
              : 'Join the list'}
        </button>
      </div>
      {status === 'error' && errorMessage ? (
        <p className="mt-2 font-body text-sm text-ember">{errorMessage}</p>
      ) : null}
    </form>
  );
}
