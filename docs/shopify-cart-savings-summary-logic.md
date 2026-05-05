# HORO Cart Savings Summary Logic

## Overview

The `cart-savings-summary.liquid` section displays a safe, transparent summary of customer savings in the cart. It uses only real Shopify cart data and does not fabricate discounts.

---

## How compare-at savings are calculated

For each cart line item, the theme checks:

```liquid
if item.variant.compare_at_price > item.final_price
  savings = (compare_at_price - final_price) * quantity
```

- `compare_at_price` is the original price set in Shopify Admin.
- `final_price` is the current price (may already include a sale).
- The savings are summed across all items.

## How cart discounts are included

Shopify exposes `cart.total_discount`, which includes:
- Line-item discount allocations (`item.line_level_discount_allocations`)
- Cart-level discount applications (`cart.cart_level_discount_applications`)

The theme adds `cart.total_discount` to the compare-at savings to produce the total.

## Why the theme does not double-count

- Compare-at savings represent "sale price" reductions (visible on the product).
- `cart.total_discount` represents explicit Shopify discounts (codes, automatic discounts).
- These two sources are mutually exclusive per line item in Shopify's data model, but the theme sums them cautiously.

## Limitations

1. **Theme cannot see future checkout discounts.** If a discount applies only at checkout (e.g., free shipping), it is not included.
2. **Theme cannot verify bundle discount applicability.** A bundle discount may have exclusions the theme cannot check.
3. **Compare-at price must be set in Admin.** If you only change the regular price without setting compare-at, no compare-at savings will appear.

## Safe design principle

The theme never:
- Calculates percentage discounts by itself
- Claims savings that are not present in Shopify cart data
- Shows a savings summary when the total is zero

---

## Admin setup

To make savings appear:

1. **Sale prices:** Set `Compare-at price` higher than `Price` on product variants in Shopify Admin.
2. **Discounts:** Create automatic discounts or discount codes in **Shopify Admin → Discounts**.

The theme will automatically detect and display the total savings.

---

## Liquid logic summary

```liquid
assign compare_at_savings_cents = 0
for item in cart.items
  if item.variant.compare_at_price and item.variant.compare_at_price > item.final_price
    assign item_saving = item.variant.compare_at_price | minus: item.final_price
    assign item_saving_total = item_saving | times: item.quantity
    assign compare_at_savings_cents = compare_at_savings_cents | plus: item_saving_total
  endif
endfor

assign cart_discount_savings_cents = cart.total_discount
assign total_savings_cents = compare_at_savings_cents | plus: cart_discount_savings_cents
```

---

## Why the theme should not fake promo savings

- Faked savings are a **trust violation** and may be illegal under consumer protection law.
- Shopify's `cart.total_discount` and `compare_at_price` are authoritative.
- Any display-only calculation must be clearly labeled as "estimated" or tied to verified data.
