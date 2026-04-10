"use client";

import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";

type AddToCartButtonProps = {
  merchandiseId: string;
};

export function AddToCartButton({ merchandiseId }: AddToCartButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToCart } = useCart();

  return (
    <button
      type="button"
      className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-60"
      onClick={async () => {
        setIsSubmitting(true);
        await addToCart(merchandiseId, 1);
        setIsSubmitting(false);
      }}
      disabled={isSubmitting}
    >
      {isSubmitting ? "Adding..." : "Add to cart"}
    </button>
  );
}
