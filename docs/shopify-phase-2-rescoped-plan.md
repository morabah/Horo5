# HORO Shopify Phase 2 — Rescoped Plan

## Why this document exists

Phase 1.9 (Advanced Incentives & Bundle UX) absorbed several features originally slated for Phase 2. This document rescopes the remaining Phase 2 work so the roadmap reflects reality and the team can prioritize correctly.

---

## 1. What Phase 1.9 absorbed from original Phase 2

| Original Phase 2 item | Status in Phase 1.9 | Notes |
|---|---|---|
| Promo countdown | ✅ **Shipped** | `product-promo-countdown.liquid` + `horo-promo-countdown.js` + metafield-driven |
| Advanced cross-sell / pair-with | ✅ **Shipped** | `product-pair-with.liquid` + `horo-pair-with.js` + metafield/block-driven |
| Advanced gift-wrap toggle/preview | ✅ **Shipped** | Enhanced `gift-wrap-upsell.liquid` with image preview, toggle UI, safe remove |
| Dynamic bundle progress | ✅ **Shipped** | `cart-bundle-nudge.liquid` upgraded from static to dynamic with item counting |
| Cart savings summary | ✅ **Shipped** | `cart-savings-summary.liquid` using real Shopify `cart.total_discount` + compare-at |
| Incentive localization | ✅ **Shipped** | `horo.incentives.*` keys in both `en.default.json` and `ar.json` |
| Free-shipping API sync architecture | ✅ **Shipped** | `horo-incentives.js` with public app-proxy fetcher + manual fallback |
| App-proxy data model | ✅ **Shipped** | `docs/shopify-incentives-data-model.md` defines two-mode architecture |
| Admin setup guides | ✅ **Shipped** | Complete guides for every incentive feature |

**Result:** Original Phase 2 has been significantly narrowed. The remaining items are brand depth and retention features, not core commerce incentives.

---

## 2. What original Phase 2 items remain

| Item | Original Plan | Complexity |
|---|---|---|
| Wishlist | Custom JS + localStorage or Swym app | Medium |
| Artist pages | Artist metaobject + template + PDP links | High |
| Drops/events | Drop metaobject + scheduled publish + landing page | High |
| Recently viewed | Custom JS snippet + localStorage | Low |
| Quick view | Custom section with JS drawer | Medium |
| Reviews | Shopify Product Reviews or third-party app | Medium (app dependency) |
| Advanced search / faceted filters | Search & Discovery app | Medium (app dependency) |
| Loyalty credit | Shopify loyalty app or custom discount automation | High (app/backend dependency) |
| Complex metaobject localization | Markets Pro or Translate & Adapt | Medium |
| Proof strip / Seen on you / wearer stories | Tagged media + custom section | Medium |
| First drop circle | Homepage editorial section | Low |

---

## 3. Which remaining items are still worth doing

### Must-have before launch (MVP-complete)

| Item | Why | Effort |
|---|---|---|
| **Arabic/RTL QA** | Bilingual is a guiding principle; partial Arabic coverage is not acceptable for launch | Medium |
| **Product data + metafields** | Without feeling/occasion/artist metafields, the theme cannot render PDP story, artist card, or collection hubs | High |
| **Gift wrap product** | Already built in theme but requires a real Shopify product with image and price | Low |
| **Discounts (free shipping + bundle)** | Theme shows progress bars but they are meaningless without matching Admin discounts | Low |

### Should-have shortly after launch (Phase 2A-D)

| Item | Why | Effort |
|---|---|---|
| **Artist pages** | HORO brand is artist-led; missing artist pages is a significant brand gap vs. web-next | High |
| **Drop metaobject + landing page** | HORO's drop model is core to brand identity and FOMO marketing | High |
| **First drop circle** | Homepage editorial feature — signals brand depth at first impression | Low |
| **Recently viewed** | Low-effort retention feature, common ecommerce expectation | Low |
| **Real reviews** | Social proof is essential, but only meaningful after ~50 orders | Medium |

### Nice-to-have / data-dependent (Phase 2E or later)

| Item | Why | Effort |
|---|---|---|
| **Wishlist** | Engagement feature; less critical when traffic is low | Medium |
| **Advanced search / faceted filters** | Only valuable when catalog > 50 products; Dawn search handles basics | Medium |
| **Quick view** | Convenience feature; most mobile users go to PDP anyway | Medium |
| **Loyalty credit** | Requires order volume and backend infrastructure | High |
| **Proof strip / wearer stories** | Requires real customer content; cannot fake | Medium |
| **Predictive Arabic fuzzy search** | Out of scope per safety rules | — |

---

## 4. Which should be deferred until after launch

| Item | Defer reason | Revisit trigger |
|---|---|---|
| **Wishlist** | Low conversion impact at low traffic; requires persistent storage | > 1,000 monthly sessions |
| **Quick view** | Most traffic is mobile; quick view is desktop-centric | Merchant request or analytics showing high desktop browse-to-PDP dropoff |
| **Loyalty credit** | Requires order history, backend, and app infrastructure | > 100 repeat customers |
| **Advanced search / faceted filters** | Dawn search + collections handle basic discovery; faceted search needs catalog scale | > 100 products or high search bounce rate |
| **Proof strip / wearer stories** | Requires real customer-generated content and photo rights | 10+ real customer photos with permission |
| **Complex metaobject localization** | Translate & Adapt handles strings; full entity translation is premium | Markets Pro subscription or > 20% Arabic traffic |

---

## 5. Which require Shopify apps

| Item | App required | Alternative |
|---|---|---|
| **Reviews** | Shopify Product Reviews (free) or Judge.me / Yotpo | Defer until orders exist |
| **Advanced search / faceted filters** | Shopify Search & Discovery (free, native) | Use Dawn collection filters + basic search |
| **Wishlist** | Swym (paid) or custom JS + localStorage | Custom localStorage wishlist (no app) |
| **Loyalty credit** | Smile.io, Loyalty Lion, or Shopify Functions custom app | Discount codes communicated manually |
| **Complex metaobject localization** | Shopify Markets Pro or Weglot | Translate & Adapt (free native) for strings only |

**App-free path:** Artist pages, drops, recently viewed, first drop circle, and basic wishlist can all be built with Liquid + metaobjects + localStorage without installing paid apps.

---

## 6. Which can be done with Liquid/CSS/JS only

| Item | Tech stack | Notes |
|---|---|---|
| **Artist pages** | Liquid metaobject template + CSS + PDP link snippet | No app needed |
| **Drop landing page** | Liquid metaobject template + CSS + scheduled publish logic | No app needed |
| **First drop circle** | Custom homepage section (Liquid + CSS) | No app needed |
| **Recently viewed** | `localStorage` JS snippet + Liquid section | No app needed |
| **Basic wishlist** | `localStorage` JS + heart toggle + wishlist page section | No app needed |
| **Proof strip** | Custom section reading tagged product media | No app needed |
| **Arabic/RTL QA** | CSS logical properties + locale keys | No app needed |

---

## 7. Which require Shopify Admin setup

| Item | Admin work required |
|---|---|
| **Product data + metafields** | Define metafield definitions; populate per product |
| **Artist metaobjects** | Create `artist` metaobject definition; populate entries |
| **Feeling/subfeeling metaobjects** | Create `feeling` and `subfeeling` metaobject definitions; populate entries |
| **Collection metafields** | Define collection-level metafields for hub pages |
| **Gift wrap product** | Create product with image and price; select in theme settings |
| **Discounts** | Create free-shipping rate and/or bundle discount in Admin |
| **Drop metaobject** | Create `drop` metaobject definition; schedule publish |
| **Reviews** | Install and configure review app; set review request flow |
| **Search & Discovery** | Install app; configure complementary products and filters |
| **Arabic/RTL** | Publish Arabic locale; translate content via Translate & Adapt |

---

## 8. Recommended new Phase 2 roadmap

### Phase 2A — Admin & Content Readiness
**Goal:** The store is launchable. Products, artists, feelings, and discounts are configured.
**Time estimate:** 1–2 weeks (content-heavy, not code-heavy)

- [ ] Create product metafield definitions in Shopify Admin (`custom.feeling_slug`, `custom.artist_slug`, `custom.story`, `custom.story_description`, `custom.fit_label`, `custom.size_table_key`, etc.)
- [ ] Create artist metaobject definition (`name`, `slug`, `style`, `avatar`, `bio`, `social_links`)
- [ ] Create feeling metaobject definition (`name`, `slug`, `blurb`, `tagline`, `accent`, `hero_image`, `card_image`)
- [ ] Create subfeeling metaobject definition (`name`, `slug`, `blurb`, `feeling_reference`, `hero_image`, `card_image`)
- [ ] Create occasion metaobject definition (`name`, `slug`, `blurb`, `accent`, `hero_image`, `is_gift_occasion`)
- [ ] Populate all metaobjects with real data (or migrate from Medusa)
- [ ] Link products to metaobjects via metafields
- [ ] Create gift wrap product with featured image and price
- [ ] Configure free-shipping shipping rate OR automatic discount
- [ ] Configure bundle discount (automatic or code)
- [ ] Populate `custom.pair_with_products` metafield on key products
- [ ] Populate `custom.promo_active` + `custom.promo_ends_at` on sale products (optional)
- [ ] Publish Arabic locale
- [ ] Arabic copy review: run through every visible `horo.*` key on a test product/cart in Arabic
- [ ] RTL visual QA: check alignment, spacing, and text direction on all new sections

**Definition of done:** A test product has story, artist, feeling, size guide, gift wrap, and pair-with companions rendering correctly in both EN and AR.

---

### Phase 2B — Artist-Led Brand Depth
**Goal:** Artist identity is visible across PDP and has dedicated pages.
**Time estimate:** 2–3 weeks

- [ ] Create `templates/page.artist.json` or `templates/metaobject.artist.json`
- [ ] Build `sections/artist-profile.liquid` (avatar, name, style, bio, social links)
- [ ] Build `sections/artist-products.liquid` (collection grid filtered by artist metafield)
- [ ] Update `sections/product-artist-card.liquid` to link to artist page
- [ ] Create artist hub page (`templates/page.artists-hub.json`) listing all artists
- [ ] Build `sections/artists-hub-grid.liquid`
- [ ] Test: every artist metaobject renders a page; every PDP artist card links correctly

**Definition of done:** Any product's artist card is clickable and leads to a full artist profile with that artist's designs.

---

### Phase 2C — Drops & Editorial Launch
**Goal:** Drop model is functional: scheduled publish, landing page, and homepage editorial.
**Time estimate:** 2–3 weeks

- [ ] Create `drop` metaobject definition (`name`, `slug`, `status`, `teaser`, `body`, `launch_at`, `hero_image`, `products` list)
- [ ] Build `templates/page.drop.json` (drop landing page)
- [ ] Build `sections/drop-hero.liquid`
- [ ] Build `sections/drop-product-grid.liquid`
- [ ] Build `sections/drop-countdown.liquid` (reuses `horo-promo-countdown.js` pattern)
- [ ] Build `sections/home-first-drop-circle.liquid` (homepage editorial block linking to active drop)
- [ ] Document scheduled publish workflow: how to set `launch_at` and use Shopify's native scheduled publishing
- [ ] Test: drop page shows countdown before launch, products appear at launch, page updates post-launch

**Definition of done:** A drop can be scheduled, its landing page shows a countdown, and at launch time the products become visible/buyable.

---

### Phase 2D — Retention Layer
**Goal:** Low-effort features that increase return visits and engagement.
**Time estimate:** 1–2 weeks

- [ ] Build `assets/horo-recently-viewed.js` (localStorage product ID tracker)
- [ ] Build `sections/recently-viewed.liquid` (reads localStorage, renders product cards)
- [ ] Add recently-viewed section to `templates/product.json` (optional, merchant-controlled)
- [ ] Build basic wishlist: heart toggle on product cards + PDP; `localStorage` persistence
- [ ] Build `templates/page.wishlist.json` + `sections/wishlist-grid.liquid`
- [ ] Document: wishlist is localStorage-only (not account-synced); will be lost on device change
- [ ] Reviews: install Shopify Product Reviews app after first 20–50 orders; configure post-purchase email
- [ ] Test: recently viewed updates across PDP visits; wishlist persists across sessions

**Definition of done:** Customer can heart products, view wishlist, and see recently viewed products. Review app is installed but not publicly visible until threshold orders reached.

---

### Phase 2E — Search & Localization Polish
**Goal:** Discovery and bilingual experience are solid.
**Time estimate:** 1 week

- [ ] Install Shopify Search & Discovery app
- [ ] Configure complementary products for key PDPs (alternative to `pair_with_products` metafield)
- [ ] Configure basic filters (price, size, feeling) on collection pages
- [ ] Review and refine all `ar.json` keys with native Arabic speaker
- [ ] Review merchant-editable section settings for Arabic text fields
- [ ] Document: no custom fuzzy search; rely on Shopify's native search + filters
- [ ] Test: search results in Arabic return expected products; filters work on mobile

**Definition of done:** Search and filters work in both EN and AR. All user-facing strings have verified Arabic translations.

---

## Summary: What changed vs. original roadmap

| Aspect | Original Phase 2 | New Phase 2 |
|---|---|---|
| Commerce incentives | Promo countdown, bundle, cross-sell, gift wrap | **Moved to Phase 1.9 — DONE** |
| Launch readiness | Not explicitly a phase | **New: Phase 2A** — Content and Admin setup |
| Artist depth | Artist pages | **Phase 2B** — Unchanged scope, clearer timeline |
| Drops | Drops/events | **Phase 2C** — Unchanged scope, clearer timeline |
| Retention | Wishlist, recently viewed, reviews, loyalty | **Phase 2D** — Loyalty deferred; reviews app-only |
| Search | Advanced search, faceted filters | **Phase 2E** — Narrowed to native Search & Discovery |
| Localization | Complex metaobject translation | **Phase 2E** — Simplified to string-level Arabic QA |

---

## Decision log

1. **Promo countdown moved to Phase 1.9:** It is an incentive feature, not a brand feature. It belongs with the other incentive work.
2. **Cross-sell moved to Phase 1.9:** It is a cart/PDP conversion feature, closely related to bundle progress and gift wrap.
3. **Loyalty credit deferred indefinitely:** Requires backend infrastructure and order volume. Not viable pre-launch.
4. **Quick view deferred:** Low impact on mobile-majority traffic. Can be added later if analytics justify it.
5. **Proof strip / wearer stories deferred:** Requires real customer content. Cannot be built before orders exist.
6. **Wishlist simplified:** localStorage-only, no app. App-based synced wishlist is a post-scale enhancement.
7. **Reviews app-based only:** Shopify Product Reviews is free and sufficient for MVP. No custom review system.

---

## Phase 2 does NOT include

- Custom checkout (still excluded)
- Admin API calls from browser (still excluded)
- Fake discounts, countdowns, savings, reviews, stock counters (still excluded)
- Payment-method discount (still excluded)
- Predictive Arabic fuzzy search (still excluded)
- Heavy frontend app rebuild (still excluded)
- Any duplication of Phase 1.9 features

---

**This is a planning document only. No implementation should begin without explicit task approval for each sub-phase (2A, 2B, 2C, 2D, 2E).**
