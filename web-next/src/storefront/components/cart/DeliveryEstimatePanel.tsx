'use client';

import type { GovernorateRate } from '../../lib/delivery/governorates';
import { governorateLabel } from '../../lib/delivery/governorates';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { formatEgp } from '../../utils/formatPrice';

type DeliveryEstimatePanelProps = {
  subtotalEgp: number;
  shippingEgp: number | null;
  estimatedTotalEgp: number | null;
  selectedRate: GovernorateRate | null;
  onChooseGovernorate: () => void;
  onChangeGovernorate: () => void;
};

export function DeliveryEstimatePanel({
  subtotalEgp,
  shippingEgp,
  estimatedTotalEgp,
  selectedRate,
  onChooseGovernorate,
  onChangeGovernorate,
}: DeliveryEstimatePanelProps) {
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const copy = useDictionary().cart;

  return (
    <section className="delivery-estimate-panel" aria-labelledby="delivery-estimate-title">
      <h3 id="delivery-estimate-title" className="delivery-estimate-panel__title">
        {copy.cartGovernorateTitle}
      </h3>

      {!selectedRate ? (
        <>
          <p className="delivery-estimate-panel__empty">{copy.cartGovernorateEmpty}</p>
          <button type="button" className="btn btn-ghost delivery-estimate-panel__choose" onClick={onChooseGovernorate}>
            {copy.cartChooseGovernorate}
          </button>
        </>
      ) : (
        <>
          <p className="delivery-estimate-panel__selected" data-testid="cart-shipping-basis">
            {copy.cartGovernorateSelected.replace('{governorate}', governorateLabel(selectedRate, isArabic))}
          </p>
          <p className="delivery-estimate-panel__line">
            <span>{copy.cartShippingEstimate}</span>
            <span>{shippingEgp != null ? formatEgp(shippingEgp) : '—'}</span>
          </p>
          <p className="delivery-estimate-panel__line delivery-estimate-panel__line--total">
            <span>{copy.cartEstimatedTotal}</span>
            <span>{estimatedTotalEgp != null ? formatEgp(estimatedTotalEgp) : '—'}</span>
          </p>
          <button type="button" className="delivery-estimate-panel__change" onClick={onChangeGovernorate}>
            {copy.cartChangeGovernorate}
          </button>
        </>
      )}

      {subtotalEgp > 0 && !selectedRate ? (
        <p className="delivery-estimate-panel__subtotal-hint font-body text-xs text-clay">
          {isArabic ? `المجموع الفرعي: ${formatEgp(subtotalEgp)}` : `Subtotal: ${formatEgp(subtotalEgp)}`}
        </p>
      ) : null}
    </section>
  );
}
