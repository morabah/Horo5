'use client';

import { useCallback, useState, type ReactElement, cloneElement, isValidElement } from 'react';

import {
  trackCheckoutBlockedMissingGovernorate,
  trackCheckoutStartedWithShippingEstimate,
} from '../../analytics/events';
import { useDeliveryGovernorate } from '../../lib/delivery/useDeliveryGovernorate';
import type { GovernorateCode } from '../../lib/delivery/governorates';
import { GovernorateModal } from './GovernorateModal';

type CheckoutGateProps = {
  subtotalEgp: number;
  onProceed: () => void;
  children: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
};

export function CheckoutGate({ subtotalEgp, onProceed, children }: CheckoutGateProps) {
  const { selectedCode, setGovernorate } = useDeliveryGovernorate();
  const [modalOpen, setModalOpen] = useState(false);

  const proceedWithCode = useCallback(
    (code: GovernorateCode) => {
      trackCheckoutStartedWithShippingEstimate(code);
      onProceed();
    },
    [onProceed],
  );

  const handleCheckoutClick = useCallback(
    (event: React.MouseEvent) => {
      if (!selectedCode) {
        event.preventDefault();
        trackCheckoutBlockedMissingGovernorate();
        setModalOpen(true);
        return;
      }
      proceedWithCode(selectedCode);
    },
    [proceedWithCode, selectedCode],
  );

  const handleSelect = useCallback(
    (code: GovernorateCode) => {
      setGovernorate(code, { surface: 'checkout_gate' });
      setModalOpen(false);
      queueMicrotask(() => proceedWithCode(code));
    },
    [proceedWithCode, setGovernorate],
  );

  const handleContinueFromModal = useCallback(() => {
    if (!selectedCode) return;
    setModalOpen(false);
    proceedWithCode(selectedCode);
  }, [proceedWithCode, selectedCode]);

  const child = isValidElement(children)
    ? cloneElement(children, {
        onClick: (event: React.MouseEvent) => {
          children.props.onClick?.(event);
          if (!event.defaultPrevented) {
            handleCheckoutClick(event);
          }
        },
      })
    : children;

  return (
    <>
      {child}
      <GovernorateModal
        open={modalOpen}
        subtotalEgp={subtotalEgp}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelect}
        onContinueToCheckout={handleContinueFromModal}
      />
    </>
  );
}
