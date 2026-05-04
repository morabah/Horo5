# HORO Shopify — Calculation & Store Logic Parity Audit (Phase 1.6g)

## Method
Compare each Medusa/web calculation / logic area against the current Shopify Dawn + HORO implementation. Classify as: implement now (safe display-only), admin setup only, defer, or do not implement.

---

## 1. Delivery Date/Window Logic

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Delivery defaults | `store-delivery-defaults.json`: standard 3–7 days, express 2–4 days, cutoff 18:00 | `product-delivery-payment.liquid` card 4: static text only | **Partial** — Shopify has static cards; lacks configurable day ranges |
| Business-day calculation | `deliveryEstimate.ts` with Cairo timezone, weekend skipping, cutoff awareness | No equivalent | **Cannot replicate in Liquid** — requires JS/timezone logic |
| Exact date display | "Delivery by Wed, 15 May" | Not shown | **Defer** — exact dates need JS |
| Cutoff time | 18:00 Cairo time affects next-day shipping | Not modeled | **Defer** — timezone-aware logic needs JS |

**Recommendation:** Create a display-only delivery estimate section with editable day ranges. Do not calculate exact dates. Safe to implement now.

---

## 2. Shipping Rates and Estimated Shipping

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Shipping cost | Calculated at checkout by Medusa | Calculated at checkout by Shopify | **Already implemented** — Shopify checkout handles this natively |
| Rate display before checkout | Not shown (only at checkout) | Not shown (only at checkout) | **Same** — no pre-checkout rate display in either |
| COD fee | May exist as shipping option | Configured in Shopify shipping profiles | **Admin setup only** |

**Recommendation:** No theme changes. Merchant configures shipping profiles in Shopify Admin.

---

## 3. Free Shipping Threshold

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Threshold logic | Medusa Promotion with `cart.subtotal >= threshold` | Shopify shipping rate conditions or automatic discount | **Admin can configure** |
| Progress bar | Dynamic progress bar in cart/summary | No equivalent | **Safe to add** — static display using `cart.total_price`, no JS needed |
| Label | "Add 450 EGP more for free shipping" | Not shown | **Safe to add** — informational only, calculates remaining in Liquid |

**Recommendation:** Create `cart-free-shipping-progress.liquid` — disabled by default, uses `cart.total_price` math in Liquid only. Merchant must configure matching rate in Admin before enabling.

---

## 4. Bundle/AOV Discount Logic

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Bundle math | Medusa auto-promotion: buy 3+ items → 100 EGP off | Shopify Admin automatic discount or code | **Admin can configure** |
| Cart nudge | "Add 1 more to unlock 100 EGP off" | `cart-bundle-nudge.liquid` added in Phase 1.6f | **Already implemented** — informational only |
| Dynamic calculation | Cart quantity check, remaining count | Not done in theme | **Do not implement** — never calculate discount math in theme |

**Recommendation:** No new code. Bundle nudge already exists. Merchant configures discount in Admin.

---

## 5. Gift Wrap Price/Label Logic

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Gift wrap product | Real product with handle + price | Real Shopify product | **Already implemented** |
| Price display | `giftWrapPriceEgp` from incentives DTO | `_price_hint` passed as parameter | **Gap** — does not auto-show live variant price when hint is blank |
| Label | `giftWrapLabel` from metadata | `_label` passed as parameter | **Already implemented** |

**Recommendation:** Update `gift-wrap-upsell.liquid` to show `gift_wrap_variant.price | money` when `_price_hint` is blank. Safe, single-line change.

---

## 6. Payment-Method Discount

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Card discount | e.g., "Pay with Instapay / bank transfer save 3%" | Not implemented | **Do not implement yet** — requires:
  - Merchant to set up manual payment method in Admin
  - Custom checkout modification (prohibited by safety rules)
  - Or use Shopify Scripts / Functions (Shopify Plus required)

**Recommendation:** Document as deferred. If merchant wants this, use Shopify automatic discount with a code communicated at checkout, or upgrade to Plus and use Checkout Functions.

---

## 7. Size Table Presets and Fit Models

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Size tables | `size-tables-defaults.json`: regular, oversized, fitted with measurements + fit models | `page.size-guide.json` with static `size_row` blocks | **Already implemented** — manual blocks in template |
| Dynamic per-product | `custom.size_table_key` metafield selects table | Not linked to product metafield | **Gap** — could add metafield-driven dynamic size guide |
| Fit models | Height, size worn, fit note per table | Static in `page.size-guide.json` | **Already implemented** — content in blocks |

**Recommendation:** No new code. Size guide is manual but sufficient for MVP. Dynamic per-product size guide can be a future enhancement.

---

## 8. Inventory/Low-Stock Logic

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Low-stock message | `custom.low_stock_message` metafield | `product-purchase-context.liquid` renders when set | **Already implemented** |
| Live stock count | Per-variant inventory count | Shopify variant picker shows "out of stock" | **Already implemented** by Dawn |
| "Only X left" | Dynamic counter | Not shown | **Defer** — would need JS + inventory API calls |

**Recommendation:** No new code. Low-stock metafield is already wired up.

---

## 9. Restock Notification

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Notify-me form | Email input when out of stock | Not implemented | **Defer** — requires:
  - Email capture backend
  - Restock alert system (Klaviyo, Back in Stock app, or custom)

**Recommendation:** Recommend merchant installs a Shopify app (e.g., Back in Stock, Restocked) instead of custom build.

---

## 10. Search Filters/Fuzzy Suggestions

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Faceted filters | Price, size, artist, occasion, color, sort | Dawn search has basic filtering + sorting | **Already implemented** by Dawn |
| Fuzzy search | Levenshtein + synonyms | No custom fuzzy logic | **Defer** — JS-heavy rebuild of search |
| Popular searches | Static list of trending queries | Not shown | **Defer** — could add as static section later |
| Search suggestions | Autocomplete dropdown | Not implemented | **Defer** — requires JS + search index API |

**Recommendation:** No new code. Dawn search is sufficient for MVP.

---

## 11. Checkout Validation / Order Confirmation Logic

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Checkout totals | Calculated by Medusa cart/checkout | Calculated by Shopify checkout | **Already implemented** — Shopify native |
| Payment validation | Medusa payment provider | Shopify payment gateway | **Already implemented** |
| Order confirmation | Medusa order confirmation | Shopify order confirmation | **Already implemented** |
| Address validation | Basic validation | Shopify checkout validation | **Already implemented** |

**Recommendation:** No changes. Checkout is Shopify-native and must not be modified.

---

## 12. Loyalty / Second-Order Credit

| Aspect | Medusa/web | Shopify current | Assessment |
|--------|-----------|-----------------|------------|
| Second-order discount | May exist as Medusa promotion | Not implemented | **Do not implement yet** — requires:
  - Customer order history access in theme (limited in Liquid)
  - Discount automation in Admin

**Recommendation:** Defer. If needed, use Shopify customer segment + automatic discount, or a loyalty app.

---

## Summary of Recommendations

| # | Logic Area | Action | Risk |
|---|-----------|--------|------|
| 1 | Delivery estimate display | Create `horo-delivery-estimate.liquid` — configurable day ranges, no exact dates | Low |
| 2 | Free shipping progress | Create `cart-free-shipping-progress.liquid` — Liquid math only, disabled by default | Low |
| 3 | Gift wrap price auto-display | Update `gift-wrap-upsell.liquid` — show live variant price when hint blank | Low |
| 4 | Shipping rates | Document admin setup | None |
| 5 | Bundle discounts | Document admin setup (already have nudge from 1.6f) | None |
| 6 | Payment-method discount | Defer | High |
| 7 | Size tables | No change — manual blocks sufficient | None |
| 8 | Low stock | No change — metafield already wired | None |
| 9 | Restock notify | Defer — recommend app | Medium |
| 10 | Search enhancements | Defer — JS-heavy | Medium |
| 11 | Checkout | No change — Shopify native | None |
| 12 | Loyalty | Defer | Medium |
