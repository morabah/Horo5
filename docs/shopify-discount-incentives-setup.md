# HORO Shopify Discount Incentives Setup Guide

## Principle

Never show a discount promise in the theme unless the discount is actually configured in Shopify Admin and will be applied at checkout.

## How to create real discounts in Shopify Admin

### 1. Automatic discount (recommended for bundles)

Path: **Shopify Admin → Discounts → Create discount → Automatic discount**

Use case: "Buy 3 items by different artists, save 100 EGP"

Settings:
- **Title:** Add 3rd save 100 EGP
- **Discount type:** Amount off order
- **Value:** 100 EGP
- **Applies to:** Entire order
- **Minimum requirements:** Minimum quantity of items — 3
- **Customer eligibility:** All customers
- **Combinations:** Do not allow combinations (to prevent stacking issues)

Limitations:
- Shopify automatic discounts cannot filter by "different artists" in the condition.
- If the exact "different artists" rule is required, use a **discount code** instead and communicate the terms clearly.

### 2. Discount code (recommended for targeted campaigns)

Path: **Shopify Admin → Discounts → Create discount → Discount code**

Use case: "Use code BUNDLE100 for 100 EGP off orders of 3+ items"

Settings:
- **Code:** BUNDLE100
- **Discount type:** Amount off order
- **Value:** 100 EGP
- **Minimum requirements:** Minimum quantity of items — 3
- **Usage limits:** Optional — limit to one use per customer, or set a total usage limit.

### 3. Buy X get Y

Path: **Shopify Admin → Discounts → Create discount → Buy X get Y**

Use case: "Buy 2 get 1 free" or "Buy 2 get 50% off a 3rd item"

Settings:
- **Customer buys:** Minimum quantity of items — 2
- **Customer gets:** Specific collections or products
- **Discount type:** Percentage or Free

## Theme display strategy

### Cart bundle nudge (`cart-bundle-nudge.liquid`)

This section is **informational only**. It does not calculate discounts.

When to enable:
1. Create the discount in Shopify Admin first.
2. Test it on a draft order to confirm it applies correctly.
3. Only then enable the `enable_bundle_message` setting in the theme customizer.

What to display:
- **Without a discount code:** Show generic encouragement text: "You can add another piece before checkout. Bundle offers may be announced separately."
- **With a discount code:** Fill the `discount_code_text` field (e.g., `BUNDLE100`). The theme renders: "Use code: BUNDLE100"

What never to display:
- Exact savings amount (e.g., "Save 100 EGP") unless the discount is automatic and guaranteed.
- "Add 1 more to unlock" — the theme cannot count cart items safely without JS.
- Fake urgency (e.g., "Only 2 left at this price").

### PDP discount mention

If a discount should be mentioned on the product page:
- Add it as a single text block in `product-purchase-context.liquid` using the `custom.promo_text` metafield.
- Keep it generic: "Bundle offers may be available at checkout."
- Or specific if the discount is automatic: "Automatic discount applied at checkout for 3+ items."

## Warning

If a customer sees a discount promise in the theme but the checkout does not apply it, this is a conversion-killing bug and a trust breach.

**Always create the discount in Admin before referencing it in the theme.**

## Quick checklist before launching a discount

- [ ] Discount created and saved in Shopify Admin
- [ ] Discount tested on a draft order
- [ ] Discount applies correctly at checkout
- [ ] Theme text updated to reference the discount (if desired)
- [ ] Discount code text field populated in `cart-bundle-nudge` settings (if using a code)
- [ ] `enable_bundle_message` set to true in theme customizer
- [ ] Expiry date set on the discount (recommended)
- [ ] Combinations reviewed to prevent unwanted stacking
