# HORO Product Promo Countdown Setup Guide

## Overview

The `product-promo-countdown.liquid` section displays a countdown timer on the product detail page (PDP) when a real promotion end date is set via product metafields.

**Important:** The countdown is display-only. It does not create or apply discounts. You must configure a real Shopify discount or compare-at price separately.

---

## Required Product Metafields

Create these metafield definitions in **Shopify Admin → Settings → Custom data → Products**:

| Namespace | Key | Type | Required | Description |
|-----------|-----|------|----------|-------------|
| `custom` | `promo_active` | Boolean | Yes | Must be `true` for the countdown to appear. |
| `custom` | `promo_ends_at` | Date and time | Yes | The promotion end date/time. Must be in the future. |
| `custom` | `promo_label` | Single-line text | No | Custom label (e.g., "Flash Sale"). Falls back to "Limited offer". |
| `custom` | `promo_label_ar` | Single-line text | No | Arabic custom label. |
| `custom` | `promo_savings_egp` | Integer | No | Optional savings amount displayed as "Save X EGP". |

### Example values
- `promo_active`: `true`
- `promo_ends_at`: `2026-05-10T23:59:59`
- `promo_label`: `Weekend Special`
- `promo_label_ar`: `عرض نهاية الأسبوع`
- `promo_savings_egp`: `150`

---

## How to populate the promo end date

1. Go to **Shopify Admin → Products → [Your Product]**
2. Scroll to **Metafields**
3. Set `custom.promo_active` to `true`
4. Set `custom.promo_ends_at` to a future date/time
5. Save

---

## Behavior

- The section **only renders** when:
  - `promo_active` is `true`
  - `promo_ends_at` is set
  - The end date is in the future
- The countdown updates **every minute** (not every second).
- When the countdown expires, it is replaced with "Offer ended" and hidden from view.
- If `promo_savings_egp` is set, an optional "Save X EGP" line appears.

---

## Safety warning: Do not show fake urgency

- **Do not** set `promo_active = true` without a real corresponding discount.
- The countdown must match one of:
  - A real Shopify discount (automatic or code)
  - A real compare-at price (sale price)
- Fake urgency destroys customer trust and may violate consumer protection rules.

---

## Theme section settings

In the **Theme Editor → Product page**:
- Find the **Product promo countdown** section
- Adjust color scheme and padding as needed
- The section is invisible when metafields are not set

---

## Localization

Arabic labels are supported automatically when the store locale is `ar` and the `promo_label_ar` metafield is populated. Fallback text uses the theme's `locales/ar.json` keys under `horo.incentives`.

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Countdown not showing | `promo_active` is false or missing | Set metafield to `true` |
| Countdown not showing | `promo_ends_at` is blank or past | Set a future date |
| Wrong label shown | `promo_label` not set | Add a custom label metafield or rely on default |
| Savings not showing | `promo_savings_egp` is 0 or blank | Set a positive integer value |
