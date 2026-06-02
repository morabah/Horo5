'use client';

import { useEffect, useRef } from 'react';

import type { GovernorateCode, GovernorateRate } from '../../lib/delivery/governorates';
import { GOVERNORATE_RATES, governorateLabel } from '../../lib/delivery/governorates';
import { useDictionary, useUiLocale } from '../../i18n/ui-locale';
import { formatEgp } from '../../utils/formatPrice';
import { AppIcon } from '../AppIcon';

type GovernorateModalProps = {
  open: boolean;
  subtotalEgp: number;
  rates?: GovernorateRate[];
  /** When false, hides Proceed until user picks a governorate (cart page modal). */
  showContinueButton?: boolean;
  onClose: () => void;
  onSelect: (code: GovernorateCode) => void;
  onContinueToCheckout: () => void;
};

export function GovernorateModal({
  open,
  subtotalEgp,
  rates = GOVERNORATE_RATES,
  showContinueButton = true,
  onClose,
  onSelect,
  onContinueToCheckout,
}: GovernorateModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { locale } = useUiLocale();
  const isArabic = locale === 'ar';
  const copy = useDictionary().cart;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="governorate-modal"
      dir={isArabic ? 'rtl' : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="governorate-modal__panel" role="document">
        <header className="governorate-modal__header">
          <h2 className="governorate-modal__title">{copy.cartCheckoutNeedsGovernorate}</h2>
          <button type="button" className="governorate-modal__close" aria-label={copy.cartChangeGovernorate} onClick={onClose}>
            <AppIcon name="close" className="h-5 w-5" />
          </button>
        </header>
        <p className="governorate-modal__lead">{copy.cartNoCheckoutSurprise}</p>
        <ul className="governorate-modal__list">
          {rates.map((rate) => (
            <li key={rate.code}>
              <button
                type="button"
                className="governorate-modal__option"
                onClick={() => onSelect(rate.code)}
              >
                <span className="governorate-modal__option-label">{governorateLabel(rate, isArabic)}</span>
                <span className="governorate-modal__option-meta">
                  {copy.cartShippingEstimate}: {formatEgp(rate.shippingEgp)} · {copy.cartEstimatedTotal}:{' '}
                  {formatEgp(subtotalEgp + rate.shippingEgp)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {showContinueButton ? (
          <button type="button" className="btn btn-primary governorate-modal__continue" onClick={onContinueToCheckout}>
            {copy.primaryCta}
          </button>
        ) : (
          <p className="governorate-modal__hint font-body text-sm text-clay">{copy.cartChooseGovernorate}</p>
        )}
      </div>
    </dialog>
  );
}
