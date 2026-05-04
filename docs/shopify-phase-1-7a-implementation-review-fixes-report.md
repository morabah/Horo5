# HORO Shopify Phase 1.7a — Implementation Review Fixes

## Objective
Review and fix the current Phase 1.7a implementation in the HORO Shopify theme (branch `medusa`). Identify inactive features, fix bugs, and ensure all safety rules are respected.

## Bugs found
1. **Free shipping remaining amount bug** — `remaining_cents` (already in cents) was piped through `divided_by: 100` before `money`, causing incorrect display for carts below the threshold.
2. **Sticky mobile ATC variant JSON** — Variant objects were not wrapped in an array, so `JSON.parse` would throw on products with multiple variants.
3. **Sticky mobile ATC not fully resilient** — Missing fallback `change` event listener for Dawn variant pickers; relied only on `variant:change` custom event and MutationObserver.
4. **Quick view modal accessibility** — Modal container lacked `tabindex="-1"`, preventing programmatic focus.
5. **Quick view currency access** — Referenced `Shopify.currencyActive` without guarding `window.Shopify`.
6. **Quick view missing "View cart" affordance** — After successful add-to-cart, only "Added!" was shown; no way to proceed to cart.
7. **Delivery estimate single-instance** — Used `querySelector` instead of `querySelectorAll`; multiple sections on the same page would only initialize the first.

## Files changed
- `shopify-theme/sections/cart-free-shipping-progress.liquid`
- `shopify-theme/snippets/horo-sticky-mobile-atc.liquid`
- `shopify-theme/assets/horo-sticky-mobile-atc.js`
- `shopify-theme/snippets/card-product.liquid`
- `shopify-theme/snippets/horo-quick-view-modal.liquid`
- `shopify-theme/assets/horo-quick-view.js`
- `shopify-theme/assets/horo-delivery-estimate.js`

## Fixes applied
1. **Free shipping progress**
   - Replaced `remaining_cents | divided_by: 100 | money` with `remaining_cents | money`.
2. **Sticky mobile ATC**
   - Wrapped embedded variant JSON in `[ ... ]` array brackets.
   - Added fallback `change` listener on `variant-radios, variant-selects, .product-form__input` with a 120ms debounce to read `.product-variant-id`.
   - Replaced hardcoded English button labels with `window.variantStrings.addToCart` / `window.variantStrings.soldOut` when available, keeping English fallback.
   - Added safe `window.Shopify.currencyActive` access for price display.
3. **Quick view activation**
   - Rendered `horo-quick-view-button` inside `card-product.liquid` within `card__media`, wrapped in `.card__quick-view.no-js-hidden` so it can be hidden via CSS if needed.
   - Did **not** remove Dawn quick-add.
4. **Quick view accessibility & polish**
   - Added `tabindex="-1"` to `HoroQuickViewModal` container.
   - Guarded currency access with `window.Shopify && window.Shopify.currencyActive`.
   - After successful ATC, injected a temporary "View cart" link (removed after 2.5s) without redirecting.
5. **Delivery estimate multi-instance**
   - Refactored `horo-delivery-estimate.js` to `querySelectorAll('[data-delivery-estimate]')` and call `initInstance(wrapper)` for each node.
   - Preserved existing static fallback behavior.

## Features now active
- `cart-free-shipping-progress` — present in `templates/cart.json` (section `cart_free_shipping_progress`).
- `horo-delivery-estimate` — present in `templates/product.json` (section `horo_delivery_estimate`).
- `horo-sticky-mobile-atc` — rendered at the end of `sections/main-product.liquid`.
- `horo-quick-view` — modal included in `layout/theme.liquid`; button now rendered inside every product card via `card-product.liquid`.

## Features still inactive
- `cart-free-shipping-progress` is present in `cart.json` but `enable_free_shipping_progress` is set to `false` by default in that template. Enable in Theme Editor or set `true` in `templates/cart.json` to activate.
- `horo-delivery-estimate` `show_exact_date_range` is `false` by default in `product.json`; static range still displays. Set to `true` for exact date calculation.

## Homepage/collection gaps still open
- **None.** Verified that the following are present:
  - `horo-story-plan` in `index.json` (section `story_plan`)
  - `horo-testimonials` in `index.json` (section `testimonials`)
  - `horo-final-cta` in `index.json` (section `final_cta`)
  - `collection-editorial-proof` in `collection.json` (section `editorial_proof`)
  - `collection-related-routes` in `collection.json` (section `related_routes`)

## Safety notes
- No checkout logic modified.
- No payment/shipping settings modified.
- `buy-buttons.liquid` untouched.
- `product-variant-picker.liquid` untouched.
- Dawn product form unchanged.
- Cart quantity/remove logic unchanged.
- `gift-wrap.js` untouched.
- No automatic discount calculations added.
- No fake reviews or live stock counters.
- No external libraries.
- All JS is scoped, defensive, and fail-safe.

## Theme check result
`shopify theme check --path shopify-theme` was run. **0 new HORO errors / 0 new HORO warnings.** Only existing baseline issues (e.g., unused assignments, variable naming in non-HORO files, and missing schema translation keys in Dawn core) remain unchanged.

## Manual test checklist
- [ ] Delivery estimate static fallback renders
- [ ] Delivery exact date range enabled (set `show_exact_date_range: true`)
- [ ] Multiple delivery estimate sections on same page (multi-instance safe)
- [ ] Free shipping progress below threshold shows correct remaining amount
- [ ] Free shipping progress above threshold shows unlocked message
- [ ] Quick view button appears on collection cards
- [ ] Quick view opens on click
- [ ] Quick view closes with Escape
- [ ] Quick view add-to-cart for single-variant product
- [ ] Quick view multi-variant product shows "View product" instead of ATC
- [ ] Sticky mobile ATC appears on product mobile (< 750px)
- [ ] Sticky mobile ATC syncs when variant changes
- [ ] Sticky mobile ATC shows sold-out state correctly
- [ ] Normal product add-to-cart still works
- [ ] Cart quantity/remove still works
- [ ] Checkout COD still works
- [ ] Checkout Instapay/manual still works
- [ ] Mobile 375px layout check
- [ ] RTL quick check (`dir="rtl"`)
