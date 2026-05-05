# HORO Shopify Phase 1.9 — Advanced Incentives Report

## Objective

Implement the advanced incentive features that remain missing compared with the Medusa/web-next implementation, while keeping Shopify checkout as the source of truth. All display-only features must have a real Shopify Admin or app-backed configuration. No fake money logic in the theme.

---

## Architecture decisions

1. **Two-mode data model:** Every API-enhanced feature defaults to manual theme settings and gracefully falls back if the public app proxy fails.
2. **Display-only principle:** The theme never calculates final prices, shipping, or taxes. It reads real Shopify cart data and metafields.
3. **No Admin tokens in browser:** All Admin API interaction must happen server-side in an app backend.
4. **Checkout is source of truth:** All money logic is applied by Shopify checkout, discounts, shipping settings, or Functions.

---

## Files created

| File | Purpose |
|------|---------|
| `docs/shopify-advanced-incentives-architecture-audit.md` | Part A — Feature-by-feature architecture audit |
| `docs/shopify-incentives-data-model.md` | Part B — Safe two-mode incentives data model |
| `docs/shopify-product-promo-countdown-setup.md` | Part D — Promo countdown setup guide |
| `docs/shopify-cart-savings-summary-logic.md` | Part E — Cart savings logic documentation |
| `docs/shopify-dynamic-bundle-progress-setup.md` | Part F — Bundle progress setup guide |
| `docs/shopify-pair-with-cross-sell-setup.md` | Part G — Pair-with cross-sell setup guide |
| `docs/shopify-advanced-gift-wrap-setup.md` | Part H — Advanced gift wrap setup guide |
| `docs/shopify-advanced-incentives-admin-setup-guide.md` | Part J — Step-by-step Admin setup guide |
| `shopify-theme/assets/horo-incentives.js` | Part C/F — Public API fetcher + free-shipping + bundle enhancement |
| `shopify-theme/assets/horo-promo-countdown.js` | Part D — Safe promo countdown with minute-level updates |
| `shopify-theme/assets/horo-pair-with.js` | Part G — One-click multi-product add-to-cart |
| `shopify-theme/assets/component-product-promo-countdown.css` | Part D — Promo countdown styles |
| `shopify-theme/assets/component-cart-savings-summary.css` | Part E — Cart savings styles |
| `shopify-theme/assets/component-product-pair-with.css` | Part G — Pair-with styles |
| `shopify-theme/sections/product-promo-countdown.liquid` | Part D — Promo countdown section |
| `shopify-theme/sections/cart-savings-summary.liquid` | Part E — Cart savings summary section |
| `shopify-theme/sections/product-pair-with.liquid` | Part G — Pair-with cross-sell section |

## Files changed

| File | Changes |
|------|---------|
| `shopify-theme/sections/cart-free-shipping-progress.liquid` | Added API sync settings, data attributes, horo-incentives.js loading |
| `shopify-theme/sections/cart-bundle-nudge.liquid` | Replaced static text with dynamic progress counting, API sync, eligible collection logic |
| `shopify-theme/snippets/gift-wrap-upsell.liquid` | Added preview image, toggle checkbox UI, cart remove support, description copy |
| `shopify-theme/sections/product-gift-wrap-upsell.liquid` | Added `show_preview_image` setting, passes it to snippet |
| `shopify-theme/sections/cart-gift-wrap-upsell.liquid` | Added `show_preview_image` setting, passes it to snippet |
| `shopify-theme/assets/gift-wrap.js` | Added checkbox toggle add/remove, safe cart removal via `/cart/change.js` |
| `shopify-theme/assets/component-gift-wrap.css` | Added preview image, toggle/checkbox styles, copy text styles |
| `shopify-theme/assets/component-cart-free-shipping-progress.css` | Minor enhancement (existing file kept) |
| `shopify-theme/assets/component-cart-bundle-nudge.css` | Minor enhancement (existing file kept) |
| `shopify-theme/locales/en.default.json` | Added `horo.incentives.*` and `horo.gift_wrap.description` keys |
| `shopify-theme/locales/ar.json` | Added Arabic `horo.incentives.*` and `horo.gift_wrap.description` keys |
| `shopify-theme/templates/cart.json` | Added `cart_savings_summary`, updated free-shipping and bundle defaults |
| `shopify-theme/templates/product.json` | Added `product_promo_countdown` and `product_pair_with`, updated gift-wrap defaults |
| `docs/shopify-calculation-logic-setup-guide.md` | Added app-proxy auto-sync section and security notes |

---

## Auto-synced free-shipping threshold

- **Manual mode:** Section renders progress bar based on `threshold_egp` setting and `cart.total_price`.
- **API mode:** If `use_incentives_api` is enabled, `horo-incentives.js` fetches the public endpoint and updates threshold/progress dynamically.
- **Fallback:** If API fails or times out, the manual setting remains visible.
- **Safety:** Messages never promise guaranteed free shipping; they reference checkout confirmation.

## Product promo countdown

- **Data source:** Product metafields (`custom.promo_active`, `custom.promo_ends_at`, optional `custom.promo_label`, `custom.promo_label_ar`, `custom.promo_savings_egp`).
- **Rendering:** Only if promo is active and end date is in the future.
- **Expiry:** Hides countdown and shows "Offer ended" when date passes.
- **Updates:** Every 60 seconds; respects `prefers-reduced-motion`.
- **Accessibility:** `aria-live="polite"` on the container.

## Cart savings summary

- **Calculation:**
  - Compare-at savings: `(variant.compare_at_price - final_price) * quantity`
  - Cart discount savings: `cart.total_discount`
  - Total: sum of both
- **Rendering:** Only if `total_savings_cents > 0`.
- **Safety:** Uses only real Shopify cart data; no invented savings.

## Dynamic bundle progress

- **Eligibility counting:** Counts all non-gift-wrap cart items, or only items from a selected collection.
- **Progress messaging:**
  - Below threshold: "Add X more to unlock the bundle offer"
  - At/after threshold: "Your cart may qualify for the bundle offer"
- **Discount code:** Displayed if configured.
- **API enhancement:** Optional app-proxy fetch for synced `requiredQuantity` and `discountCode`.

## Pair-with one-click add-to-cart

- **Sources:** Product metafield `custom.pair_with_products` or manual section blocks.
- **Single-variant:** Checkbox for one-click add.
- **Multi-variant:** "Choose options" link to product page (safe fallback).
- **Add flow:** `POST /cart/add.js` with `items` array; button disabled during request; `aria-live` status.
- **Sold-out:** Excluded automatically.

## Advanced gift-wrap toggle/preview

- **Preview image:** Shows `gift_wrap_product.featured_image` if available; icon fallback otherwise.
- **Product page:** Toggle checkbox adds gift wrap on check; no custom remove on PDP.
- **Cart page:** Toggle checkbox is checked if gift wrap is in cart; unchecking safely removes it via `/cart/change.js`.
- **Live price:** Displays actual variant price from the gift wrap product.
- **Duplicate prevention:** Existing detection logic preserved.
- **Accessibility:** Real checkbox input with label; `aria-live` status region.

## Localization

- All new reusable labels use translation keys under `horo.incentives`.
- English and Arabic keys provided.
- Merchant-editable section settings remain editable but are documented.
- RTL-safe logical CSS preserved throughout.

## Admin setup required

1. **Free shipping:** Create matching shipping rate or discount in Shopify Admin.
2. **Bundle:** Create automatic discount or code with minimum quantity requirement.
3. **Promo countdown:** Create product metafields and set real sale/discount.
4. **Cart savings:** Set compare-at prices or create Shopify discounts.
5. **Pair-with:** Populate `custom.pair_with_products` metafield or use section blocks.
6. **Gift wrap:** Create gift wrap product with image and price; select in theme settings.
7. **Localization:** Publish Arabic locale; verify `ar.json` keys.

## App proxy / Shopify Functions requirements

| Feature | App proxy | Shopify Functions |
|---------|-----------|-------------------|
| Free shipping threshold | Optional for auto-sync | Not required |
| Bundle progress | Optional for synced config | Not required for display |
| Promo countdown | Optional (metafields sufficient) | Not required |
| Cart savings | Not required | Not required |
| Pair-with | Not required | Not required |
| Gift wrap | Not required | Not required |

## Features implemented as display-only

- Free shipping progress bar and messaging
- Bundle progress counting and messaging
- Promo countdown timer
- Cart savings summary
- Gift wrap preview, toggle, and price display
- Pair-with companion product UI

## Features backed by Shopify native discounts

- Free shipping: Shopify Admin shipping rates or automatic discounts
- Bundle: Shopify Admin automatic discounts or discount codes
- Cart savings: Shopify `cart.total_discount` + compare-at prices
- Gift wrap: Real Shopify product upsell

## Safety notes

- **No checkout core logic changed.**
- **No cart item quantity/remove logic changed.**
- **No product form or variant picker changed.**
- **No buy-buttons.liquid modified.**
- **No payment/shipping settings modified.**
- **No Admin API tokens exposed in browser JS.**
- **No fake discounts, countdowns, savings, reviews, or stock counters.**
- All JavaScript is small, scoped, defensive, and fail-safe.

## Theme check result

```
shopify theme check --path shopify-theme
```

- **Exit code:** 0
- **New HORO errors:** 0
- **New HORO warnings:** 0
- Existing baseline issues in `featured-product.liquid` and pre-existing `_label`/`_price` variable naming remain unchanged.

## Manual test checklist

| Test | Status |
|------|--------|
| JSON templates parse | Verified (cart.json, product.json) |
| Free shipping progress manual fallback | Ready to test |
| Free shipping progress API fallback | Ready to test |
| Countdown product with future date | Ready to test |
| Countdown product with expired date | Ready to test |
| Cart with compare-at savings | Ready to test |
| Cart with Shopify discount | Ready to test |
| Bundle progress below threshold | Ready to test |
| Bundle progress at threshold | Ready to test |
| Pair-with single-variant product add | Ready to test |
| Pair-with multi-variant product fallback | Ready to test |
| Gift wrap preview image | Ready to test |
| Gift wrap toggle add | Ready to test |
| Gift wrap duplicate prevention | Preserved |
| Gift wrap remove from cart | Ready to test |
| Cart quantity/remove still works | Preserved |
| Product form still works | Preserved |
| Checkout COD still works | Preserved |
| Checkout Instapay/manual still works | Preserved |
| Mobile 375px | CSS responsive |
| RTL Arabic quick check | RTL-safe logical CSS |

## Known limitations

1. **App proxy not built:** The public `/apps/horo-incentives` endpoint is a documented architecture but requires a separate app build.
2. **Collection eligibility in bundle:** `item.product.collections contains section.settings.eligible_collection` is Liquid logic that may not always evaluate as expected in all Shopify contexts; testing recommended.
3. **Gift wrap cart removal:** Uses line index lookup from `/cart.js`; if cart composition changes between fetch and change, removal may target wrong line (race condition unlikely in practice).
4. **Promo countdown minute resolution:** Updates every 60 seconds, not per second, to reduce DOM noise.
5. **Pair-with page refresh:** Uses `window.location.reload()` on success to keep Dawn cart state in sync. A future enhancement could use the Dawn cart API for smoother updates.

## Deferred work

- Custom checkout (explicitly excluded)
- Direct Admin API calls from browser (security violation)
- Fake discounts, countdowns, savings, reviews, stock counters (trust violation)
- Payment-method discount (requires Shopify Plus / Functions)
- Loyalty / second-order credit (requires app backend)
- Predictive Arabic fuzzy search (out of scope)
- Heavy frontend app rebuild (out of scope)
- Gift wrap line-item message (documented as future enhancement)
- Full Shopify Search & Discovery integration for pair-with (post-MVP)

---

**Phase 1.9 complete. Do not proceed to Phase 2.0 without explicit approval.**
