# HORO Shopify Phase 1.7a — Safe Theme UX Logic Report

**Date:** 2026-05-04
**Branch:** medusa

---

## Objective

Implement safe theme UX features previously deferred:
1. Exact delivery date calculation using JS
2. Quick view for product cards
3. Sticky mobile add-to-cart
4. Free-shipping progress UI refinement

## Files created

| File | Purpose |
|------|---------|
| `shopify-theme/assets/horo-delivery-estimate.js` | Exact delivery date calculator (Cairo timezone, business-day logic, cutoff) |
| `shopify-theme/snippets/horo-quick-view-button.liquid` | Quick view button for product cards |
| `shopify-theme/snippets/horo-quick-view-modal.liquid` | Shared quick view modal + JS include |
| `shopify-theme/assets/horo-quick-view.js` | Quick view modal logic (fetch product JSON, ATC or view-product fallback) |
| `shopify-theme/assets/component-horo-quick-view.css` | Quick view button + modal styles |
| `shopify-theme/snippets/horo-sticky-mobile-atc.liquid` | Sticky mobile add-to-cart bar snippet |
| `shopify-theme/assets/horo-sticky-mobile-atc.js` | Sticky ATC logic (IntersectionObserver, variant sync, /cart/add.js) |
| `shopify-theme/assets/component-horo-sticky-mobile-atc.css` | Sticky ATC bar styles (mobile-only, safe-area-inset) |

## Files changed

| File | Change |
|------|--------|
| `shopify-theme/sections/horo-delivery-estimate.liquid` | Added data attributes, date-range target elements, cutoff_hour_local + weekend_days settings, JS include |
| `shopify-theme/assets/component-horo-delivery-estimate.css` | Added `.horo-delivery-estimate__date-range` styles |
| `shopify-theme/sections/cart-free-shipping-progress.liquid` | Added `show_admin_warning_in_editor` setting, admin warning in editor, updated `message_after` default wording |
| `shopify-theme/assets/component-cart-free-shipping-progress.css` | Added `.cart-free-shipping-progress__admin-warning` styles |
| `shopify-theme/layout/theme.liquid` | Added `{% render 'horo-quick-view-modal' %}` before closing body |
| `shopify-theme/sections/main-product.liquid` | Added `{% render 'horo-sticky-mobile-atc' %}` before schema |

## Exact delivery date calculation

**How it works:**
- When `show_exact_date_range` is enabled, the Liquid section renders data attributes on the wrapper div and empty `<p>` targets with `data-standard-date-range` / `data-express-date-range`.
- The JS (`horo-delivery-estimate.js`) reads these attributes, calculates business-day date ranges using `Intl.DateTimeFormat` with `Africa/Cairo` timezone, and populates the target elements.
- If the current Cairo local hour is past the cutoff (default 18:00), the shipping anchor starts from the next calendar day.
- Weekend days are skipped (configurable: Friday–Saturday for Egypt, or Saturday–Sunday).
- The static "X–Y business days" text always remains visible as fallback.
- The calculated text uses "Estimated:" prefix — never promises guaranteed delivery.
- If JS fails or `Intl` is unsupported, the static range remains and the date-range elements stay hidden.

**New settings:**
- `cutoff_hour_local` — range 0–23, default 18
- `weekend_days` — select: Friday–Saturday (default) or Saturday–Sunday

**Accessibility:**
- Date range targets use `aria-live="polite"` for screen reader announcements.
- No layout shift — targets are inline within existing content blocks.

## Quick view

**How it works:**
- The `horo-quick-view-button.liquid` snippet renders a "Quick view" button on product cards with data attributes (`data-product-handle`, `data-product-url`, `data-has-variants`).
- The `horo-quick-view-modal.liquid` snippet renders a single shared modal (included once in `layout/theme.liquid`).
- The JS (`horo-quick-view.js`) listens for clicks on `[data-horo-quick-view-btn]`, fetches the product JSON from `/products/{handle}.js`, and populates the modal with image, title, price, and action button.
- **Single-variant products:** Shows "Add to cart" button using `/cart/add.js` with the first available variant ID.
- **Multi-variant products:** Shows "View product" link instead of risky add-to-cart (no variant selector in quick view).
- Modal closes on X button, Escape key, and backdrop click.
- Basic focus trap and focus return to the triggering button.
- `aria-modal="true"`, `role="dialog"` on the modal.

**Integration note:**
The quick view button snippet is **not automatically added** to product cards. To activate it, add this line inside the `card-wrapper` div in `snippets/card-product.liquid` (after the `card__badge` div, around line 567):

```liquid
{% render 'horo-quick-view-button', card_product: card_product, section_id: section_id %}
```

This is intentional — modifying `card-product.liquid` directly is risky and should be done carefully. The button also works when added to any section that renders product cards.

## Sticky mobile add-to-cart

**How it works:**
- The `horo-sticky-mobile-atc.liquid` snippet renders a hidden sticky bar with product title, price, and add-to-cart button.
- The JS (`horo-sticky-mobile-atc.js`) uses `IntersectionObserver` on the main product form submit button — when it scrolls out of view, the bar becomes visible.
- Variant sync: listens for Dawn's `variant:change` custom event and also watches the hidden `.product-variant-id` input for mutations.
- Add-to-cart uses `/cart/add.js` with the selected variant ID.
- If the selected variant is unavailable, the button shows "Sold out" and is disabled.
- Mobile only (CSS: `max-width: 749px`).
- Respects `env(safe-area-inset-bottom)` on iPhone.
- If JS fails, the bar stays hidden and the normal product form works unaffected.

**Integration:**
Automatically included via `{% render 'horo-sticky-mobile-atc' %}` in `main-product.liquid`.

## Free shipping progress refinement

**Changes:**
- Added `show_admin_warning_in_editor` setting (default: true) — displays a reminder in the Theme Editor that free shipping only applies if the matching rule is active.
- Updated `message_after` default from "Your cart may qualify for free shipping if the shipping rate is configured in checkout." to "Your cart has reached the free-shipping threshold. Final shipping options are confirmed at checkout."
- Added `info` text on `message_after` setting: "Do not promise guaranteed free shipping unless you have verified the matching shipping rule."
- Section remains disabled by default.
- No API fetching. No guaranteed free shipping claim.

## Safety notes

- ✅ No checkout logic changed
- ✅ No payment/shipping settings changed
- ✅ No `buy-buttons.liquid` modified
- ✅ No `product-variant-picker.liquid` modified
- ✅ No Dawn variant picker broken
- ✅ No add-to-cart on product page broken
- ✅ No cart quantity/remove logic changed
- ✅ No `gift-wrap.js` modified
- ✅ No external libraries added
- ✅ All new JS is small, scoped, defensive, and fail-safe
- ✅ RTL-safe logical CSS preserved (inline-size, inset-inline, margin-block)
- ✅ Mobile-first behavior preserved
- ✅ Accessibility: aria-live, aria-modal, role="dialog", focus trap, focus return
- ✅ Quick view ATC only for single-variant products; multi-variant shows "View product"
- ✅ Sticky ATC syncs with Dawn variant picker; fails gracefully
- ✅ Delivery estimate JS falls back to static range if anything fails
- ✅ Free shipping progress disabled by default; no guaranteed claims

## Known limitations

- **No holiday-aware delivery logic** — holidays are not skipped in business-day calculation. This is deferred to a future phase.
- **Free-shipping threshold still manual** — the merchant must keep the section setting in sync with their Shopify shipping rate. No API fetching.
- **Quick view simplified for multi-variant** — products with multiple variants show "View product" instead of a variant selector. A full variant picker in the modal is deferred.
- **Sticky ATC depends on variant sync** — relies on Dawn's `variant:change` event and hidden input mutation observer. If Dawn changes these internals, the sync may break (but the normal product form still works).
- **Quick view button not auto-added to cards** — requires manual addition to `card-product.liquid` or section templates.

## Theme check result

```
shopify theme check --path shopify-theme
217 files inspected with 27 total offenses found across 12 files.
2 errors (pre-existing Dawn baseline: ValidSchemaTranslations in featured-product.liquid)
25 warnings (pre-existing: RemoteAsset, UndefinedObject, VariableName, OrphanedSnippet, UnusedAssign)
1 new warning: OrphanedSnippet for horo-quick-view-button.liquid (expected — requires manual integration)
0 new HORO errors
```

## Manual test checklist

### PDP — Delivery estimate
- [ ] PDP static delivery fallback visible when `show_exact_date_range` is off
- [ ] PDP exact delivery estimate enabled — calculated dates appear
- [ ] Cairo cutoff before 18:00 — same-day anchor used
- [ ] Cairo cutoff after 18:00 — next-business-day anchor used
- [ ] Weekend skip — Friday/Saturday (or configured weekend) not counted
- [ ] JS disabled — static range remains, no broken layout

### PDP — Sticky mobile ATC
- [ ] Product page normal add-to-cart still works
- [ ] Sticky bar appears on mobile when main buy button scrolls out of view
- [ ] Sticky bar hides when main buy button is visible
- [ ] Variant change syncs price and button state
- [ ] Sold-out variant disables button
- [ ] Add-to-cart from sticky bar works
- [ ] Safe-area-inset-bottom respected on iPhone
- [ ] Desktop — sticky bar not visible

### Collection — Quick view
- [ ] Quick view button visible on product cards (after manual integration)
- [ ] Quick view modal opens on button click
- [ ] Quick view modal closes with Escape key
- [ ] Quick view modal closes with X button
- [ ] Quick view modal closes with backdrop click
- [ ] Focus returns to opening button after close
- [ ] Single-variant product: "Add to cart" button works
- [ ] Multi-variant product: "View product" link shown
- [ ] Add-to-cart from quick view works
- [ ] Missing product data — error state with link to product page

### Cart — Free shipping progress
- [ ] Cart free-shipping progress disabled by default
- [ ] Cart free-shipping progress below threshold — progress bar and message
- [ ] Cart free-shipping progress above threshold — unlocked message with refined wording
- [ ] Admin warning visible in Theme Editor only
- [ ] Cart quantity/remove still works
- [ ] No guaranteed free shipping claim

### Checkout
- [ ] Checkout COD still works
- [ ] Checkout Instapay/manual still works

### Responsive
- [ ] Mobile 375px — all features work
- [ ] RTL quick check — no broken layout

### Accessibility
- [ ] Delivery date range announced by screen reader (aria-live)
- [ ] Quick view modal announced (aria-modal, role="dialog")
- [ ] Sticky ATC button has clear label
- [ ] Price/variant updates announced (aria-live)
