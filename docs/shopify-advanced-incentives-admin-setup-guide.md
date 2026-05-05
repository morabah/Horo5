# HORO Shopify Advanced Incentives — Admin Setup Guide

## Overview

This guide provides step-by-step instructions for configuring Shopify Admin so that the HORO theme's display-only incentive features match real checkout behavior.

---

## 1. Free shipping

### Create a free shipping rate

1. **Shopify Admin → Settings → Shipping and delivery**
2. Click **Manage** next to your shipping profile
3. Add a **rate**:
   - Name: `Free shipping`
   - Condition: **Based on order price**
   - Minimum price: `1500.00` EGP (or your chosen threshold)
   - Rate price: `0.00` EGP
4. Save

### Or create an automatic discount

1. **Shopify Admin → Discounts → Create discount → Automatic discount**
2. Discount type: **Free shipping**
3. Minimum purchase amount: `1500.00` EGP
4. Apply to: Entire order
5. Save

### Match theme settings

1. Open **Theme Editor → Cart page**
2. Find **Free shipping progress**
3. Set **Threshold (EGP)** to match your Admin setting (default: `1500`)
4. Enable **Free shipping progress**
5. Optional: Enable **Use incentives API** if you have a public app proxy

---

## 2. Bundle offer

### Create the discount

1. **Shopify Admin → Discounts → Create discount**
2. Choose either:
   - **Automatic discount** (recommended)
   - **Discount code**
3. Settings:
   - Title/Code: `Buy 3 save 100 EGP` / `HORO100`
   - Discount type: **Amount off order**
   - Value: `100` EGP
   - Minimum requirements: **Minimum quantity of items** — `3`
4. Save and test in checkout

### Match theme settings

1. Open **Theme Editor → Cart page**
2. Find **Cart bundle nudge**
3. Enable **Bundle message**
4. Set **Required quantity** to `3`
5. Set **Discount amount (EGP)** to `100` (display only)
6. Fill **Heading before threshold** and **Heading at/after threshold**
7. Fill **Discount code text** if using a code

---

## 3. Product promo countdown

### Create product metafields

1. **Shopify Admin → Settings → Custom data → Products**
2. Add:
   - `custom.promo_active` (Boolean)
   - `custom.promo_ends_at` (Date and time)
   - `custom.promo_label` (Single-line text, optional)
   - `custom.promo_label_ar` (Single-line text, optional)
   - `custom.promo_savings_egp` (Integer, optional)

### Set values per product

1. Go to a product
2. Under **Metafields**, set:
   - `promo_active`: `true`
   - `promo_ends_at`: A future date
3. Save

### Ensure a real sale or discount exists

- Set a **compare-at price** higher than the regular price, OR
- Create a product-specific discount in **Shopify Admin → Discounts**

---

## 4. Cart savings summary

No Admin setup required beyond existing practices:

- Use **compare-at prices** for sale savings
- Use **Shopify discounts** for discount savings

The theme automatically detects and displays savings when they exist.

---

## 5. Pair-with cross-sell

### Option A: Product metafield

1. **Shopify Admin → Settings → Custom data → Products**
2. Add `custom.pair_with_products` (List of products)
3. Populate on each product

### Option B: Shopify Search & Discovery

1. Install **Shopify Search & Discovery** app
2. Configure **complementary products**
3. Note: The theme currently reads metafields/blocks only. Full Search & Discovery integration is a post-MVP enhancement.

---

## 6. Gift wrap

### Create the product

1. **Shopify Admin → Products → Add product**
2. Name: `Gift Wrap`
3. Price: e.g., `50` EGP
4. Upload a featured image
5. Save

### Configure theme

1. Open **Theme Editor → Theme settings → HORO**
2. Select the **Gift wrap product**
3. Set label and optional price hint

### Hide from collections (optional)

- Do not add the gift wrap product to any collection, OR
- Create a "Hidden" collection and use collection visibility rules

---

## 7. Localization

### Translate & Adapt

1. **Shopify Admin → Settings → Languages**
2. Ensure **Arabic** is added as a published language
3. Use **Translate & Adapt** app to review theme strings

### Arabic labels

The theme includes Arabic keys in `locales/ar.json` under `horo.incentives` and `horo.gift_wrap`.

If you want merchant-editable Arabic text in section settings, enter Arabic text directly into the setting fields in the Theme Editor.

---

## Quick checklist

| Feature | Admin action | Theme action |
|---|---|---|
| Free shipping | Create shipping rate or discount | Set threshold, enable progress |
| Bundle | Create automatic discount or code | Set required quantity, enable nudge |
| Promo countdown | Set product metafields | Section auto-renders when conditions met |
| Cart savings | Set compare-at prices / discounts | Section auto-renders when savings > 0 |
| Pair-with | Set `pair_with_products` metafield | Section renders companions |
| Gift wrap | Create gift wrap product | Select product in theme settings |
| Arabic labels | Publish Arabic locale | Verify `ar.json` keys |
