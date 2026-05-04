# HORO Shopify Remaining Gap Closure Audit

**Phase:** 1.6g–1.6k
**Date:** 2026-05-04
**Branch:** medusa

---

## 1. Homepage

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Hero | `HomeHeroWearMean` — editorial hero with CTA | `home-hero` section with heading, subheading, button | **Closed** | Low | — |
| Trust ribbon | `HomeTrustRibbon` — 5 trust badges | `horo-trust-ribbon` with 5 badges in `index.json` | **Closed** | Low | — |
| Primary routes | `HomePrimaryRoutes` — 3 route cards | `home-primary-routes` in `index.json` | **Closed** | Low | — |
| Featured products | `HomeStartHere` / founding drop grid | `featured-collection` in `index.json` | **Closed** | Low | — |
| Feeling grid | `HomeFeelingCards` | `home-feeling-grid` in `index.json` | **Closed** | Low | — |
| Occasion grid | `HomeOccasionCards` | `home-occasion-grid` in `index.json` | **Closed** | Low | — |
| Gift block | `HomeGiftBlock` | `rich-text` gift block in `index.json` | **Closed** | Low | — |
| Story plan / How it works | `HomeWhyHoro` — 3-step explanation | `horo-story-plan.liquid` exists but **NOT in `index.json`** | **Partially closed** | Low | Add to `index.json` after `primary_routes` |
| Testimonials / social proof | `HomeSeenOnYou` — UGC-style proof | `horo-testimonials.liquid` exists but **NOT in `index.json`** | **Partially closed** | Low | Add to `index.json` after `featured_collection` |
| Final CTA | Implicit in gift block | No dedicated final CTA section | **Open** | Low | Create `horo-final-cta` section, add near bottom of `index.json` |

## 2. Product page

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Product form / variant picker | Full PDP with variant selector | `main-product` with `variant_picker` block | **Closed** | Low | — |
| Add to cart | Cart add with quantity | `buy-buttons` block | **Closed** | Low | — |
| Purchase context | Trust chips near CTA | `product-purchase-context` in `product.json` | **Closed** | Low | — |
| Product story | Story section | `product-story` in `product.json` | **Closed** | Low | — |
| Artist card | Artist metaobject card | `product-artist-card` in `product.json` | **Closed** | Low | — |
| Details accordions | Materials, care, features | `product-details-accordions` in `product.json` | **Closed** | Low | — |
| Delivery & payment | Delivery/payment info cards | `product-delivery-payment` in `product.json` | **Closed** | Low | — |
| Delivery estimate | `deliveryEstimate.ts` — date-range calculation with cutoff | `horo-delivery-estimate` in `product.json` — static range, no JS date calc | **Partially closed** | Low | Static range is acceptable for Phase 1; no exact date promise |
| Size guide | Size table from metafield | `product-size-guide` in `product.json` | **Closed** | Low | — |
| Gift wrap upsell | Gift wrap toggle with live price | `product-gift-wrap-upsell` + `snippets/gift-wrap-upsell.liquid` | **Closed** | Low | Snippet already has `_variant.price | money` fallback |
| Trust strip | Bottom trust badges | `product-trust-strip` in `product.json` | **Closed** | Low | — |
| Related products | Related by feeling | `related-products` in `product.json` | **Closed** | Low | — |

## 3. Collection page

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Collection banner | Feeling/occasion hero | `main-collection-banner` + `collection-feeling-hero` / `collection-occasion-hero` | **Closed** | Low | — |
| Subfeeling nav | Subfeeling tabs | `collection-subfeeling-nav` | **Closed** | Low | — |
| Product grid | Filtered product grid | `main-collection-product-grid` | **Closed** | Low | — |
| Editorial/proof section | VibeCollection has editorial text | **Missing** — no editorial section between hero and grid | **Open** | Low | Create `collection-editorial-proof`, add to `collection.json` |
| Related feelings / other routes | Navigation to other vibes | **Missing** — no cross-route navigation | **Open** | Low | Create `collection-related-routes`, add to `collection.json` |

## 4. Feelings hub

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Feeling cards grid | `HomeFeelingCards` full page | `feelings-hub` section in `page.feelings-hub.json` | **Closed** | Low | — |
| Editorial guide | `ShopByVibe` editorial text | `feelings-editorial-guide` in `page.feelings-hub.json` | **Closed** | Low | — |

## 5. Occasions hub

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Occasion cards grid | `ShopByOccasion` grid | `occasions-hub` section in `page.occasions-hub.json` | **Closed** | Low | — |
| Editorial guide | `ShopByOccasion` has editorial text | **Missing** — no editorial section | **Open** | Low | Create `occasions-editorial-guide`, add to `page.occasions-hub.json` |

## 6. Gifts hub

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Gift occasion cards | `ShopByOccasion` filtered for gifts | `gifts-hub` section in `page.gifts-hub.json` | **Closed** | Low | — |
| Editorial guide | Gift-specific editorial text | **Missing** — no editorial section | **Open** | Low | Create `gifts-editorial-guide`, add to `page.gifts-hub.json` |

## 7. Cart

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Cart items | Full cart with quantity/remove | `main-cart-items` | **Closed** | Low | — |
| Cart footer | Subtotal + checkout buttons | `main-cart-footer` | **Closed** | Low | — |
| Gift wrap upsell | Gift wrap add in cart | `cart-gift-wrap-upsell` in `cart.json` | **Closed** | Low | — |
| Trust explainer | Quick info strip | `cart-trust-explainer` in `cart.json` | **Closed** | Low | — |
| Bundle nudge | Bundle upsell message | `cart-bundle-nudge` in `cart.json` (disabled by default) | **Closed** | Low | — |
| Free shipping progress | Progress bar from incentives API | `cart-free-shipping-progress` in `cart.json` (disabled by default) | **Closed** | Low | — |

## 8. Search

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Basic search | Meilisearch with instant results | Dawn `main-search` with predictive search | **Closed** | Low | — |
| Support/recovery links | Search page has suggestion links | `search-support-links` in `search.json` | **Partially closed** | Low | Add popular searches text block and "Shop all" link |
| Popular searches | Search suggestions (Zodiac, Cancer, etc.) | **Missing** — no popular search terms | **Open** | Low | Add optional popular_searches setting to `search-support-links` |

## 9. Calculation/display logic

| Aspect | Custom Medusa/web | Shopify current | Gap status | Risk | Recommendation |
|--------|-------------------|-----------------|------------|------|----------------|
| Delivery estimate | `deliveryEstimate.ts` — exact date range with Egypt timezone, business-day calc, cutoff | `horo-delivery-estimate` — static configurable range (3–7 / 2–4 days), no JS | **Partially closed** | Low | Static range is safe for Phase 1. No exact date promise. Defer JS date calc. |
| Free shipping threshold | `incentives.ts` — reads from Medusa Promotion rules, auto-updates | `cart-free-shipping-progress` — merchant-configured threshold, no API integration | **Partially closed** | Low | Merchant must manually keep threshold in sync with Shopify shipping settings. Document this. |
| Gift wrap live price | `incentives.ts` — reads gift wrap variant price from Medusa | `gift-wrap-upsell.liquid` — already has `_variant.price \| money` fallback when `price_hint` is blank | **Closed** | Low | — |

## 10. Data readiness

| Aspect | Status | Risk | Recommendation |
|--------|--------|------|----------------|
| Product data (title, variants, price, images) | **Unknown** — depends on Admin setup | Medium | Verify via checklist |
| Product metafields (feeling, story, artist, etc.) | **Unknown** — metafield definitions may not be created | Medium | Create definitions + populate |
| Metaobjects (artist, feeling, subfeeling, occasion, size_table) | **Unknown** — metaobject definitions may not be created | Medium | Create definitions + populate |
| Collections (all, feeling-zodiac, etc.) | **Unknown** | Medium | Verify via checklist |
| Navigation (main menu, footer) | **Unknown** | Medium | Verify via checklist |
| Content images (hero, route cards, etc.) | **Unknown** | Medium | Verify via checklist |

---

## Summary

| Status | Count |
|--------|-------|
| Closed | 22 |
| Partially closed | 5 |
| Open | 5 |

### Open gaps (implement now):
1. Final homepage CTA section → `horo-final-cta`
2. Collection editorial proof section → `collection-editorial-proof`
3. Collection related routes section → `collection-related-routes`
4. Occasions editorial guide section → `occasions-editorial-guide`
5. Gifts editorial guide section → `gifts-editorial-guide`

### Partially closed gaps (complete now):
1. Story plan not in `index.json` → add section entry
2. Testimonials not in `index.json` → add section entry
3. Search support links missing popular searches → add setting
4. Delivery estimate — static only (acceptable, defer JS date calc)
5. Free shipping threshold — manual sync (acceptable, document)

### Intentionally deferred:
- Exact delivery date calculation (requires JS, timezone logic)
- Dynamic free-shipping threshold from Shopify API (not available in Liquid)
- Predictive/fuzzy search
- Arabic fuzzy search
- Quick view, sticky mobile CTA, recently viewed, loyalty credits
