"use client";

import Image from "next/image";

import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/format";

export function CartView() {
  const { cart, isLoading, updateLine, beginCheckout } = useCart();

  if (!cart || cart.lines.length === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-black/70">Add products from the shop page to continue.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Your Cart</h1>
      <div className="space-y-4">
        {cart.lines.map((line) => (
          <article key={line.id} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-black/5">
              {line.merchandise.product.featuredImage ? (
                <Image
                  src={line.merchandise.product.featuredImage.url}
                  alt={line.merchandise.product.featuredImage.altText ?? line.merchandise.product.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{line.merchandise.product.title}</p>
              <p className="text-sm text-black/60">{line.merchandise.title}</p>
              <p className="text-sm text-black/80">
                {formatMoney(line.cost.totalAmount.amount, line.cost.totalAmount.currencyCode)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-black/20"
                disabled={isLoading || line.quantity <= 1}
                onClick={() => updateLine(line.id, line.quantity - 1)}
              >
                -
              </button>
              <span className="w-8 text-center text-sm">{line.quantity}</span>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-black/20"
                disabled={isLoading}
                onClick={() => updateLine(line.id, line.quantity + 1)}
              >
                +
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm text-black/60">Subtotal</p>
        <p className="text-2xl font-bold">
          {formatMoney(cart.cost.subtotalAmount.amount, cart.cost.subtotalAmount.currencyCode)}
        </p>
        <button
          type="button"
          className="mt-4 w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
          onClick={beginCheckout}
        >
          Proceed to secure checkout
        </button>
      </div>
    </section>
  );
}
