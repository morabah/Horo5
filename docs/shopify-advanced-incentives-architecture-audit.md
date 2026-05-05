# HORO Shopify Advanced Incentives — Architecture Audit

## Objective
Audit each requested advanced incentive feature against Shopify-native capabilities, safety constraints, and the existing Medusa/web-next implementation to determine the safest path for HORO MVP.

---

## 1. Auto-synced free-shipping threshold

### What Medusa/web-next likely did
- Medusa can compute free-shipping eligibility server-side via promotion rules.
- web-next likely renders a progress bar driven by an API response that includes `freeShipping.threshold` and `cart.total`.

### Shopify-native/no-code alternative
- Shopify Admin → Settings → Shipping and delivery → Create a free shipping rate with a minimum order price condition.
- The theme already displays a progress bar matched to a manual threshold.

### Shopify theme-only possibility
- The theme can render `cart.total_price` against a static threshold setting.
- It cannot auto-discover the threshold from Shopify Admin shipping settings (no Liquid variable exposes the free-shipping rate condition).

### App/app-proxy or Shopify Functions requirement
- **App proxy recommended for auto-sync.** A public app proxy endpoint can return the active threshold configured in the app backend.
- Shopify Functions (checkout extensions) are not needed because the free-shipping rate is natively supported.

### Data source required
- Mode 1 (manual): theme section setting `threshold_egp`
- Mode 2 (synced): public app proxy JSON response with `freeShipping.thresholdEgp`

### Risk level
- Low. Display-only progress. No checkout logic changed.

### Recommended implementation for HORO MVP
- **Theme-safe only with manual settings** for now.
- Add optional API fetch in JS. If API fails, fall back to manual setting.
- Document that the merchant must keep the theme threshold equal to the shipping rate threshold.

### Recommended implementation for post-MVP
- Build a lightweight app proxy that reads the merchant’s configured free-shipping rate from a private database or Shopify Admin API (server-side only) and exposes a public JSON endpoint.

### Classification
- **Theme-safe only with manual settings**
- **Requires app proxy** for true auto-sync

---

## 2. Product promo countdown

### What Medusa/web-next likely did
- Medusa promotions have start/end dates. web-next likely renders a countdown when a product is included in an active time-bound promotion.

### Shopify-native/no-code alternative
- Shopify does not expose promotion end dates per product in Liquid.
- Product metafields (`custom.promo_ends_at`) are the only native way to store promo end dates.

### Shopify theme-only possibility
- The theme can read product metafields and render a countdown.
- The countdown is display-only and must be manually kept in sync with any real Shopify discount.

### App/app-proxy or Shopify Functions requirement
- Not required for MVP. Metafields are sufficient.
- Post-MVP: an app proxy could push promo data to metafields automatically.

### Data source required
- `product.metafields.custom.promo_ends_at` (date_time)
- `product.metafields.custom.promo_active` (boolean)
- Optional: `product.metafields.custom.promo_label` (single_line_text_field)

### Risk level
- Low to medium. Fake urgency is a trust risk. Must hide when expired and must correspond to a real discount or compare-at price.

### Recommended implementation for HORO MVP
- **Theme-safe now** using product metafields.
- Render only if `promo_active` is true and `promo_ends_at` is in the future.
- Hide when expired.

### Recommended implementation for post-MVP
- App-backed metafield sync from discount data.

### Classification
- **Theme-safe now**

---

## 3. Cart savings summary: "You saved X EGP"

### What Medusa/web-next likely did
- Medusa can return computed savings per line item and cart-level.
- web-next likely displays these server-computed values.

### Shopify-native/no-code alternative
- Shopify Liquid exposes:
  - `item.variant.compare_at_price` vs `item.final_price` (compare-at savings)
  - `item.line_level_discount_allocations` (discount savings)
  - `cart.total_discount` (cart-level discount total)

### Shopify theme-only possibility
- The theme can safely calculate compare-at savings and read cart discount allocations.
- No fake math is needed — all numbers come from Shopify cart data.

### App/app-proxy or Shopify Functions requirement
- Not required.

### Data source required
- Cart object (Liquid)

### Risk level
- Low. Uses only real Shopify cart data.

### Recommended implementation for HORO MVP
- **Theme-safe now**
- Calculate compare-at savings: `(compare_at_price - final_price) * quantity`
- Add `cart.total_discount` separately.
- Render only if total > 0.

### Recommended implementation for post-MVP
- No change needed. Theme-level is sufficient.

### Classification
- **Theme-safe now**

---

## 4. Dynamic bundle progress

### What Medusa/web-next likely did
- Medusa can evaluate bundle rules server-side and return progress data (e.g., "2 of 3 items").
- web-next likely renders this progress dynamically.

### Shopify-native/no-code alternative
- Shopify Admin discounts support "Buy X get Y" and minimum-quantity amount-off discounts.
- The theme can count eligible cart items and show progress.

### Shopify theme-only possibility
- The theme can count cart items (all items or items from a specific collection) and show progress toward a manually configured quantity.
- It cannot verify whether the discount actually applies (eligibility rules may exclude the current cart).

### App/app-proxy or Shopify Functions requirement
- Not required for display-only progress.
- Shopify Functions could be used for a more sophisticated bundle discount at checkout (post-MVP).

### Data source required
- Cart object
- Theme settings: `required_quantity`, `eligible_collection`
- Optional app proxy: `bundle.requiredQuantity`, `bundle.discountCode`

### Risk level
- Low. Display-only. Must include disclaimer: "Final discount confirmed at checkout."

### Recommended implementation for HORO MVP
- **Theme-safe only with manual settings**
- Count eligible items in Liquid/JS.
- Show progress and remaining count.
- Include discount code if configured.

### Recommended implementation for post-MVP
- App proxy for synced bundle config.

### Classification
- **Theme-safe only with manual settings**

---

## 5. One-click multi-product add-to-cart

### What Medusa/web-next likely did
- Likely a "Pair with" / "Complete the look" component that adds multiple variants to the cart via a single API call.

### Shopify-native/no-code alternative
- Shopify Search & Discovery app provides complementary product recommendations, but does not expose them in Liquid directly without JS.
- Product metafields (`custom.pair_with_products`) can store companion product references.

### Shopify theme-only possibility
- The theme can render companion products from metafields or manual section blocks.
- JS can POST to `/cart/add.js` with `items: [{id, quantity}, ...]` to add multiple products.

### App/app-proxy or Shopify Functions requirement
- Not required for MVP.

### Data source required
- `product.metafields.custom.pair_with_products` (list.product_reference)
- Or manual section blocks

### Risk level
- Low to medium. Must handle variant selection safely. Multi-variant products should not be added with an unsafe default variant.

### Recommended implementation for HORO MVP
- **Theme-safe now**
- Render companions from metafields or blocks.
- For single-variant products: one-click add.
- For multi-variant products: "Choose options" link instead of add button.

### Recommended implementation for post-MVP
- Integrate with Shopify Search & Discovery API for smarter recommendations.

### Classification
- **Theme-safe now**

---

## 6. Advanced gift-wrap toggle/preview

### What Medusa/web-next likely did
- Likely a gift-wrap upsell with image preview, toggle UI, and optional message field.

### Shopify-native/no-code alternative
- Gift wrap as a real Shopify product is already implemented.
- The theme can show the product image, price, and toggle state.

### Shopify theme-only possibility
- Enhance the existing gift-wrap snippet with:
  - Product image preview
  - Toggle/checkbox UI
  - Live price display
  - Duplicate prevention (already exists)
- Cart removal can use `/cart/change.js` with quantity 0.

### App/app-proxy or Shopify Functions requirement
- Not required.

### Data source required
- `settings.horo_gift_wrap_product`
- Cart object (to detect if gift wrap is in cart)

### Risk level
- Low. Uses existing gift-wrap product pattern.

### Recommended implementation for HORO MVP
- **Theme-safe now**
- Show preview image if available.
- Use checkbox toggle on product page.
- Keep existing add/remove behavior on cart page.
- Preserve Dawn cart quantity/remove logic.

### Recommended implementation for post-MVP
- Optional gift message via line-item properties (requires cart update JS).

### Classification
- **Theme-safe now**

---

## Summary Table

| Feature | Classification | MVP Path | Post-MVP Path |
|---|---|---|---|
| Auto-synced free-shipping threshold | Theme-safe + manual / Requires app proxy for sync | Manual setting + optional JS API fetch with fallback | App proxy returning live threshold |
| Product promo countdown | Theme-safe now | Product metafields | App-synced metafields |
| Cart savings summary | Theme-safe now | Liquid compare-at + cart discounts | No change needed |
| Dynamic bundle progress | Theme-safe + manual settings | Manual settings + cart item count | App proxy for synced config |
| One-click multi-product add-to-cart | Theme-safe now | Metafield or block references + JS multi-add | Search & Discovery integration |
| Advanced gift-wrap toggle/preview | Theme-safe now | Enhanced snippet with image + toggle | Gift message line-item properties |

## Deferred Work
- Custom checkout (explicitly excluded)
- Direct Admin API calls from browser (security violation)
- Fake discounts, countdowns, savings, reviews, stock counters (trust violation)
- Payment-method discount (requires Shopify Plus / Functions)
- Loyalty/second-order credit (requires app backend)
- Predictive Arabic fuzzy search (out of scope)
- Heavy frontend app rebuild (out of scope)
