'use client';

import Link from 'next/link';

import { PageBreadcrumb } from '../components/PageBreadcrumb';
import { trackComparisonFaqView } from '../analytics/events';
import { useUiLocale } from '../i18n/ui-locale';
import { useEffect } from 'react';

type ComparisonRow = {
  id: string;
  buyer: string;
  horo: string;
  proof: string;
};

const COMPARISON_ROWS_EN: ComparisonRow[] = [
  {
    id: 'cheap',
    buyer: 'Cheap printed tee',
    horo: 'Artist-made, story-led, and more meaningful to wear or gift.',
    proof: 'Artist card, print close-up, story on PDP',
  },
  {
    id: 'custom',
    buyer: 'Custom print shop',
    horo: 'Curated art with a consistent HORO world — not upload-anything printing.',
    proof: 'Artist brief, licensed artwork, cohesive collections',
  },
  {
    id: 'fashion',
    buyer: 'Fashion / hype brand',
    horo: 'Less hype, more meaning — built for gifting and everyday wear.',
    proof: 'Gift route, size help, exchange policy, PDP proof ladder',
  },
  {
    id: 'gift',
    buyer: 'Generic gift shop',
    horo: 'Useful like clothing, personal like a message — they wear the feeling.',
    proof: 'Gifts hub, occasion tags, delivery clarity, payment options at checkout',
  },
  {
    id: 'marketplace',
    buyer: 'Marketplace seller',
    horo: 'Proof, service, and trust you can verify before you buy.',
    proof: 'UGC, WhatsApp help, payment options at checkout',
  },
];

const COMPARISON_ROWS_AR: ComparisonRow[] = [
  {
    id: 'cheap',
    buyer: 'تيشيرت مطبوع رخيص',
    horo: 'تصميم فنان حقيقي بقصة — أنسب للبس أو الهدية.',
    proof: 'بطاقة الفنان، تفاصيل الطباعة، القصة في صفحة المنتج',
  },
  {
    id: 'custom',
    buyer: 'مطبعة مخصصة',
    horo: 'فن منتقى بعالم HORO — مش طباعة أي صورة ترفعها.',
    proof: 'موجز الفنان، أعمال مرخّصة، مجموعات متماسكة',
  },
  {
    id: 'fashion',
    buyer: 'براند موضة / هايب',
    horo: 'معنى أكثر من لوجو — للهدية والبس اليومي.',
    proof: 'مسار الهدايا، مقاسات، سياسة الاستبدال',
  },
  {
    id: 'gift',
    buyer: 'محل هدايا عادي',
    horo: 'مفيد كملابس، شخصي كرسالة — يلبس الإحساس.',
    proof: 'صفحة الهدايا، مناسبات، توصيل وطرق الدفع في صفحة الدفع',
  },
  {
    id: 'marketplace',
    buyer: 'بائع ماركت بليس',
    horo: 'إثبات وخدمة تقدر تتأكد منها قبل الشراء.',
    proof: 'UGC، واتساب، دفع عند الاستلام',
  },
];

export function ComparisonFaqPage() {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const rows = isArabic ? COMPARISON_ROWS_AR : COMPARISON_ROWS_EN;

  useEffect(() => {
    trackComparisonFaqView();
  }, []);

  return (
    <main className="bg-papyrus px-4 pb-20 pt-10 md:px-8 md:pt-14">
      <div className="mx-auto max-w-4xl">
        <PageBreadcrumb
          className="mb-8"
          items={[
            { label: isArabic ? 'الرئيسية' : 'Home', to: '/' },
            { label: isArabic ? 'لماذا HORO؟' : 'Why HORO' },
          ]}
        />

        <h1 className="font-headline text-3xl font-semibold tracking-tight text-obsidian md:text-4xl">
          {isArabic ? 'لماذا HORO وليس تيشيرت مطبوع عادي؟' : 'Why HORO, not a normal printed T-shirt?'}
        </h1>
        <p className="mt-4 max-w-2xl font-body text-[15px] leading-relaxed text-warm-charcoal">
          {isArabic
            ? 'HORO فن قابل للبس — مش طباعة رخيصة، ولا مطبعة “ارفع صورتك”، ولا هدايا عامة من المحل.'
            : 'HORO is artist-made wearable art — not cheap print, not upload-anything custom, and not generic gift-shop merch.'}
        </p>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-stone/40 bg-white/80 shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone/30 bg-linen/60">
                <th scope="col" className="px-4 py-3 font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                  {isArabic ? 'قد يخطر ببالك' : 'You might think'}
                </th>
                <th scope="col" className="px-4 py-3 font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                  {isArabic ? 'لماذا HORO مختلف' : 'Why HORO is different'}
                </th>
                <th scope="col" className="px-4 py-3 font-label text-[10px] font-semibold uppercase tracking-[0.18em] text-label">
                  {isArabic ? 'الإثبات على الموقع' : 'Proof on site'}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-stone/20 last:border-0">
                  <th scope="row" className="px-4 py-4 align-top font-body text-sm font-medium text-obsidian">
                    {row.buyer}
                  </th>
                  <td className="px-4 py-4 align-top font-body text-sm leading-relaxed text-warm-charcoal">{row.horo}</td>
                  <td className="px-4 py-4 align-top font-body text-xs leading-relaxed text-clay">{row.proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/products" className="btn btn-primary min-h-12 px-6">
            {isArabic ? 'تسوق المجموعة' : 'Shop the collection'}
          </Link>
          <Link href="/gifts" className="btn btn-secondary min-h-12 px-6">
            {isArabic ? 'تسوق الهدايا' : 'Shop gifts'}
          </Link>
        </div>
      </div>
    </main>
  );
}
