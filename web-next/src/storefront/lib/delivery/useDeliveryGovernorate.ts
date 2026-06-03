'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useCart } from '../../cart/CartContext';
import { trackShippingGovernorateSelected } from '../../analytics/events';
import { updateCart } from '../medusa/client';
import {
  DELIVERY_GOVERNORATE_STORAGE_KEY,
  getGovernorateRate,
  isGovernorateCode,
  type GovernorateCode,
  type GovernorateRate,
} from './governorates';

/** Cairo estimate for first cart visit before the shopper picks a governorate. */
export const DEFAULT_SHIPPING_ESTIMATE_GOVERNORATE: GovernorateCode = 'cairo';

function readStoredGovernorate(): GovernorateCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DELIVERY_GOVERNORATE_STORAGE_KEY)?.trim().toLowerCase();
    if (!raw || !isGovernorateCode(raw)) return null;
    return raw;
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
      setSelectedCode(DEFAULT_SHIPPING_ESTIMATE_GOVERNORATE);
      setHasStoredGovernorate(false);
    }
    setHydrated(true);
  }, []);

  const selectedRate: GovernorateRate | null = useMemo(
    () => (selectedCode ? getGovernorateRate(selectedCode) : null),
    [selectedCode],
  );

  const isDefaultEstimate = hydrated && !hasStoredGovernorate;

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
    setSelectedCode(DEFAULT_SHIPPING_ESTIMATE_GOVERNORATE);
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
    isDefaultEstimate,
    setGovernorate,
    clearGovernorate,
  };
}
