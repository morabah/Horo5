# HORO Shopify Incentives Data Model

## Overview

This document defines a safe, two-mode incentives data model for the HORO Shopify theme.

- **Mode 1:** Manual/theme settings fallback (no app required)
- **Mode 2:** App-proxy synced mode (public JSON endpoint, no Admin tokens exposed)

The theme always defaults to Mode 1. Mode 2 is activated by section settings and gracefully falls back to Mode 1 on any API failure.

---

## Mode 1: Manual / Theme Settings Fallback

### Free-shipping threshold
- **Setting:** `section.settings.threshold_egp` (range, default 1500)
- **Activation:** `section.settings.enable_free_shipping_progress` (checkbox)
- **Display:** Progress bar and message based on `cart.total_price`
- **Merchant responsibility:** Keep theme threshold equal to Shopify Admin shipping rate threshold

### Bundle discount copy
- **Setting:** `section.settings.heading_before`, `section.settings.heading_after`, `section.settings.discount_code_text`
- **Activation:** `section.settings.enable_bundle_message` (checkbox)
- **Quantity:** `section.settings.required_quantity` (range, default 3)
- **Display:** Informational progress / nudge only
- **Merchant responsibility:** Configure matching discount in Shopify Admin → Discounts

### Countdown
- **Metafields:**
  - `custom.promo_active` (boolean)
  - `custom.promo_ends_at` (date_time)
  - `custom.promo_label` (single_line_text_field)
  - `custom.promo_label_ar` (single_line_text_field)
  - `custom.promo_savings_egp` (number_integer, optional)
- **Display:** Rendered only when `promo_active` is true and `promo_ends_at` is in the future
- **Merchant responsibility:** Set metafields per product and ensure a real discount or compare-at price exists

### Cross-sell companion products
- **Metafield:** `custom.pair_with_products` (list.product_reference)
- **Fallback:** Manual section blocks with product picker
- **Display:** PDP "Pair with" section
- **Merchant responsibility:** Populate metafield or configure section blocks

### Gift wrap product
- **Setting:** `settings.horo_gift_wrap_product` (product picker in theme settings)
- **Price:** Live variant price from the selected product
- **Image:** `gift_wrap_product.featured_image`
- **Display:** Product page and cart upsell sections
- **Merchant responsibility:** Create a gift-wrap product in Shopify Admin and select it in theme settings

---

## Mode 2: App-Proxy Synced Mode

### Activation
Each section that supports API sync has a `use_incentives_api` checkbox and an `incentives_api_url` text field.

### Public endpoint
```
GET /apps/horo-incentives
```

### Response format
```json
{
  "freeShipping": {
    "active": true,
    "thresholdEgp": 1500,
    "label": {
      "en": "Free shipping over 1500 EGP",
      "ar": "شحن مجاني للطلبات فوق 1500 جنيه"
    }
  },
  "bundle": {
    "active": true,
    "requiredQuantity": 3,
    "discountEgp": 100,
    "discountCode": "HORO100",
    "label": {
      "en": "Buy 3 and save 100 EGP",
      "ar": "اشتري 3 ووفر 100 جنيه"
    }
  },
  "promo": {
    "active": true,
    "label": {
      "en": "Limited offer",
      "ar": "عرض لفترة محدودة"
    }
  },
  "updatedAt": "2026-05-05T12:00:00Z"
}
```

### Security rules
- The endpoint must be **public** (no authentication required).
- It must **not** expose Admin API tokens or private store data.
- It must **not** apply discounts by itself.
- It is for **display data only**.
- The app backend may call the Shopify Admin API server-side and cache the result.

### Theme behavior
1. If `use_incentives_api` is true:
   - Fetch `incentives_api_url` with a timeout (default 2500ms).
   - If response is valid JSON and contains the relevant feature data, use it.
   - If fetch fails, times out, or returns invalid data:
     - If `fallback_to_manual_threshold` (or equivalent) is true, use manual settings.
     - Otherwise, hide the feature block.
2. All API-enhanced values are applied via JavaScript DOM updates, not server-side Liquid rendering.
   - Liquid renders the manual fallback first.
   - JS then enhances the DOM if API data arrives.

---

## Data Flow Diagram

```
Shopify Admin
├── Shipping settings (free shipping threshold)
├── Discounts (bundle, promo)
├── Products (gift wrap, compare-at prices)
└── Metafields (promo data, pair-with)
       │
       ├─► Theme Liquid (Mode 1) ──► Customer browser
       │
       └─► App backend (server-side Admin API calls)
              │
              └─► Public app proxy JSON
                     │
                     └─► Theme JS (Mode 2 enhancement)
                            │
                            └─► Customer browser
```

---

## Fallback Matrix

| Feature | Mode 1 Source | Mode 2 Source | Fallback on API Failure |
|---|---|---|---|
| Free shipping threshold | section.settings.threshold_egp | API `freeShipping.thresholdEgp` | Manual setting if `fallback_to_manual_threshold` is true |
| Bundle progress | section.settings.required_quantity, discount_code_text | API `bundle.requiredQuantity`, `bundle.discountCode` | Manual settings |
| Promo countdown | Product metafields | API `promo` (optional override) | Product metafields |
| Gift wrap | settings.horo_gift_wrap_product | Not synced via API | Theme setting |
| Pair-with | Product metafields / blocks | Not synced via API | Product metafields / blocks |
| Cart savings | Cart Liquid object | Not synced via API | Cart Liquid object |

---

## Implementation Notes

1. **No Admin tokens in browser:** All Admin API calls happen server-side in the app backend.
2. **Checkout is source of truth:** The theme never calculates final prices, discounts, or shipping costs.
3. **Graceful degradation:** Every feature works in Mode 1 without any app installed.
4. **Caching:** Theme JS should not fetch the API on every page load. A short in-memory cache (e.g., 60 seconds) is acceptable.
5. **RTL safety:** All new CSS uses logical properties. Arabic labels are included in API responses and locale files.
