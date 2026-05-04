# HORO Shopify Calculation Logic Setup Guide

## Overview

This guide explains how to configure Shopify Admin settings so that the display-only calculation sections in the HORO theme match real checkout behavior. The theme intentionally does **not** duplicate checkout math — it only displays information that must be configured in Shopify Admin first.

---

## 1. Free Shipping Threshold

### What the theme shows
- `cart-free-shipping-progress.liquid` displays a progress bar and message based on `cart.total_price` and a configurable threshold.
- **Disabled by default.** Only enable after configuring a matching free shipping rate.

### How to configure in Shopify Admin

1. **Settings → Shipping and delivery**
2. **Manage rates** next to your shipping profile
3. Add a **rate** with condition:
   - **Based on order price**
   - **Minimum price:** 1500.00 EGP (or your threshold)
   - **Shipping rate:** 0.00 EGP (Free)
4. If you want free shipping to apply automatically without a code, ensure this is a standard shipping rate, not a discount.

### Alternative: Automatic discount
If you prefer a discount-based approach:
1. **Discounts → Create discount → Automatic discount**
2. Discount type: **Free shipping**
3. Minimum purchase amount: 1500.00 EGP
4. Apply to: Entire order

### Theme settings to match
1. Open **Theme customizer → Cart page**
2. Find **Free shipping progress** section
3. Set **Threshold (EGP)** to match your Shopify Admin configuration (default: 1500)
4. Set **Enable free shipping progress** to true
5. Review the messages:
   - Before threshold: "Add {{ amount }} more to reach the free shipping threshold."
   - After threshold: "Your cart may qualify for free shipping if the shipping rate is configured in checkout."

### Important warning
- If the theme shows "Free shipping unlocked" but Shopify checkout still charges shipping, customers will lose trust.
- Always test a draft order after changing settings.
- Keep the threshold in the theme **exactly equal** to the threshold in Shopify Admin.

---

## 2. Delivery Estimate Display

### What the theme shows
- `horo-delivery-estimate.liquid` shows editable day ranges:
  - Standard delivery: 3–7 business days (default)
  - Express delivery: 2–4 business days where available (default)
- This is **informational only**. The theme does not calculate exact dates.

### How to configure
1. Open **Theme customizer → Product page**
2. Find **Delivery estimate** section
3. Adjust the day ranges to match your operational reality
4. Edit the cautionary text if needed

### What NOT to do
- Do not set exact delivery dates unless you have a real-time logistics API.
- Do not promise "Next day delivery" unless your carrier contract supports it.
- Do not show express delivery if it is not actually available in your checkout.

### Shopify Admin shipping rate naming
If you offer express shipping, name the rate clearly in Shopify Admin:
- "Standard (3–7 business days)"
- "Express (2–4 business days)"

This way the customer sees consistent messaging from PDP to checkout.

---

## 3. Bundle Discounts

### What the theme shows
- `cart-bundle-nudge.liquid` (from Phase 1.6f) is an **informational-only** message.
- It can optionally display a discount code text.
- It does **not** calculate cart quantities or apply discounts.

### How to configure a real bundle discount

**Option A: Automatic discount (recommended)**
1. **Discounts → Create discount → Automatic discount**
2. Title: "Buy 3 save 100 EGP"
3. Discount type: **Amount off order**
4. Value: 100 EGP
5. Minimum requirements: **Minimum quantity of items** — 3
6. Combinations: **Do not allow**

**Option B: Discount code**
1. **Discounts → Create discount → Discount code**
2. Code: `BUNDLE100`
3. Same settings as above

### Theme settings to match
1. Open **Theme customizer → Cart page**
2. Find **Cart bundle nudge** section
3. Set **Enable bundle message** to true
4. Fill **Discount code text** with the code (e.g., `BUNDLE100`) if using a code
5. Leave blank if using an automatic discount

### Important warning
- Never enable the bundle nudge before the discount is saved and tested in Shopify Admin.
- The theme cannot verify whether the discount actually applies at checkout.

---

## 4. Gift Wrap Price

### What the theme shows
- `gift-wrap-upsell.liquid` now auto-displays the live product variant price when no manual price hint is provided.
- The price comes directly from the **gift wrap product** in Shopify.

### How to keep it consistent
1. Go to **Products → Gift Wrap product**
2. Ensure the price is correct
3. Save
4. The theme will automatically reflect this price on both PDP and cart upsells

### What NOT to do
- Do not hardcode a gift wrap price in the theme — always use the live product price.
- If you change the price in Admin, the theme updates automatically.

---

## 5. Payment-Method Discount

### Why it is deferred
A payment-method discount (e.g., "Pay with Instapay / save 3%") requires one of:
- **Shopify Plus** + Checkout Functions (JavaScript at checkout)
- **Shopify Scripts** (deprecated, Plus only)
- A **third-party payment gateway** with built-in discount logic
- A **manual process** (refund after order confirmation)

### Safe alternative
If you want to offer a discount for bank transfer / Instapay:
1. Create a **discount code** (e.g., `BANK3`) for 3% off
2. Communicate it on your payment methods page or FAQ
3. The customer enters the code at checkout
4. No theme code required

---

## 6. Size Tables and Fit Models

### Current implementation
- `page.size-guide.json` uses static blocks for size rows and fit model descriptions.
- There is no dynamic per-product size table yet.

### How to update
1. Edit **page.size-guide.json** template in the theme code
2. Add/remove `size_row` blocks as needed
3. Update measurements and fit model text

### Future enhancement (not implemented)
Link a `custom.size_table_key` metafield to products to dynamically select a table.
This requires:
- Metafield definitions in Shopify Admin
- Liquid logic in the product size guide section
- A mapping between metafield values and table data

---

## 7. Inventory and Low-Stock Messages

### Current implementation
- Low-stock messages are driven by `custom.low_stock_message` product metafields.
- The theme does not count live inventory per variant.

### How to populate
1. In Shopify Admin, go to a product
2. **Metafields → Custom data**
3. Add or edit `custom.low_stock_message`
4. Example: "Only a few left — order soon"

### Future: Live stock count
To show "Only 3 left in size M," you would need:
- JavaScript fetching variant inventory via Shopify AJAX API
- This is deferred for Phase 1.7+ due to JS complexity

---

## 8. Restock Notifications

### Recommended approach
Do not build a custom restock system. Instead:
1. Install a Shopify app such as:
   - **Back in Stock** (by Appikon)
   - **Restocked** (by Elegantsy)
   - **Klaviyo** (for email flows)
2. Configure the app to watch out-of-stock variants
3. The app handles email capture and restock alerts

---

## 9. Checkout Totals and Shipping Rates

### Rule
The theme **never** calculates checkout totals, shipping costs, or taxes.
These are handled natively by Shopify checkout.

### What to verify before launch
- [ ] Shipping profiles cover all product weights / prices
- [ ] Free shipping threshold matches the theme setting
- [ ] COD shipping rate is configured (if applicable)
- [ ] Express shipping rate is configured (if applicable)
- [ ] Taxes are set up for Egypt (if applicable)
- [ ] Payment gateways are active (COD, Instapay, card)

---

## Quick pre-launch checklist

| Setting | Location | Verified |
|---------|----------|----------|
| Free shipping rate / threshold | Shopify Admin → Shipping | ☐ |
| Free shipping theme threshold | Theme customizer → Cart | ☐ |
| Bundle discount (if used) | Shopify Admin → Discounts | ☐ |
| Bundle nudge enabled | Theme customizer → Cart | ☐ |
| Gift wrap product price | Shopify Admin → Products | ☐ |
| Delivery day ranges | Theme customizer → Product | ☐ |
| Low-stock metafields | Shopify Admin → Products | ☐ |
| WhatsApp help URL metafields | Shopify Admin → Products | ☐ |
| Size guide content | Theme code → page.size-guide.json | ☐ |
| Shipping profiles | Shopify Admin → Shipping | ☐ |
