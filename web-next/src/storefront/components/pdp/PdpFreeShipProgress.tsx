'use client';

import { useEffect, useState } from 'react';

import { fetchStorefrontIncentivesClient, pickLocalizedText } from '../../lib/storefront/incentives-client';
import { useUiLocale } from '../../i18n/ui-locale';
import { formatEgp } from '../../utils/formatPrice';

type PdpFreeShipProgressProps = {
  subtotalEgp: number;
};

export function PdpFreeShipProgress({ subtotalEgp }: PdpFreeShipProgressProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const [threshold, setThreshold] = useState<number | null>(null);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    void fetchStorefrontIncentivesClient().then((data) => {
      const free = data?.freeShipping;
      if (!free || free.thresholdEgp <= 0) return;
      setThreshold(free.thresholdEgp);
      setLabel(pickLocalizedText(free.label, isArabic ? 'ar' : 'en') || null);
    });
  }, [isArabic]);

  if (!threshold || threshold <= 0) return null;

  const remaining = Math.max(0, threshold - subtotalEgp);
  const pct = Math.min(100, Math.max(0, Math.round((subtotalEgp / threshold) * 100)));
  const unlocked = subtotalEgp >= threshold;

  return (
    <div className="mini-cart-freeship mt-4" role="status" aria-live="polite">
      <p className="mini-cart-freeship-headline">
        {unlocked
          ? isArabic
            ? 'مبروك! الشحن المجاني مفعّل'
            : 'Free shipping unlocked'
          : isArabic
            ? `أضف ${formatEgp(remaining)} للشحن المجاني`
            : `Add ${formatEgp(remaining)} for free shipping`}
      </p>
      {label ? <p className="mt-1 font-body text-xs text-clay">{label}</p> : null}
      <div
        className="mini-cart-freeship-track mt-2"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="mini-cart-freeship-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
