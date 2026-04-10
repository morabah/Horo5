"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { trackEvent } from "@/lib/analytics/events";
import type { ShopifyCart } from "@/lib/shopify/types";

type CartContextValue = {
  cart: ShopifyCart | null;
  isLoading: boolean;
  addToCart: (merchandiseId: string, quantity?: number) => Promise<void>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  beginCheckout: () => void;
};

const CART_STORAGE_KEY = "horo_shopify_cart_id";

const CartContext = createContext<CartContextValue | null>(null);

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error("Cart request failed.");
  }
  return (await response.json()) as T;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cartId = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!cartId) {
      return;
    }

    fetch(`/api/cart?id=${encodeURIComponent(cartId)}`)
      .then((response) => parseJson<{ cart: ShopifyCart | null }>(response))
      .then((payload) => {
        setCart(payload.cart);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  async function addToCart(merchandiseId: string, quantity = 1) {
    setIsLoading(true);
    const payload = await parseJson<{ cart: ShopifyCart }>(
      await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: cart?.id,
          lines: [{ merchandiseId, quantity }],
        }),
      })
    );
    setCart(payload.cart);
    window.localStorage.setItem(CART_STORAGE_KEY, payload.cart.id);
    trackEvent({
      event: "add_to_cart",
      cart_id: payload.cart.id,
      quantity,
    });
    setIsLoading(false);
  }

  async function updateLine(lineId: string, quantity: number) {
    if (!cart?.id) {
      return;
    }

    setIsLoading(true);
    const payload = await parseJson<{ cart: ShopifyCart }>(
      await fetch("/api/cart/lines", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cartId: cart.id,
          lines: [{ id: lineId, quantity }],
        }),
      })
    );
    setCart(payload.cart);
    setIsLoading(false);
  }

  function beginCheckout() {
    if (!cart?.checkoutUrl) {
      return;
    }

    trackEvent({
      event: "begin_checkout",
      cart_id: cart.id,
      total_quantity: cart.totalQuantity,
      total_amount: cart.cost.totalAmount.amount,
      currency: cart.cost.totalAmount.currencyCode,
    });

    window.location.href = cart.checkoutUrl;
  }

  const value = {
    cart,
    isLoading,
    addToCart,
    updateLine,
    beginCheckout,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
