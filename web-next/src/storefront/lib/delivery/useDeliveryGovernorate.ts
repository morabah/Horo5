'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCart } from '../../cart/CartContext';
import { trackShippingGovernorateSelected } from '../../analytics/events';
import { updateCart } from '../medusa/client';
import {
  DELIVERY_GOVERNORATE_STORAGE_KEY,
  getGovernorateRate,
  normalizeGovernorateCode,
  type GovernorateCode,
  type GovernorateRate,
} from './governorates';

function readStoredGovernorate(): GovernorateCode | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeGovernorateCode(localStorage.getItem(DELIVERY_GOVERNORATE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function writeStoredGovernorate(code: GovernorateCode | null) {
  if (typeof window === 'undefined') return;
  try {
    if (!code) {
      localStorage.removeItem(DELIVERY_GOVERNORATE_STORAGE_KEY);
      return;
    }
    localStorage.setItem(DELIVERY_GOVERNORATE_STORAGE_KEY, code);
  } catch {
    /* quota / private mode */
  }
}

async function syncGovernorateToMedusaCart(
  cartId: string,
  code: GovernorateCode,
  shippingEgp: number,
): Promise<void> {
  await updateCart(cartId, {
    metadata: {
      deliveryGovernorate: code,
      estimatedShippingEgp: shippingEgp,
    },
  });
}

export function useDeliveryGovernorate() {
  const { medusaCartId } = useCart();
  const [selectedCode, setSelectedCode] = useState<GovernorateCode | null>(null);
  const [hasStoredGovernorate, setHasStoredGovernorate] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredGovernorate();
    if (stored) {
      setSelectedCode(stored);
      setHasStoredGovernorate(true);
    } else {
      setSelectedCode(null);
      setHasStoredGovernorate(false);
    }
    setHydrated(true);
  }, []);

  const selectedRate: GovernorateRate | null = useMemo(
    () => (selectedCode ? getGovernorateRate(selectedCode) : null),
    [selectedCode],
  );

  const setGovernorate = useCallback(
    (code: GovernorateCode, options: { remember?: boolean; surface?: string } = {}) => {
      const rate = getGovernorateRate(code);
      if (!rate) return;
      const remember = options.remember !== false;
      if (remember) {
        writeStoredGovernorate(code);
        setHasStoredGovernorate(true);
      }
      setSelectedCode(code);
      trackShippingGovernorateSelected(code, options.surface ?? 'cart');
      if (medusaCartId) {
        void syncGovernorateToMedusaCart(medusaCartId, code, rate.shippingEgp).catch(() => {
          /* CartContext will reconcile on next sync */
        });
      }
    },
    [medusaCartId],
  );

  const clearGovernorate = useCallback(() => {
    writeStoredGovernorate(null);
    setHasStoredGovernorate(false);
    setSelectedCode(null);
    if (medusaCartId) {
      void updateCart(medusaCartId, {
        metadata: {
          deliveryGovernorate: null,
          estimatedShippingEgp: null,
        },
      }).catch(() => {
        /* ignore */
      });
    }
  }, [medusaCartId]);

  return {
    hydrated,
    selectedCode,
    selectedRate,
    hasStoredGovernorate,
    setGovernorate,
    clearGovernorate,
  };
}
