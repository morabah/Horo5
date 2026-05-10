'use client';

import type { StockStatusKey } from '../data/catalog-types';
import { useUiLocale } from '../i18n/ui-locale';

const STOCK_STATUS_META: Record<
  StockStatusKey,
  { labelEn: string; labelAr: string; dot: string; text: string }
> = {
  in_stock: {
    labelEn: 'In stock',
    labelAr: 'متوفر',
    dot: 'bg-deep-teal',
    text: 'text-deep-teal',
  },
  low_stock: {
    labelEn: 'Low stock',
    labelAr: 'كمية محدودة',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
  },
  sold_out: {
    labelEn: 'Sold out',
    labelAr: 'نفذت الكمية',
    dot: 'bg-stone',
    text: 'text-stone',
  },
  preorder: {
    labelEn: 'Pre-order',
    labelAr: 'طلب مسبق',
    dot: 'bg-dusk-violet',
    text: 'text-dusk-violet',
  },
};

type StockStatusChipProps = {
  status?: StockStatusKey | null;
  className?: string;
};

export function StockStatusChip({ status, className }: StockStatusChipProps) {
  const { locale } = useUiLocale();
  if (!status) return null;

  const meta = STOCK_STATUS_META[status];
  const label = locale === 'ar' ? meta.labelAr : meta.labelEn;

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label text-[10px] font-semibold uppercase tracking-[0.14em]',
        meta.text,
        className,
      ].filter(Boolean).join(' ')}
      style={{ borderColor: 'color-mix(in srgb, currentColor 25%, transparent)' }}
    >
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
