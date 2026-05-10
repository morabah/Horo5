'use client';

import { useState, useCallback } from 'react';
import { useUiLocale } from '../i18n/ui-locale';
import { HORO_SUPPORT_CHANNELS, isConfiguredExternalUrl, withSupportMessage } from '../data/domain-config';
import { capturePostHogEvent } from '@/lib/posthog-client';
import { HYPOTHESIS_PRIMARY_SEGMENT } from '../analytics/hypothesisContext';
import { REFERRAL_PROGRAM_FLAG, isEnabled } from '../utils/featureFlags';

const REFERRAL_KEY = 'horo-referral-code-v1';
const REFERRAL_PREFIX = 'HORO';

function generateReferralCode(): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${REFERRAL_PREFIX}-${random}`;
}

function getOrCreateReferralCode(): string {
  try {
    const stored = localStorage.getItem(REFERRAL_KEY);
    if (stored) return stored;
    const code = generateReferralCode();
    localStorage.setItem(REFERRAL_KEY, code);
    return code;
  } catch {
    return generateReferralCode();
  }
}

export function ReferralCard() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [referralCode] = useState(getOrCreateReferralCode);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(referralCode).then(() => {
        setCopied(true);
        capturePostHogEvent('referral_code_copied', {
          hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
          referral_code: referralCode,
        });
        window.setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        /* ignore */
      });
    }
  }, [referralCode]);

  const shareText = isArabic
    ? `استخدم كود ${referralCode} وخد ١٠٪ خصم على أول طلب من HORO — تصاميم فنية مصرية أصلية.`
    : `Use code ${referralCode} for 10% off your first HORO order — artist-driven Egyptian fashion.`;

  const whatsappUrl = isConfiguredExternalUrl(HORO_SUPPORT_CHANNELS.whatsappSupportUrl)
    ? withSupportMessage(HORO_SUPPORT_CHANNELS.whatsappSupportUrl, shareText)
    : null;

  if (!isEnabled(REFERRAL_PROGRAM_FLAG)) return null;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-deep-teal/20 bg-gradient-to-br from-deep-teal/5 to-papyrus px-5 py-6 md:px-7 md:py-7">
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-deep-teal">
        {isArabic ? 'برنامج الإحالة' : 'Referral program'}
      </p>
      <h2 className="font-headline mt-2 text-[1.35rem] font-semibold leading-tight text-obsidian">
        {isArabic ? 'أعطي ١٠٪ — وخد ١٠٪' : 'Give 10% off, get 10% off'}
      </h2>
      <p className="mt-2 max-w-md font-body text-sm text-warm-charcoal">
        {isArabic
          ? 'شاركي كودك مع صحابك. لما يطلبوا لأول مرة، هما ياخدو ١٠٪ خصم وإنتي تاخدي ١٠٪ رصيد في حسابك.'
          : 'Share your code with friends. When they place their first order, they get 10% off and you get 10% credit in your account.'}
      </p>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <code className="rounded-xl border border-stone/40 bg-white px-5 py-3 font-mono text-base font-semibold tracking-wider text-obsidian">
            {referralCode}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone/60 bg-white px-4 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            {copied ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'انسخ الكود' : 'Copy code')}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                capturePostHogEvent('referral_shared_whatsapp', {
                  hypothesis_segment: HYPOTHESIS_PRIMARY_SEGMENT,
                  referral_code: referralCode,
                });
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone/60 bg-white px-5 py-2.5 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian transition-colors hover:border-obsidian"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {isArabic ? 'شارك عبر واتساب' : 'Share via WhatsApp'}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
