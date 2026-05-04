# HORO Shopify Phase 1.6g — Calculation & Store Logic Parity Report

## Objective

Compare Medusa/web storefront calculation logic against the Shopify Dawn-based HORO theme, then add only safe display-level parity. Do not duplicate checkout math or discount math in the theme.

## Logic audit summary

Audited 12 calculation / logic areas across Medusa/web vs. Shopify:

1. **Delivery date/window logic** — Medusa has Cairo timezone + business-day JS calculations. Shopify has static delivery cards. **Safe to add display-only estimate section.**
2. **Shipping rates and estimated shipping** — Both handled natively at checkout. **No theme changes.**
3. **Free shipping threshold** — Medusa has dynamic progress bar. Shopify can support via Admin shipping rates. **Safe to add display-only progress section (disabled by default).**
4. **Bundle/AOV discount logic** — Medusa auto-calculates. Shopify uses Admin discounts. **Already addressed in Phase 1.6f (cart-bundle-nudge).**
5. **Gift wrap price/label logic** — Medusa reads from incentives DTO. Shopify uses live product. **Gap: price hint override blocks live price display. Fixed.**
6. **Payment-method discount** — e.g., Instapay save 3%. **Deferred** — requires Shopify Plus / Checkout Functions.
7. **Size table presets and fit models** — Medusa has JSON presets. Shopify has static blocks in `page.size-guide.json`. **No code changes.**
8. **Inventory/low-stock logic** — Metafield-driven on both. **Already implemented.**
9. **Restock notification** — **Deferred** — recommend Shopify app.
10. **Search filters/fuzzy suggestions** — Dawn search sufficient. **Deferred.**
11. **Checkout validation/order confirmation** — Shopify native. **No changes.**
12. **Loyalty/second-order credit** — **Deferred** — requires customer history access.

## Files created

| File | Purpose |
|------|---------|
| `docs/shopify-calculation-logic-parity-audit.md` | Full logic parity audit |
| `shopify-theme/sections/horo-delivery-estimate.liquid` | Display-only delivery estimate with configurable day ranges |
| `shopify-theme/assets/component-horo-delivery-estimate.css` | Styles for delivery estimate section |
| `shopify-theme/sections/cart-free-shipping-progress.liquid` | Free shipping progress bar using Liquid math only |
| `shopify-theme/assets/component-cart-free-shipping-progress.css` | Styles for free shipping progress |
| `docs/shopify-calculation-logic-setup-guide.md` | Merchant setup instructions for shipping rates, thresholds, and discounts |
| `docs/shopify-phase-1-6g-calculation-logic-parity-report.md` | This report |

## Files changed

| File | Change |
|------|--------|
| `shopify-theme/templates/product.json` | Added `horo_delivery_estimate` section after `product_delivery_payment` |
| `shopify-theme/templates/cart.json` | Added `cart_free_shipping_progress` section before `cart-footer`, disabled by default |
| `shopify-theme/snippets/gift-wrap-upsell.liquid` | Auto-displays `gift_wrap_variant.price \| money` when `price_hint` is blank |

## Implemented safe display logic

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | **Delivery estimate section** | `horo-delivery-estimate.liquid` — configurable standard/express day ranges, cautious copy, disabled exact dates by default. Added to `product.json` after delivery & payment cards. |
| 2 | **Free shipping progress** | `cart-free-shipping-progress.liquid` — uses `cart.total_price` and configurable threshold in Liquid only. Progress bar width computed in percent. Disabled by default. Added to `cart.json` before footer. |
| 3 | **Gift wrap live price** | `gift-wrap-upsell.liquid` now falls back to `gift_wrap_variant.price \| money` when `price_hint` is blank. Preserves manual override. |

## Admin setup required

| Feature | Shopify Admin action |
|---------|---------------------|
| Free shipping rate | Settings → Shipping and delivery → add rate with minimum order price condition |
| Free shipping threshold in theme | Theme customizer → Cart → set threshold to match Admin |
| Bundle discount (if used) | Discounts → Automatic discount or Discount code |
| Delivery day ranges | Theme customizer → Product → adjust ranges to match carrier contracts |
| Gift wrap product price | Products → Gift Wrap product → verify price |

## Deferred logic

| Logic | Why deferred |
|-------|------------|
| Exact delivery dates with JS | Requires Cairo timezone + business-day calculation |
| Free shipping real-time progress without page refresh | Requires cart JS for live updates |
| Payment-method discount (Instapay 3%) | Requires Shopify Plus + Checkout Functions |
| Live stock count per variant | Requires JS + inventory AJAX API |
| Restock notifications | Recommend Back in Stock / Klaviyo app |
| Search fuzzy suggestions | JS-heavy rebuild |
| Loyalty / second-order credit | Requires customer history + backend |
| Dynamic per-product size tables | Requires metafield → table mapping |

## Safety notes

- No checkout logic changed.
- No cart item logic, quantity, or remove logic changed.
- No product form, variant picker, buy buttons, or price logic changed.
- No payment or shipping settings changed.
- No JavaScript added. All changes are Liquid + CSS only.
- Free shipping progress section is **disabled by default** and contains no automatic discount calculation.
- Delivery estimate section shows **ranges only**, never exact dates.
- Gift wrap price now reads from the **live product variant**, not a hardcoded hint.
- No fake math, fake discounts, or fake inventory numbers.

## Theme check result

Command: `shopify theme check --path shopify-theme`

- **0 new HORO errors** from Phase 1.6g changes.
- **0 new HORO warnings** from Phase 1.6g changes.
- Baseline pre-existing warnings remain unchanged (UnusedAssign in `main-product.liquid`, `main-search.liquid`; gift-wrap variable naming; orphaned snippets).

## Manual test checklist

- [ ] Cart empty — free shipping section hidden (or shows placeholder in design mode)
- [ ] Cart below free-shipping threshold — message shows remaining amount with progress bar
- [ ] Cart above free-shipping threshold — message shows unlocked state, bar at 100%
- [ ] Free-shipping progress disabled — section hidden, placeholder shown in design mode
- [ ] Free-shipping progress enabled — renders correctly with real cart math
- [ ] Product page — delivery estimate section shows standard + express ranges
- [ ] Product page — delivery estimate hidden when disabled in customizer
- [ ] Gift wrap upsell — shows live product price when no price_hint is passed
- [ ] Gift wrap add still works
- [ ] Cart quantity/remove still works
- [ ] Checkout still works
- [ ] Mobile 375px — no layout breakage on cart or product
- [ ] RTL quick check — logical CSS properties hold up
