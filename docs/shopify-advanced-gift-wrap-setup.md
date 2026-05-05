# HORO Advanced Gift Wrap Setup Guide

## Overview

The gift wrap upsell has been enhanced with a visual preview, toggle UI, live price display, and safe cart removal. It remains a real Shopify product upsell — no fake pricing logic.

---

## Gift wrap product setup

1. **Shopify Admin → Products → Add product**
2. Name: `Gift Wrap` (or your preferred name)
3. Price: Set the actual price (e.g., `50` EGP)
4. Upload a **featured image** showing the wrapped item or gift box
5. Set inventory to match availability (or allow overselling if you always have it)
6. Save
7. **Optional:** Hide from normal collections by not adding it to any collection, or use a "hidden" collection

---

## Theme settings

1. Open **Theme Editor → Theme settings → HORO**
2. Select the **Gift wrap product**
3. Set the **Gift wrap label** (e.g., "Add gift wrap")
4. Set an optional **Price hint override** (leave blank to use the live product price)

---

## Product image requirement

- The gift wrap product should have a `featured_image` for the preview to appear.
- If no image is uploaded, an icon fallback is shown automatically.
- Preview display can be disabled per section via the **Show gift wrap preview image** checkbox.

---

## Price source

- **Primary:** Live variant price from the selected gift wrap product (`gift_wrap_variant.price | money`)
- **Override:** Manual price hint in theme settings (only if you want to show text like "+ EGP 50" instead of the formatted price)

---

## Cart remove behavior

On the **cart page**:
- If gift wrap is in the cart, a checked checkbox is shown.
- Unchecking the box triggers a safe removal:
  1. JS fetches current `/cart.js`
  2. Finds the gift wrap line item by `variant_id`
  3. POSTs to `/cart/change.js` with `quantity: 0`
  4. Page reloads on success

This preserves Dawn's native cart remove/quantity logic for all other items.

---

## Accessibility

- Checkbox input has a visible label
- `aria-live="polite"` announces status changes
- Focus remains visible on the toggle

---

## Future gift message option

A per-line-item gift message is **not implemented** in this phase. If needed later:

1. Add a line-item property field to the gift wrap add form
2. Capture the message via `properties` in the `/cart/add.js` payload
3. Display the message in cart and checkout

This is documented as a deferred enhancement.
