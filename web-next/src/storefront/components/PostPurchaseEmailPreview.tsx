'use client';

import { useUiLocale } from '../i18n/ui-locale';

type EmailStep = {
  key: string;
  titleEn: string;
  titleAr: string;
  bodyEn: string;
  bodyAr: string;
  timingEn: string;
  timingAr: string;
};

const EMAIL_SEQUENCE: EmailStep[] = [
  {
    key: 'confirm',
    titleEn: 'Order confirmation',
    titleAr: 'تأكيد الطلب',
    bodyEn: 'Your order is received and being prepared.',
    bodyAr: 'تم استلام طلبك وهو قيد التجهيز.',
    timingEn: 'Now',
    timingAr: 'الآن',
  },
  {
    key: 'shipping',
    titleEn: 'Shipping notification',
    titleAr: 'إشعار الشحن',
    bodyEn: 'Your package is on the way with a tracking link.',
    bodyAr: 'طردك في الطريق مع رابط التتبع.',
    timingEn: 'In 1–2 days',
    timingAr: 'خلال ١–٢ يوم',
  },
  {
    key: 'delivery',
    titleEn: 'Out for delivery',
    titleAr: 'جاري التوصيل',
    bodyEn: 'Your HORO piece is arriving today.',
    bodyAr: 'قطعة HORO وصلت النهاردة.',
    timingEn: 'On delivery day',
    timingAr: 'يوم التوصيل',
  },
  {
    key: 'review',
    titleEn: 'How did it fit?',
    titleAr: 'إيه رأيك في المقاس؟',
    bodyEn: 'Share a review and get early access to the next drop.',
    bodyAr: 'سيبي رأيك وخدي وصول مبكر للإصدار الجاي.',
    timingEn: '3 days after delivery',
    timingAr: '٣ أيام بعد التوصيل',
  },
];

export function PostPurchaseEmailPreview() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';

  return (
    <section className="mb-8 rounded-2xl border border-stone/30 bg-white/75 px-5 py-6 md:px-7 md:py-7">
      <p className="font-label text-[10px] font-semibold uppercase tracking-[0.2em] text-clay">
        {isArabic ? 'متابعة طلبك' : 'What happens next'}
      </p>
      <h2 className="font-headline mt-2 text-[1.25rem] font-semibold leading-tight text-obsidian">
        {isArabic ? 'تحديثات البريد الإلكتروني' : 'Email updates'}
      </h2>
      <p className="mt-2 font-body text-sm text-warm-charcoal">
        {isArabic
          ? 'هنبعتلك 4 إيميلات طول رحلة طلبك — كل حاجة تحتاج تعرفيها.'
          : 'We\'ll send you 4 emails throughout your order journey — everything you need to know.'}
      </p>

      <ol className="mt-5 space-y-3">
        {EMAIL_SEQUENCE.map((step, i) => (
          <li
            key={step.key}
            className="flex gap-3 rounded-xl border border-stone/25 bg-papyrus px-4 py-3"
          >
            <span
              className="font-label mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-obsidian text-[11px] font-semibold text-obsidian"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-obsidian">
                  {isArabic ? step.titleAr : step.titleEn}
                </p>
                <span className="font-label text-[10px] font-medium text-clay">
                  {isArabic ? step.timingAr : step.timingEn}
                </span>
              </div>
              <p className="mt-1 font-body text-sm text-warm-charcoal">
                {isArabic ? step.bodyAr : step.bodyEn}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
