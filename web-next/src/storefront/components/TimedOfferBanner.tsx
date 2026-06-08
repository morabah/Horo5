'use client';

import Link from 'next/link';

import { useCountdown } from '../hooks/useCountdown';
import { pickLocalizedText, type StorefrontIncentivesClient } from '../lib/storefront/incentives-client';
import { useUiLocale } from '../i18n/ui-locale';

type TimedOffer = NonNullable<StorefrontIncentivesClient['timedOffer']>;

function formatCountdown(parts: NonNullable<ReturnType<typeof useCountdown>>) {
  const pad = (value: number) => String(value).padStart(2, '0');
  if (parts.days > 0) {
    return `${parts.days}d ${pad(parts.hours)}h ${pad(parts.minutes)}m`;
  }
  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}

export function TimedOfferBanner({
  offer,
  compact = false,
  href = '/products',
}: {
  offer: TimedOffer | null | undefined;
  compact?: boolean;
  href?: string;
}) {
  const { locale } = useUiLocale();
  const countdown = useCountdown(offer?.endsAt);

  if (!offer || !countdown || countdown.expired) return null;

  const isArabic = locale === 'ar';
  const label = pickLocalizedText(offer.label, isArabic ? 'ar' : 'en') ?? (isArabic ? 'عرض لفترة محدودة' : 'Limited-time offer');
  const savings =
    offer.savingsKind === 'percentage'
      ? `${offer.savingsValue}%`
      : isArabic
        ? `${offer.savingsValue} ج.م`
        : `${offer.savingsValue} EGP`;

  return (
    <div
      className={
        compact
          ? 'rounded-xl border border-horo-pulse/25 bg-horo-breath px-3 py-3'
          : 'relative z-[190] bg-horo-pulse text-white'
      }
      role="status"
      aria-live="polite"
    >
      <div
        className={
          compact
            ? 'flex flex-wrap items-center justify-between gap-2'
            : 'mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 text-center'
        }
      >
        <span className={compact ? 'font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-horo-pulse' : 'font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-white/85'}>
          {label}
        </span>
        <span className={compact ? 'font-body text-xs text-warm-charcoal' : 'font-body text-xs text-white/90'}>
          {isArabic ? `وفر ${savings}` : `Save ${savings}`}
        </span>
        <span className={compact ? 'font-headline text-sm font-semibold tabular-nums text-obsidian' : 'font-headline text-sm font-semibold tabular-nums text-white md:text-base'}>
          {formatCountdown(countdown)}
        </span>
        {!compact ? (
          <Link
            href={href}
            className="font-label inline-flex min-h-8 items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white underline decoration-white/40 underline-offset-4"
          >
            {isArabic ? 'تسوّق الآن' : 'Shop now'}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
