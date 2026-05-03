# HORO Shopify Migration Map v2.1

> Migrate HORO from custom Next.js + Medusa to Shopify Online Store 2.0 — **built on Dawn**, not from scratch. Reduce complexity. Ship MVP first.

---

## Guiding Principles

1. **Dawn is the base** — Preserve Dawn's product form, cart, gallery, variant picker, filters, accessibility, and responsive image behavior. Extend, don't replace.
2. **Reduce complexity** — Do not recreate the full Medusa/Next.js system. Every custom section must justify itself against Dawn's built-in equivalent. If Dawn does it acceptably, use Dawn.
3. **Metaobject references, not slug lookups** — Use typed references (`metaobject_reference`, `list.metaobject_reference`, `list.product_reference`) for rendering. Slug strings are for automated collection rules only.
4. **Phased delivery** — MVP first (browse → PDP → cart → checkout). Discovery and engagement features come later.
5. **Bilingual at launch** — EN/AR structure from day one, but do not block on translating every content entity before launch.
6. **Verify before building** — Payment feasibility and store setup must be confirmed in Shopify Admin before writing theme code.

---

## 1. Current Feature Inventory (Condensed)

### Pages

| Route | Component | Purpose |
|---|---|---|
| `/` | `Home` | Configurable homepage sections |
| `/feelings` | `ShopByFeeling` | Feelings hub grid |
| `/feelings/[slug]` | `FeelingCollection` | Products by feeling + subfeeling lines |
| `/feelings/[slug]/[subfeeling]` | `FeelingCollection` | Sub-line within a feeling |
| `/occasions` | `ShopByOccasion` | Occasions hub grid |
| `/occasions/[slug]` | `OccasionCollection` | Products by occasion |
| `/gifts` | `ShopByOccasion` (gift mode) | Gift-filtered occasions |
| `/products` | `ShopAll` | All products, sort/filter/facets |
| `/products/[slug]` | `ProductDetail` | PDP: gallery, buy box, story, artist, related |
| `/artists/[slug]` | Artist page | Artist + products |
| `/cart` | `Cart` | Cart with shipping, gift wrap, promos |
| `/checkout` | `Checkout` | COD, card (Paymob), Instapay |
| `/search` | `Search` | Full-text + facets + suggestions |
| `/wishlist` | `Wishlist` | localStorage wishlist |
| `/about`, `/faq`, `/exchange`, `/privacy`, `/terms` | Static pages | Brand info + policies |
| `/size-guide` | `SizeGuide` | Size tables |

### Data Entities (Medusa Custom Modules)

| Entity | Source | Key Fields |
|---|---|---|
| Feeling | Product categories under `feelings` root | name, slug, blurb, tagline, accent, hero/card images, manifesto, sort_order, active |
| Subfeeling | Child categories under feeling | name, slug, blurb, feeling_slug, hero/card images, sort_order, active |
| Occasion | `storefront_occasion` table | name, slug, blurb, accent, hero/card images, is_gift_occasion, price_hint, sort_order, active |
| Artist | `storefront_artist` table | name, slug, style, avatar, design_count, active |
| Merch Event | `storefront_merch_event` table | name, slug, type, teaser, body, status, dates, images, sort_order, active |
| Homepage Section | `homepage_section` table | key, type, eyebrow, title, body, CTAs, image, accent, sort_order, active |

### Key Product Metafields (from Medusa `metadata.*`)

feeling_slug, primary_feeling_slug, subfeeling_slug, line_slug, occasion_slugs, artist_slug, decoration_type, story, story_description, fit_label, size_table_key, merchandising_badge, promo_label, promo_ends_at, promo_show_countdown, feels_like, works_for, use_case, trust_badges, garment_colors, fit_by_size (JSON), pdp_fit_models (JSON), wearer_stories (JSON), complementary_slugs, frequently_bought_with_slugs, customers_also_bought_slugs, hero_image, card_image, proof_image, launch_at, sunset_at, capsule_slugs, artwork_slug

---

## 2. Payment Feasibility Checklist — Egypt

> **BLOCKING**: This checklist must be completed and verified in Shopify Admin before any theme code is written. Every item marked "must be verified manually" requires actual Admin access or provider documentation — not assumptions.

### 2.1 Store Country and Currency

| Item | Status | Action Required |
|---|---|---|
| Shopify store registered with Egypt as store location | ⚠️ Must be verified manually | Confirm in Shopify Admin → Settings → Store details → Store location |
| EGP as store currency | ⚠️ Must be verified manually | Confirm in Shopify Admin → Settings → Store currency. EGP is listed as supported for Egypt-region stores but must be selected during setup. |
| Shopify Payments available for Egypt | ❌ Not available | Egypt is not on the [Shopify Payments supported countries list](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries). A third-party gateway is required for card payments. |

### 2.2 COD (Cash on Delivery)

| Item | Status | Action Required |
|---|---|---|
| COD as Shopify manual payment method | ⚠️ Must be verified manually | Go to Admin → Settings → Payments → Manual payments → Add "Cash on Delivery". Confirm it appears at checkout. |
| COD test order placed and completed | ⚠️ Must be verified manually | Place a test order with COD. Confirm order appears in Admin with "Payment pending" status. |
| COD checkout flow works with native Shopify checkout | ⚠️ Must be verified manually | Verify COD option renders correctly in native checkout for EGP store. |

### 2.3 Card Gateway (PayTabs or Selected Provider)

| Item | Status | Action Required |
|---|---|---|
| PayTabs (or chosen gateway) has a Shopify integration | ⚠️ Must be verified manually | Check Shopify Admin → Settings → Payments → Third-party providers for available gateways in Egypt. Verify PayTabs appears. If not, check Telr, Fawry Pay, Network as alternatives. |
| PayTabs account approved for your merchant entity | ⚠️ Must be verified manually | Apply for PayTabs merchant account. Requires Egyptian business registration (commercial register + tax card). Confirm approval and EGP processing capability. |
| EGP processing and settlement confirmed | ⚠️ Must be verified manually | Confirm with PayTabs: (a) transactions settle in EGP, (b) settlement cycle (typically T+3 to T+5), (c) transaction fees for EGP card processing. |
| Card test transaction processed | ⚠️ Must be verified manually | Process a test Visa/Mastercard transaction through PayTabs on the Shopify dev store. Confirm it appears in both Shopify Admin and PayTabs dashboard. |
| Fawry/Meeza support if needed | ⚠️ Must be verified manually | Confirm with PayTabs (or chosen gateway) whether Fawry Pay and Meeza domestic cards are supported. These are important for Egyptian consumers but may require separate activation. |

### 2.4 Instapay (Manual Bank Transfer)

| Item | Status | Action Required |
|---|---|---|
| "Bank transfer" manual payment method available in Shopify | ⚠️ Must be verified manually | Go to Admin → Settings → Payments → Manual payments → Add "Bank transfer (Instapay)". Confirm it appears at checkout. |
| Instapay checkout wording is clear | ⚠️ Must be verified manually | Draft the customer-facing wording: "Complete your order by transferring {amount} EGP via Instapay to {merchant_phone}. Reference: {order_number}". Verify this renders correctly in the checkout and order confirmation email. |
| Instapay test order flow | ⚠️ Must be verified manually | Place a test order with "Bank transfer (Instapay)". Confirm: (a) order is created with "Payment pending" status, (b) confirmation email includes transfer instructions, (c) merchant can manually mark as paid. |

### 2.5 End-to-End Test Order Flow

| Test | Action Required |
|---|---|
| COD order: add to cart → checkout → COD → order confirmed | ⚠️ Must be verified manually |
| Card order: add to cart → checkout → PayTabs → payment captured → order confirmed | ⚠️ Must be verified manually |
| Instapay order: add to cart → checkout → bank transfer → order pending → manually mark paid | ⚠️ Must be verified manually |
| Gift wrap + COD: add product + gift wrap → checkout → COD → both line items in order | ⚠️ Must be verified manually |
| Gift wrap + card: add product + gift wrap → checkout → PayTabs → both line items in order | ⚠️ Must be verified manually |

### 2.6 Summary

| Payment Method | Implementation | Verification Status |
|---|---|---|
| COD | Shopify manual payment | ⚠️ Must be verified manually before implementation |
| Card (Visa/Mastercard/Meeza) | PayTabs or selected third-party gateway | ⚠️ Must be verified manually before implementation |
| Fawry | Via PayTabs or separate third-party gateway | ⚠️ Must be verified manually before implementation |
| Instapay | Shopify manual payment ("Bank transfer") | ⚠️ Must be verified manually before implementation |
| EGP currency | Shopify store currency setting | ⚠️ Must be verified manually before implementation |

**No theme code should be written until at least COD + one card gateway + Instapay manual payment are verified as working in Shopify Admin on a development store.**

---

## 3. Migration Map: Current → Shopify (Dawn-based)

### 3.1 Pages → Shopify Templates

| Current | Shopify Target | Dawn Equivalent | Custom Work |
|---|---|---|---|
| `/` (Home) | `templates/index.json` | Dawn homepage | Replace Dawn hero with HORO hero; keep Dawn's featured-collection, featured-product |
| `/feelings` | `templates/page.feelings-hub.json` | — | New page template + `feelings-hub` section |
| `/feelings/[slug]` | `templates/collection.json` | Dawn collection | Add `collection-feeling-hero` section; reuse Dawn product grid + filters |
| `/feelings/[slug]/[subfeeling]` | Tag filter within feeling collection | Dawn collection filters | No new template; subfeelings as tags |
| `/occasions` | `templates/page.occasions-hub.json` | — | New page template + `occasions-hub` section |
| `/occasions/[slug]` | `templates/collection.json` | Dawn collection | Add `collection-occasion-hero` section; reuse Dawn product grid |
| `/gifts` | `templates/page.gifts-hub.json` | — | Filtered occasions where `is_gift_occasion=true` |
| `/products` | `templates/collection.json` | Dawn `all` collection | Reuse Dawn collection as-is |
| `/products/[slug]` | `templates/product.json` | Dawn product | Keep Dawn buy box + gallery; add HORO sections below |
| `/artists/[slug]` | **Phase 2** | — | — |
| `/cart` | `templates/cart.json` | Dawn cart | Reuse Dawn cart; add gift-wrap upsell snippet |
| `/checkout` | Shopify native checkout | — | No customization in Phase 1 |
| `/search` | `templates/search.json` | Dawn search | Reuse Dawn search as-is |
| `/wishlist` | **Phase 2** | — | — |
| `/about` | `templates/page.json` | Dawn page | Dawn's `rich-text` + `image-with-text` sections |
| `/faq` | `templates/page.json` | Dawn page | Dawn's `collapsible-content` section |
| `/exchange` | `templates/page.json` | Dawn page | Dawn's `rich-text` section |
| `/size-guide` | `templates/page.size-guide.json` | — | Separate page with size tables (also shown inline on PDP) |
| `/privacy`, `/terms` | Shopify built-in policies | — | Configure in Admin |

### 3.2 Homepage Sections — Maximize Dawn, Minimize Custom

| Current | Shopify Section | Strategy |
|---|---|---|
| `hero` | `home-hero` (custom) | Full-bleed image + "Wear What You Mean" — Dawn's hero doesn't match HORO's brand treatment |
| `trust_ribbon` | Dawn `custom-liquid` block or `home-trust-ribbon` (custom) | Try Dawn's `custom-liquid` block in Dawn hero first. If insufficient, build minimal custom section. |
| `primary_routes` | `home-primary-routes` (custom) | 3-card nav: Feelings, Occasions, Gifts — no Dawn equivalent |
| `founding_drop` | Dawn `featured-collection` | **Reuse Dawn** — no custom work |
| `feeling_grid` | `home-feeling-grid` (custom) | Reads `custom.feeling` metaobject list — no Dawn equivalent |
| `occasion_grid` | `home-occasion-grid` (custom) | Reads `custom.occasion` metaobject list — no Dawn equivalent |
| `gift_block` | Dawn `rich-text` + link | **Try Dawn first** — `rich-text` section with headline, body, and CTA button pointing to `/gifts`. If visual treatment is insufficient, build `home-gift-block` (custom). |
| `why_horo` | Dawn `collapsible-content` | **Reuse Dawn** — 6-block value prop as collapsible rows |
| `featured_piece` | Dawn `featured-product` | **Reuse Dawn** — no custom work |
| `artist_spotlight` | **Phase 2** | — |
| `seen_on_you` | **Phase 2** | — |
| `first_drop_circle` | **Phase 2** | — |

**Definite custom sections**: 4 (hero, primary-routes, feeling-grid, occasion-grid)
**Conditional custom sections**: 2 (trust-ribbon — try Dawn custom-liquid first; gift-block — try Dawn rich-text first)
**Reused Dawn sections**: 4 (featured-collection, featured-product, collapsible-content, rich-text)

### 3.3 PDP Sections — Maximize Dawn, Minimize Custom

| Current | Shopify Section | Strategy |
|---|---|---|
| Hero gallery | Dawn `main-product` (gallery) | **Keep Dawn's gallery** — handles zoom, thumbnails, media types, accessibility |
| Buy box | Dawn `main-product` (variant picker + add-to-cart) | **Keep Dawn's buy box** — handles variant selection, error states, product form |
| Story card | `product-story` (custom) | Reads `custom.story` + `custom.story_description` metafields — Dawn's `collapsible-content` could work but loses metafield binding; custom section is justified |
| Artist card | `product-artist-card` (custom) | Reads `custom.artist` metaobject reference — no Dawn equivalent |
| Trust strip | Dawn `custom-liquid` block or section settings | **Try Dawn first** — add trust-strip text as a `custom-liquid` block appended to `main-product`. If that's too hacky, build minimal `product-trust-strip` (custom). |
| Delivery/payment | `product-delivery-payment` (custom) | Reads store metafield `custom.delivery_rules` — no Dawn equivalent |
| Gift ready | `gift-wrap-upsell` (snippet) | Snippet included in PDP and cart — not a full section |
| Related products | Dawn `related-products` | **Keep Dawn** — uses Shopify recommendations API |
| Size guide (inline) | `product-size-guide` (custom) | Reads `custom.fit_by_size` + `custom.size_table_key` metafields — rendered inline on PDP AND as a separate `/pages/size-guide` page |
| Share strip | Dawn `share` snippet | **Reuse Dawn** |
| Reviews | **Phase 2** | Review app to be selected after checking current availability, cost, and Arabic support |
| Proof strip | **Phase 2** | — |
| Cross-sell | **Phase 2** | — |

**Definite custom sections**: 3 (story, artist-card, delivery-payment)
**Conditional custom sections**: 2 (trust-strip — try Dawn custom-liquid first; size-guide — custom but also shared with standalone page)
**Reused Dawn sections**: 4 (main-product, related-products, share, collapsible-content potential)

---

## 4. Shopify Data Model

### 4.1 Metaobjects

#### `custom.feeling`

| Field | Type | Notes |
|---|---|---|
| `name` | `single_line_text_field` | Display name |
| `slug` | `single_line_text_field` | URL slug (also used in collection handle + product tags) |
| `blurb` | `multi_line_text_field` | Short description |
| `tagline` | `single_line_text_field` | One-liner |
| `accent_color` | `single_line_text_field` | CSS hex color |
| `hero_image` | `file_reference` | Hero banner |
| `card_image` | `file_reference` | Card thumbnail |
| `manifesto` | `multi_line_text_field` | Feeling manifesto |
| `sort_order` | `number_integer` | Sort weight |
| `active` | `boolean` | Visibility |

#### `custom.subfeeling`

| Field | Type | Notes |
|---|---|---|
| `name` | `single_line_text_field` | Line name |
| `slug` | `single_line_text_field` | URL slug |
| `blurb` | `multi_line_text_field` | Description |
| `feeling` | `metaobject_reference` → `custom.feeling` | **Typed reference** to parent feeling |
| `hero_image` | `file_reference` | Hero image override |
| `card_image` | `file_reference` | Card image |
| `sort_order` | `number_integer` | Sort weight |
| `active` | `boolean` | Visibility |

#### `custom.occasion`

| Field | Type | Notes |
|---|---|---|
| `name` | `single_line_text_field` | Display name |
| `slug` | `single_line_text_field` | URL slug |
| `blurb` | `multi_line_text_field` | Description |
| `accent_color` | `single_line_text_field` | CSS hex color |
| `hero_image` | `file_reference` | Hero banner |
| `card_image` | `file_reference` | Card thumbnail |
| `is_gift_occasion` | `boolean` | Show on gifts hub |
| `price_hint` | `single_line_text_field` | e.g. "From EGP 650" |
| `sort_order` | `number_integer` | Sort weight |
| `active` | `boolean` | Visibility |

#### `custom.artist`

| Field | Type | Notes |
|---|---|---|
| `name` | `single_line_text_field` | Display name |
| `slug` | `single_line_text_field` | URL slug |
| `style` | `single_line_text_field` | Art style |
| `avatar_image` | `file_reference` | Profile image |
| `design_count` | `number_integer` | Number of designs |
| `active` | `boolean` | Visibility |

### 4.2 Product Metafields (`custom` namespace)

| Key | Type | Notes |
|---|---|---|
| `feeling` | `metaobject_reference` → `custom.feeling` | **Typed reference** — primary feeling |
| `subfeeling` | `metaobject_reference` → `custom.subfeeling` | **Typed reference** — primary subfeeling/line |
| `occasions` | `list.metaobject_reference` → `custom.occasion` | **Typed reference list** — associated occasions |
| `artist` | `metaobject_reference` → `custom.artist` | **Typed reference** — linked artist |
| `related_products` | `list.product_reference` | **Typed reference list** — complementary products |
| `decoration_type` | `single_line_text_field` | plain / graphic / embroidered / mixed |
| `story` | `multi_line_text_field` | Short design story |
| `story_description` | `multi_line_text_field` | Longer story for accordion |
| `fit_label` | `single_line_text_field` | "FEELING / FIT" label |
| `size_table_key` | `single_line_text_field` | Size preset key (oversized, regular) |
| `merchandising_badge` | `single_line_text_field` | "Bestseller" etc. |
| `feels_like` | `list.single_line_text_field` | Mood cues |
| `works_for` | `list.single_line_text_field` | Occasion cues |
| `use_case` | `single_line_text_field` | Merchandising cue |
| `trust_badges` | `list.single_line_text_field` | Trust signal labels |
| `garment_colors` | `list.single_line_text_field` | Tee body colors |
| `fit_by_size` | `json` | Per-size measurements |
| `hero_image` | `file_reference` | PDP hero override |
| `card_image` | `file_reference` | Card image override |
| `proof_image` | `file_reference` | Proof section image |

**Phase 2 metafields** (not needed for MVP):
`promo_label`, `promo_ends_at`, `promo_show_countdown`, `pdp_fit_models` (JSON), `wearer_stories` (JSON), `frequently_bought_with` (list.product_reference), `customers_also_bought` (list.product_reference), `launch_at`, `sunset_at`, `capsule_slugs`, `artwork_slug`

### 4.3 Collection Metafields (`custom` namespace)

| Key | Type | Notes |
|---|---|---|
| `feeling` | `metaobject_reference` → `custom.feeling` | **Typed reference** — for feeling collections |
| `occasion` | `metaobject_reference` → `custom.occasion` | **Typed reference** — for occasion collections |
| `hero_image` | `file_reference` | Collection hero override |
| `card_image` | `file_reference` | Card image |
| `accent_color` | `single_line_text_field` | CSS hex color |
| `blurb` | `multi_line_text_field` | Collection description |
| `is_gift_occasion` | `boolean` | Show on gifts hub |
| `price_hint` | `single_line_text_field` | Price range hint |

### 4.4 Store (Shop) Metafields (`custom` namespace)

| Key | Type | Notes |
|---|---|---|
| `trust_badges` | `json` | Default trust badge config |
| `delivery_rules` | `json` | Shipping windows and cutoffs |
| `size_tables` | `json` | Size table presets |
| `gift_wrap_product` | `product_reference` | **Typed reference** to gift-wrap product |

---

## 5. Collection Strategy

### 5.1 Automated Rules via Product Tags

Products get tags during import. Collections use automated rules.

| Collection | Handle Pattern | Automated Rule | Template |
|---|---|---|---|
| All Products | `all` | Shopify default | Dawn collection |
| Feeling: Confidence | `feeling-confidence` | Product tag = `feeling:confidence` | Collection (feeling hero) |
| Feeling: Rebellion | `feeling-rebellion` | Product tag = `feeling:rebellion` | Collection (feeling hero) |
| Occasion: Eid Gift | `occasion-eid-gift` | Product tag = `occasion:eid-gift` | Collection (occasion hero) |
| Occasion: Birthday | `occasion:birthday` | Product tag = `occasion:birthday` | Collection (occasion hero) |
| Gifts (meta) | — | Not a collection; page template reads metaobjects | Gifts hub page |

### 5.2 Subfeeling Filtering

Subfeelings are **not** separate collections. Within a feeling collection:
- Products are tagged with `line:zodiac`, `line:emotions`, etc.
- Dawn's built-in filter feature renders tag-based filters
- The `collection-subfeeling-nav` section reads the parent feeling's subfeeling metaobject entries and renders them as filter pills

### 5.3 Collection ↔ Metaobject Rendering

When a collection template renders:
1. Read `collection.metafields.custom.feeling` (or `.occasion`) — a **metaobject_reference**
2. Resolve the metaobject entry to get hero_image, blurb, accent_color, etc.
3. Render the collection hero section using that data

This avoids slug-string lookups. The reference is typed and resolved natively by Liquid.

---

## 6. Bilingual Strategy (EN/AR)

### 6.1 Structure at Launch

- Shopify Markets enabled with Arabic as alternate locale
- `locales/en.default.json` + `locales/ar.json` — all UI strings translated
- RTL CSS via Dawn's existing RTL support + `:lang(ar)` overrides for custom sections
- URL pattern: `/en/...` and `/ar/...` via Shopify Markets

### 6.2 Content Translation Tiers

**Tier 1 — Must be translated at launch**:
- Navigation labels
- Button text (Add to Cart, Checkout, Filter, Sort)
- Trust strip copy
- Delivery/payment card copy
- Cart/checkout UI strings
- Policy pages (exchange, privacy, terms)
- Size guide labels

**Tier 2 — Can ship in English, translate incrementally**:
- Feeling/occasion/artist metaobject names and blurbs
- Product story and story_description metafields
- Homepage section headlines and body copy
- FAQ content

**Tier 3 — Phase 2**:
- Full metaobject localization via Shopify Markets Pro
- Product-level description translation
- Search synonym expansion for Arabic

### 6.3 RTL in Dawn

Dawn already supports RTL via `dir="rtl"` on `<html>`. Custom sections must:
- Use logical CSS properties (`margin-inline-start` not `margin-left`)
- Test on mobile (78% of Egypt e-commerce traffic is mobile)
- Test on common Egyptian devices (Samsung Galaxy A-series)

---

## 7. Gift Wrap Strategy

### 7.1 Product Setup

1. Create a product "Gift Wrap" (price: ~EGP 50), tagged `gift-wrap`
2. Store metafield `custom.gift_wrap_product` = `product_reference` pointing to this product
3. Exclude from all automated collections: add a condition to every automated collection rule that excludes tag `gift-wrap`
4. Exclude from search: Shopify does not natively hide products from search by tag. Options:
   - Set the gift-wrap product status to "Draft" and only add it to cart programmatically (Ajax API works with draft products if the variant ID is known)
   - Or accept it appears in search results (low impact for a single utility product)
   - Revisit in Phase 2 if needed

### 7.2 Gift Wrap Rules

| Rule | Implementation |
|---|---|
| **Prevent duplicate gift wrap line** | Before adding via `/cart/add.js`, check `/cart.js` response for existing gift-wrap variant ID. If present, skip add and show "Gift wrap already added" message. |
| **Allow removal** | Gift wrap appears as a normal line item in Dawn's cart. Customer can remove it using Dawn's built-in quantity controls (set qty to 0 or click remove). No custom code needed. |
| **Exclude from collections/search** | Automated collection rules exclude tag `gift-wrap`. Search visibility handled per §7.1 above. |
| **Test with all payment methods** | Verify gift-wrap line item appears correctly in: COD orders, card (PayTabs) orders, Instapay (bank transfer) orders. Test that gift-wrap price is included in order total. |

### 7.3 Upsell Placement

- `snippets/gift-wrap-upsell.liquid` renders a checkbox below the add-to-cart button on PDP
- Same snippet renders in cart page as a "Add gift wrap" link
- On check/click, adds gift-wrap variant via Shopify Ajax API (`/cart/add.js`)

---

## 8. Size Guide — Dual Placement

### 8.1 Inline on PDP

- `product-size-guide` custom section reads `custom.fit_by_size` + `custom.size_table_key` metafields
- Rendered as a collapsible block within the PDP template (below buy box)
- Opens when customer clicks "Size guide" link in the variant selector area

### 8.2 Standalone Page

- `templates/page.size-guide.json` with a `size-guide-page` custom section
- Reads store metafield `custom.size_tables` for all presets (oversized, regular, etc.)
- Accessible via `/pages/size-guide` URL
- Linked from PDP size guide section and from footer navigation

---

## 9. Phased Implementation Plan

### Phase 1: MVP (Weeks 1–4)

**Goal**: Working Dawn-based theme. Browse → PDP → Cart → Checkout. Basic feeling/occasion collections. EN/AR structure. Size guide (PDP + page).

**Prerequisite**: Payment Feasibility Checklist (§2) completed and verified in Shopify Admin.

#### Week 1: Fork Dawn + Config + Locales

- Fork Dawn theme into `shopify-theme/`
- `config/settings_schema.json` — Add HORO brand settings (colors, typography, trust badges, delivery rules, gift wrap product reference)
- `locales/en.default.json` — Override Dawn's English strings for HORO voice
- `locales/ar.json` — Full Arabic translations for Tier 1 strings
- `layout/theme.liquid` — Add Arabic font loading, RTL adjustments

#### Week 2: Custom Snippets + Homepage Sections

- Snippets: `feeling-card`, `occasion-card`, `gift-wrap-upsell`
- Sections: `home-hero`, `home-primary-routes`, `home-feeling-grid`, `home-occasion-grid`
- Try Dawn `custom-liquid` for trust ribbon; build `home-trust-ribbon` only if Dawn falls short
- Try Dawn `rich-text` for gift block; build `home-gift-block` only if Dawn falls short
- Configure `templates/index.json` with HORO section order

#### Week 3: Collection + PDP Custom Sections

- Sections: `collection-feeling-hero`, `collection-occasion-hero`, `collection-subfeeling-nav`
- Sections: `product-story`, `product-artist-card`, `product-delivery-payment`, `product-size-guide`
- Try Dawn `custom-liquid` block for trust strip; build `product-trust-strip` only if Dawn falls short
- Configure `templates/product.json` — Keep Dawn's `main-product` + add HORO sections
- Configure collection templates — Dawn product grid + custom hero

#### Week 4: Page Templates + Gift Wrap + Size Guide + Polish

- Templates: `page.feelings-hub.json`, `page.occasions-hub.json`, `page.gifts-hub.json`, `page.size-guide.json`
- Sections: `feelings-hub`, `occasions-hub`, `gifts-hub`, `size-guide-page`
- Gift wrap upsell snippet + cart integration (with duplicate prevention)
- About/FAQ/Exchange pages using Dawn sections only
- CSS polish for mobile, RTL, HORO brand
- `config/settings_data.json` — Default settings

### Phase 2: Extended Features (Weeks 5–8)

| Feature | Implementation |
|---|---|
| Wishlist | Shopify app or custom JS + localStorage snippet |
| Artist pages | Collection template + artist metaobject page |
| Drops/events | Metaobject `custom.drop` + scheduled publish + landing page template |
| Recently viewed | Custom JS snippet + localStorage |
| Quick view | Custom section with JS drawer |
| Advanced cross-sell | `custom.related_products` (list.product_reference) + custom section |
| Reviews | Review app to be selected in Phase 2 after checking current availability, cost, and Arabic support |
| Promo countdown | Metafields `custom.promo_label/ends_at/show_countdown` + JS countdown |
| Advanced search | Search & Discovery app for faceted filters |
| Loyalty credit | Shopify loyalty app or custom discount automation |
| Complex metaobject localization | Shopify Markets Pro for full metaobject translation |

### Phase 3: Polish + Optimization (Weeks 9–10)

- Core Web Vitals audit (Dawn is already optimized; custom sections must not regress)
- Structured data (Product, BreadcrumbList)
- Accessibility audit (Dawn is WCAG 2.1 AA; custom sections must match)
- Instapay checkout extensibility (branded post-purchase instructions)
- WhatsApp floating button section
- PDP proof strip with tagged media
- Performance monitoring

---

## 10. Phase 1 Acceptance Criteria

> All criteria must pass before Phase 1 is considered complete.

### 10.1 Homepage

- [ ] Homepage renders with HORO hero, trust ribbon, primary routes, feeling grid, occasion grid, featured collection, and gift block
- [ ] Feeling grid reads `custom.feeling` metaobject entries and renders cards with images
- [ ] Occasion grid reads `custom.occasion` metaobject entries and renders cards with images
- [ ] All homepage sections are editable in Shopify theme editor
- [ ] Homepage loads in < 3s on mobile (3G simulation)

### 10.2 Product Page (PDP)

- [ ] Dawn's product gallery renders correctly with product media
- [ ] Dawn's variant picker (size selector) works — selecting a size updates price and availability
- [ ] Dawn's add-to-cart button works — adds correct variant to cart
- [ ] Product story section reads `custom.story` metafield and renders
- [ ] Product artist card reads `custom.artist` metaobject reference and renders artist name + avatar
- [ ] Product delivery/payment section reads store metafield `custom.delivery_rules` and renders
- [ ] Product size guide section reads `custom.fit_by_size` metafield and renders collapsible table
- [ ] Gift wrap upsell checkbox renders below add-to-cart button
- [ ] Dawn's related products section renders Shopify recommendations
- [ ] PDP loads in < 2.5s on mobile (3G simulation)

### 10.3 Collection Pages

- [ ] Feeling collection renders custom hero section with metaobject-driven image, blurb, accent color
- [ ] Occasion collection renders custom hero section with metaobject-driven image, blurb, accent color
- [ ] Dawn's product grid renders products with correct images, prices, and variant info
- [ ] Dawn's sort and filter work (sort by price, filter by tag for subfeeling lines)
- [ ] Subfeeling nav renders filter pills from `custom.subfeeling` metaobject entries
- [ ] Feelings hub page renders all active feeling metaobject entries as cards
- [ ] Occasions hub page renders all active occasion metaobject entries as cards
- [ ] Gifts hub page renders only occasions where `is_gift_occasion=true`

### 10.4 Cart

- [ ] Dawn's cart page renders correctly with line items, quantities, totals
- [ ] Gift wrap product can be added via upsell snippet
- [ ] Gift wrap cannot be added twice (duplicate prevention works)
- [ ] Gift wrap can be removed by setting quantity to 0
- [ ] Gift wrap line item does not appear in automated collections
- [ ] Cart subtotal includes gift wrap price

### 10.5 Checkout

- [ ] COD payment option appears at checkout
- [ ] Card payment option (PayTabs or selected gateway) appears at checkout
- [ ] Instapay / bank transfer option appears at checkout with clear instructions
- [ ] Test order completes successfully with each payment method
- [ ] Gift wrap line item appears in order details for all payment methods
- [ ] Order confirmation email sends for all payment methods

### 10.6 Arabic / RTL

- [ ] Switching to Arabic locale changes all Tier 1 UI strings to Arabic
- [ ] `<html>` element gets `dir="rtl"` and `lang="ar"` attributes
- [ ] Navigation renders correctly in RTL layout on mobile
- [ ] Product variant picker renders correctly in RTL
- [ ] Cart and checkout render correctly in RTL
- [ ] Custom sections (hero, feeling grid, occasion grid, story, artist card) render correctly in RTL
- [ ] Arabic font loads and renders legibly on mobile

### 10.7 Mobile

- [ ] All pages render correctly on 375px viewport (iPhone SE / Galaxy A-series)
- [ ] Touch targets are ≥ 44px on all interactive elements
- [ ] Dawn's mobile navigation drawer works
- [ ] Product gallery swipe works on mobile
- [ ] No horizontal scroll on any page
- [ ] Images use responsive srcset (Dawn handles this natively)

### 10.8 Performance

- [ ] Lighthouse Performance score ≥ 70 on mobile for homepage
- [ ] Lighthouse Performance score ≥ 70 on mobile for PDP
- [ ] Largest Contentful Paint (LCP) < 4s on mobile
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] No custom JavaScript blocks rendering (Dawn's JS is deferred)

### 10.9 Test Product Data

- [ ] At least 5 test products imported with:
  - Correct variants (XS–XXL sizes with EGP prices)
  - Product tags for feeling, occasion, and line
  - Metafield values for `custom.feeling`, `custom.occasions`, `custom.artist`, `custom.story`, `custom.fit_by_size`
  - At least 3 product images per product
- [ ] At least 2 feeling metaobject entries with hero/card images
- [ ] At least 2 occasion metaobject entries with hero/card images
- [ ] At least 1 subfeeling metaobject entry linked to a feeling
- [ ] At least 1 artist metaobject entry with avatar image
- [ ] Gift wrap product created with correct price and tag
- [ ] At least 2 automated collections (1 feeling, 1 occasion) with correct products

---

## 11. Theme Directory Structure (Dawn Fork)

```
shopify-theme/
├── assets/                    # Dawn base + HORO additions
│   ├── base.css               # Dawn base (modified for HORO brand)
│   └── theme.js               # Dawn base (minimal additions: gift wrap, locale)
├── config/
│   ├── settings_schema.json   # Dawn base + HORO brand settings
│   └── settings_data.json     # Default HORO settings
├── layout/
│   └── theme.liquid           # Dawn base + Arabic font + RTL
├── locales/
│   ├── en.default.json        # Dawn base + HORO overrides
│   └── ar.json                # Full Arabic translations
├── sections/
│   # ── Dawn sections (kept as-is) ──
│   ├── header.liquid
│   ├── footer.liquid
│   ├── main-collection-product-grid.liquid
│   ├── main-product.liquid
│   ├── related-products.liquid
│   ├── featured-collection.liquid
│   ├── featured-product.liquid
│   ├── collapsible-content.liquid
│   ├── rich-text.liquid
│   ├── image-with-text.liquid
│   ├── cart-main.liquid
│   └── search-results.liquid
│   # ── HORO custom sections (definite) ──
│   ├── home-hero.liquid
│   ├── home-primary-routes.liquid
│   ├── home-feeling-grid.liquid
│   ├── home-occasion-grid.liquid
│   ├── collection-feeling-hero.liquid
│   ├── collection-occasion-hero.liquid
│   ├── collection-subfeeling-nav.liquid
│   ├── product-story.liquid
│   ├── product-artist-card.liquid
│   ├── product-delivery-payment.liquid
│   ├── product-size-guide.liquid
│   ├── feelings-hub.liquid
│   ├── occasions-hub.liquid
│   ├── gifts-hub.liquid
│   └── size-guide-page.liquid
│   # ── HORO custom sections (conditional — build only if Dawn falls short) ──
│   # home-trust-ribbon.liquid
│   # home-gift-block.liquid
│   # product-trust-strip.liquid
│   # about-brand.liquid
├── snippets/
│   # ── Dawn snippets (kept as-is) ──
│   ├── product-card.liquid
│   ├── price.liquid
│   └── share.liquid
│   # ── HORO custom snippets ──
│   ├── feeling-card.liquid
│   ├── occasion-card.liquid
│   └── gift-wrap-upsell.liquid
└── templates/
    ├── index.json             # HORO homepage section order
    ├── product.json           # Dawn main-product + HORO sections
    ├── collection.json        # Dawn grid + HORO hero (conditional)
    ├── page.feelings-hub.json
    ├── page.occasions-hub.json
    ├── page.gifts-hub.json
    ├── page.size-guide.json
    ├── cart.json              # Dawn cart + gift wrap upsell
    ├── search.json            # Dawn search
    └── 404.json               # Dawn 404
```

**Definite new files**: ~20 (3 snippets, 15 sections, 1 layout modification, locale files, CSS)
**Conditional new files**: ~4 (trust-ribbon, gift-block, trust-strip, about-brand — only if Dawn sections are insufficient)
**Reused Dawn files**: ~40+ (all Dawn sections, snippets, templates, assets kept as base)

---

## 12. Data Migration Checklist

### Pre-Migration

- [ ] Export all products from Medusa (CSV or API)
- [ ] Export custom module data (feelings, subfeelings, occasions, artists)
- [ ] Export product metadata (all `metadata.*` fields)
- [ ] Map Medusa product handles → Shopify product handles
- [ ] Map Medusa variant IDs → Shopify variant IDs
- [ ] Prepare product tags: `feeling:{slug}`, `occasion:{slug}`, `line:{slug}`

### Shopify Setup

- [ ] Create Shopify store (Egypt region, EGP currency)
- [ ] **Complete Payment Feasibility Checklist (§2)**
- [ ] Enable Shopify Markets for bilingual EN/AR
- [ ] Configure COD manual payment
- [ ] Configure PayTabs (or chosen card gateway) third-party provider
- [ ] Configure Instapay manual bank transfer payment
- [ ] Create metaobject definitions (feeling, subfeeling, occasion, artist)
- [ ] Create product metafield definitions (all `custom.*` fields with typed references)
- [ ] Create collection metafield definitions
- [ ] Create store metafield definitions
- [ ] Upload theme (Dawn fork)

### Data Import

- [ ] Import products via Shopify CSV (with tags for feeling/occasion/line)
- [ ] Create metaobject entries for feelings, subfeelings, occasions, artists
- [ ] Create collections (automated rules based on tags, excluding tag `gift-wrap`)
- [ ] Set collection metafields (feeling/occasion references, hero images, blurbs)
- [ ] Set product metafields (feeling/occasion/artist references, story, fit_by_size, etc.)
- [ ] Create gift-wrap product (tagged `gift-wrap`, excluded from collections)
- [ ] Set store metafields (trust_badges, delivery_rules, size_tables, gift_wrap_product)
- [ ] Configure homepage section order in theme editor

### Validation

- [ ] All Phase 1 Acceptance Criteria (§10) pass

---

## 13. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Fork Dawn, don't build from scratch** | Dawn is Shopify's reference theme — accessible, performant, maintained. Rebuilding would recreate bugs Dawn already solved. |
| **Keep Dawn's product form, cart, gallery, variant picker, filters, checkout** | These are complex, accessibility-critical components. Dawn handles edge cases, ARIA, error states, and Shopify API integration correctly. Rebuilding would risk regressions. |
| **Metaobject references over slug lookups** | Typed references are validated by Shopify, render natively in Liquid, and show as clickable links in Admin. Slug strings are fragile and require manual Liquid lookups. |
| **Tags for collection rules** | Tags are the simplest automated collection mechanism. They're visible in Admin, easy to bulk-edit, and work with Dawn's built-in filter UI. |
| **Try Dawn sections first, build custom only when Dawn falls short** | Reduces custom code, maintenance burden, and regression risk. Conditional sections are listed but only built if Dawn's equivalent is insufficient. |
| **Native checkout** | No custom checkout template. Shopify handles PCI compliance, fraud, order management. Instapay works as manual payment. |
| **Gift wrap as product with rules** | No paid app. Simple add-to-cart flow. Duplicate prevention via cart state check. Removal via Dawn's native quantity controls. Excluded from collections via tag. |
| **Phased MVP** | Ship core commerce first. Discovery and engagement features are additive and don't affect the purchase flow. |
| **Bilingual structure at launch, full translation incremental** | UI chrome is translated. Content entities (feelings, occasions) can ship in English and be translated incrementally via Shopify Markets. |
| **Subfeelings as tags, not collections** | Avoids collection sprawl. Dawn's filter UI handles tag-based filtering natively. |
| **product_reference + list.product_reference for related products** | Native Shopify product picker in Admin. Renders as clickable links. No slug resolution needed. |
| **Size guide on PDP + standalone page** | Inline on PDP for immediate context; standalone page for deep reference and footer link. Both read from the same metafield data. |
| **Payment feasibility verified before code** | Egypt's Shopify payment landscape has real constraints. Verifying in Admin prevents wasted development time on unworkable payment flows. |
| **Review app deferred to Phase 2** | Review app selection depends on current availability, cost, and Arabic support — all of which change frequently. Decide when Phase 2 begins. |
