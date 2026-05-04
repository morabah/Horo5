# HORO Shopify — Incentives & Extended Features Parity Audit (Phase 1.6f)

## Method
Compare each Medusa/web incentive feature against the current Shopify Dawn + HORO implementation. Classify as: already implemented, implemented but needs content/data, missing but safe to add now, missing but defer, or do not implement yet.

---

## 1. PDP Trust and Risk Reducers

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Trust strip (badges) | `PdpTrustStrip` with artist-made, licensed, free exchange 14d, COD | `product-trust-strip.liquid` with 5 configurable badges | **Already implemented** — defaults are cautious |
| Purchase context chips | `PDP_SCHEMA.trustStripItems` + metafield-driven | `product-purchase-context.liquid` with default fallback chips | **Implemented but needs wording cleanup** — default chip says "14-day exchange" without "terms apply" |
| WhatsApp help CTA | `custom.whatsapp_help_url` metafield | Rendered in `product-purchase-context` when metafield set | **Already implemented** |
| Low-stock urgency | `custom.low_stock_message` metafield | Rendered in `product-purchase-context` when metafield set | **Already implemented** — content depends on merchant data |
| Feeling/subfeeling pills | `custom.feeling` + `custom.subfeeling` | Rendered in `product-purchase-context` | **Already implemented** |
| Feature chips | `custom.features` metafield list | Rendered in `product-purchase-context` | **Already implemented** |

**Action:** Update default trust chip wording from "14-day exchange" to "14-day exchange — terms apply".

---

## 2. Gift Wrap and Gifting Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Gift wrap upsell in cart | `CartUpsell` with gift wrap preview image, add/remove | `cart-gift-wrap-upsell.liquid` + `gift-wrap.js` | **Already implemented** |
| Gift wrap as line item | Real product added to cart | Real Shopify product line item with deduplication | **Already implemented** |
| Gift-ready PDP messaging | Gift occasion banners, "send something with meaning" | No dedicated gifting section on PDP | **Missing but defer** — can add later with metafield-driven banner |
| Gift page | `/gifts` page with editorial intro | `page.gifts-hub.json` with metaobject grid | **Implemented but needs content** — editorial guide not added yet |

**Action:** Document gifting setup guide for merchant. No code changes needed for core gifting.

---

## 3. Bundle / AOV Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| "Add 3rd save 100 EGP" bundle | `CartUpsell` calculates remaining items, shows dynamic message with `bundle.label` and `bundle.applicationValue` | No equivalent | **Missing but safe to add now** — informational-only nudge, no automatic discount calculation |
| Free shipping threshold | `StorefrontIncentivesClient` progress bar in cart summary | No equivalent | **Defer** — requires cart JS for dynamic progress bar |
| Dynamic discount display | Live calculation in cart | No equivalent | **Do not implement yet** — never show discount promise unless checkout applies it |

**Action:** Create `cart-bundle-nudge.liquid` — static informational section, disabled by default, optional discount code text field.

---

## 4. Urgency / Stock Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Low-stock message | Metafield-driven per product | `custom.low_stock_message` in `product-purchase-context` | **Already implemented** — needs merchant to populate metafields |
| Live stock count | Real inventory per variant | Shopify shows stock status on variant picker | **Already implemented** by Dawn |
| Notify-me restock form | Email form when out of stock | No custom restock form | **Defer** — requires backend integration (Klaviyo/Back in Stock app) |
| "Only X left" counter | Dynamic per variant | Dawn does not show this by default | **Defer** — would require JS and inventory API calls |

---

## 5. Reviews / Social Proof

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Review summary | Review zone on PDP | No reviews section | **Do not implement yet** — no real review data. Use Shopify Product Reviews app or Judge.me later |
| "Popular" badges | `popular_searches`, trending indicators | No equivalent | **Do not implement yet** — would require fake claims |
| Social proof count | "X people bought this" | No equivalent | **Do not implement yet** — fake social proof |

---

## 6. Delivery / Payment Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| COD availability | Mentioned in trust strip, delivery-payment card | `product-delivery-payment.liquid` card 1 + `product-trust-strip` badge 3 | **Already implemented** |
| Bank transfer / Instapay | Mentioned as payment option | `product-delivery-payment.liquid` card 2 | **Already implemented** |
| Delivery estimate | `deliveryRules` from Medusa store metadata | `product-delivery-payment.liquid` card 4 — static text | **Implemented but needs content** — merchant should customize body text per operational reality |
| Express shipping claim | "Express shipping" in `trustSignals` | Not used in Shopify defaults | **Do not implement yet** — only claim if operationally true |

---

## 7. Search / Discovery Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Faceted filters | Price, size, artist, occasion, color, sort | Dawn search has basic filtering + sorting | **Already implemented** by Dawn |
| Search suggestions | Levenshtein fuzzy + synonyms | No custom suggestions | **Defer** — JS-heavy rebuild |
| Popular searches | `SEARCH_SCHEMA` / `searchSynonyms.ts` | No equivalent | **Defer** — would need static block or metafield |
| Zero-results recovery CTAs | Links to feelings, gifts, size guide | `search-support-links.liquid` added in Phase 1.6e | **Already implemented** |

---

## 8. Occasion / Gift Page Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Occasion editorial intro | Editorial text + CTA on occasion collection | `collection.json` uses `feeling_hero` / `occasion_hero` | **Already implemented** — needs content populated |
| Gifts hub editorial guide | Editorial text on `/gifts` | `gifts-hub.liquid` renders grid only | **Missing but defer** — similar to feelings hub guide from Phase 1.6e |
| Gift-ready copy | "Send something with meaning" | Not present | **Missing but safe to add now** — document in guide |

---

## 9. Cart Incentives

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Cart trust strip | `CART_SCHEMA.trustStripItems` | `cart-trust-explainer.liquid` added in Phase 1.6e | **Already implemented** |
| Gift wrap upsell | Dynamic with preview image | `cart-gift-wrap-upsell.liquid` | **Already implemented** |
| Bundle nudge | Dynamic "Add X more save Y EGP" | No equivalent | **Missing but safe to add now** — informational only |
| Free shipping progress | Progress bar to threshold | No equivalent | **Defer** — requires cart JS |
| Recently viewed | `RecentlyViewedStrip` | No equivalent | **Defer** — requires localStorage / JS |

---

## 10. Policy / Support Reassurance

| Incentive | Web/Medusa | Shopify current | Classification |
|-----------|-----------|-----------------|----------------|
| Exchange policy link | In footer, cart, PDP | `page.exchange-policy-horo.json` + trust badges | **Already implemented** |
| FAQ support CTA | WhatsApp CTA below FAQ accordion | `page-faq-horo.liquid` support CTA added in Phase 1.6e | **Already implemented** |
| Size guide link | In PDP, footer | `page.size-guide.json` + link in footer menu | **Already implemented** |

---

## Summary Table

| # | Incentive | Status | Action |
|---|-----------|--------|--------|
| 1 | PDP trust chip wording | Needs cleanup | Update default in `product-purchase-context` |
| 2 | Cart trust explainer | Already done (1.6e) | None |
| 3 | Cart bundle nudge | Missing, safe | Create `cart-bundle-nudge.liquid` |
| 4 | Gifting guide | Missing, safe | Create `docs/shopify-gifting-incentives-guide.md` |
| 5 | Discount setup doc | Missing, safe | Create `docs/shopify-discount-incentives-setup.md` |
| 6 | Gift-ready PDP banner | Missing, defer | Add to deferred list |
| 7 | Free shipping progress | Missing, defer | Requires cart JS |
| 8 | Reviews | Missing, do not implement | Use app later |
| 9 | Restock notify | Missing, defer | Requires backend integration |
| 10 | Search suggestions | Missing, defer | JS-heavy rebuild |
| 11 | Popular searches | Missing, defer | Needs data source |
| 12 | Recently viewed | Missing, defer | Requires localStorage |
