# HORO Dynamic Bundle Progress Setup Guide

## Overview

The `cart-bundle-nudge.liquid` section has been upgraded from a static message to a dynamic bundle progress display. It counts eligible cart items and shows how many more are needed to reach a bundle offer.

**Important:** The theme only displays progress. The real discount must be configured in Shopify Admin.

---

## Theme behavior

1. The theme counts eligible cart items:
   - If an **eligible collection** is selected, only items from that collection count.
   - If no collection is selected, all non-gift-wrap items count.
2. `remaining_items = required_quantity - eligible_quantity`
3. If `remaining_items > 0`:
   - Shows: "Add X more to unlock the bundle offer"
4. If `remaining_items <= 0`:
   - Shows: "Your cart may qualify for the bundle offer. Final discount is confirmed at checkout."
5. If a discount code is configured, it is displayed.

---

## How to create a matching Shopify discount

### Option A: Automatic discount (recommended)

1. **Shopify Admin → Discounts → Create discount → Automatic discount**
2. Title: `Buy 3 save 100 EGP`
3. Discount type: **Amount off order**
4. Value: `100` EGP
5. Minimum requirements: **Minimum quantity of items** — `3`
6. Combinations: **Do not allow** (unless you intend otherwise)
7. Save and test

### Option B: Discount code

1. **Shopify Admin → Discounts → Create discount → Discount code**
2. Code: `HORO100` (or your preferred code)
3. Same settings as Option A
4. Save and test

---

## Theme settings to match

1. Open **Theme Editor → Cart page**
2. Find **Cart bundle nudge**
3. Set **Enable bundle message** to true
4. Set **Required quantity** to match the discount minimum (e.g., `3`)
5. Set **Discount amount (EGP)** to match for reference (display only)
6. Fill **Heading before threshold** with remaining-item placeholder (e.g., `Add {{ count }} more to unlock the bundle offer`)
7. Fill **Heading at/after threshold** (e.g., `Your cart may qualify for the bundle offer`)
8. Fill **Discount code text** if using a code (leave blank for automatic discounts)
9. Optionally select an **Eligible collection**

---

## Why theme progress does not apply the discount

- The theme runs in the customer's browser. It has no access to Shopify's discount engine.
- Only Shopify checkout can evaluate discount rules, exclusions, and combinations.
- The theme progress is an **estimate** based on cart contents.

---

## How to test checkout consistency

1. Add eligible items to the cart until the theme shows the threshold reached.
2. Proceed to checkout.
3. Verify that the discount appears in the checkout summary.
4. If it does not appear, check:
   - Is the discount active and not expired?
   - Do the cart items meet all discount conditions (collections, customer eligibility)?
   - Is the discount set to automatic or does the customer need to enter a code?

---

## API sync (optional)

If you build a public app proxy at `/apps/horo-incentives`, enable **Use incentives API** in the section settings. The theme will fetch `bundle.requiredQuantity`, `bundle.discountCode`, and labels from the API and enhance the display dynamically. If the API fails, it falls back to the manual settings.
