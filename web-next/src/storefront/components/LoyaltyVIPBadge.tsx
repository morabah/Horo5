'use client';

import { useMemo } from 'react';
import { useUiLocale } from '../i18n/ui-locale';

function getMemberSince(): string | null {
  try {
    const raw = localStorage.getItem('horo-member-since');
    if (raw) return raw;
    const now = new Date().toISOString().split('T')[0];
    localStorage.setItem('horo-member-since', now);
    return now;
  } catch {
    return null;
  }
}

function formatMemberSince(iso: string, isArabic: boolean): string {
  const date = new Date(iso);
  if (isArabic) {
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long' });
}

function daysUntilBirthday(): number | null {
  try {
    const raw = localStorage.getItem('horo-birthday');
    if (!raw) return null;
    const [month, day] = raw.split('-').map(Number);
    if (!month || !day) return null;
    const today = new Date();
    const currentYear = today.getFullYear();
    let next = new Date(currentYear, month - 1, day);
    if (next < today) {
      next = new Date(currentYear + 1, month - 1, day);
    }
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  } catch {
    return null;
  }
}

export function LoyaltyVIPBadge() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  const memberSince = useMemo(() => getMemberSince(), []);
  const birthdayDays = useMemo(() => daysUntilBirthday(), []);

  const showBirthday = birthdayDays !== null && birthdayDays <= 30;

  if (!memberSince) return null;

  return (
    <section className="mb-8 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-papyrus px-5 py-6 md:px-7 md:py-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            {isArabic ? 'عضو HORO' : 'HORO member'}
          </p>
          <h2 className="font-headline mt-2 text-[1.25rem] font-semibold leading-tight text-obsidian">
            {isArabic ? 'أهلاً بيك في العيلة' : 'Welcome to the family'}
          </h2>
          <p className="mt-2 font-body text-sm text-warm-charcoal">
            {isArabic
              ? `عضو منذ ${formatMemberSince(memberSince, true)}. بتتمتع بوصول مبكر لكل إصدار جديد.`
              : `Member since ${formatMemberSince(memberSince, false)}. You get early access to every new drop.`}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-3 py-1.5 font-label text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          {isArabic ? 'VIP' : 'VIP'}
        </span>
      </div>

      {showBirthday ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-white/70 px-4 py-3">
          <p className="font-label text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">
            {isArabic ? 'عيد ميلاد قرب!' : 'Birthday coming up!'}
          </p>
          <p className="mt-1 font-body text-sm text-obsidian">
            {isArabic
              ? `باقي ${birthdayDays} يوم — وهنبعتلك كود خصم خاص بعيد الميلاد.`
              : `${birthdayDays} days away — a special birthday discount is on its way.`}
          </p>
        </div>
      ) : null}
    </section>
  );
}
