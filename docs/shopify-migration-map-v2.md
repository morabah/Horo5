# HORO Shopify Migration Map v2

> Migrate HORO from custom Next.js + Medusa to Shopify Online Store 2.0 — **built on Dawn**, not from scratch. Reduce complexity. Ship MVP first.

---

## Guiding Principles

1. **Dawn is the base** — Preserve Dawn's product form, cart, variant picker, accessibility, and responsive image behavior. Extend, don't replace.
2. **Reduce complexity** — Do not recreate the full Medusa/Next.js system. Every custom section must justify itself against Dawn's built-in equivalent.
3. **Metaobject references, not slug lookups** — Use typed references (`metaobject_reference`, `list.metaobject_reference`, `list.product_reference`) for rendering. Slug strings are for automated collection rules only.
4. **Phased delivery** — MVP first (browse → PDP → cart → checkout). Discovery and engagement features come later.
5. **Bilingual at launch** — EN/AR structure from day one, but do not block on translating every content entity before launch.

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

## 2. Migration Map: Current → Shopify (Dawn-based)

### 2.1 Pages → Shopify Templates

| Current | Shopify Target | Dawn Equivalent | Custom Work |
|---|---|---|---|
| `/` (Home) | `templates/index.json` | Dawn homepage | Replace Dawn sections with HORO sections; keep Dawn's grid/image patterns |
| `/feelings` | `templates/page.feelings-hub.json` | — | New custom page template + `feelings-hub` section |
| `/feelings/[slug]` | `templates/collection.json` (alternate) | Dawn collection | Add `collection-feeling-hero` section; reuse Dawn product grid |
| `/feelings/[slug]/[subfeeling]` | Tag filter within feeling collection | Dawn collection filters | No new template; subfeelings as tags |
| `/occasions` | `templates/page.occasions-hub.json` | — | New custom page template + `occasions-hub` section |
| `/occasions/[slug]` | `templates/collection.json` (alternate) | Dawn collection | Add `collection-occasion-hero` section; reuse Dawn product grid |
| `/gifts` | `templates/page.gifts-hub.json` | — | Filtered occasions where `is_gift_occasion=true` |
| `/products` | `templates/collection.json` | Dawn `all` collection | Reuse Dawn collection as-is |
| `/products/[slug]` | `templates/product.json` | Dawn product | Add HORO sections (story, artist, trust strip); keep Dawn buy box + gallery |
| `/artists/[slug]` | **Phase 2** | — | — |
| `/cart` | `templates/cart.json` | Dawn cart | Reuse Dawn cart; add gift-wrap upsell snippet |
| `/checkout` | Shopify native checkout | — | No customization in Phase 1 |
| `/search` | `templates/search.json` | Dawn search | Reuse Dawn search; add feeling/occasion metaobject cards (Phase 2) |
| `/wishlist` | **Phase 2** | — | — |
| `/about` | `templates/page.about.json` | Dawn page | Custom section for brand story |
| `/faq` | `templates/page.json` | Dawn page | Dawn's collapsible content section |
| `/exchange` | `templates/page.json` | Dawn page | Standard page |
| `/size-guide` | PDP section | — | Inline on PDP, not a separate page |
| `/privacy`, `/terms` | Shopify built-in policies | — | Configure in Admin |

### 2.2 Homepage Sections → Dawn + Custom Sections

| Current | Shopify Section | Strategy |
|---|---|---|
| `hero` | `home-hero` (custom) | Replace Dawn hero; full-bleed image + "Wear What You Mean" |
| `trust_ribbon` | `home-trust-ribbon` (custom) | Simple icon strip; data from section schema settings |
| `primary_routes` | `home-primary-routes` (custom) | 3-card nav: Feelings, Occasions, Gifts |
| `founding_drop` | Dawn `featured-collection` | Reuse Dawn's featured collection section |
| `feeling_grid` | `home-feeling-grid` (custom) | Reads `custom.feeling` metaobject list |
| `occasion_grid` | `home-occasion-grid` (custom) | Reads `custom.occasion` metaobject list |
| `gift_block` | `home-gift-block` (custom) | CTA section linking to gifts page |
| `why_horo` | Dawn `collapsible-content` or custom | 6-block value prop; Dawn's collapsible may suffice |
| `featured_piece` | Dawn `featured-product` | Reuse Dawn's featured product section |
| `artist_spotlight` | **Phase 2** | — |
| `seen_on_you` | **Phase 2** | — |
| `first_drop_circle` | **Phase 2** | — |

**Net new sections**: 6 (hero, trust-ribbon, primary-routes, feeling-grid, occasion-grid, gift-block)
**Reused Dawn sections**: 3 (featured-collection, featured-product, collapsible-content)

### 2.3 PDP Sections → Dawn + Custom Sections

| Current | Shopify Section | Strategy |
|---|---|---|
| Hero gallery | Dawn `main-product` (gallery) | **Keep Dawn's gallery** — it handles zoom, thumbnails, media types |
| Buy box | Dawn `main-product` (variant picker + add-to-cart) | **Keep Dawn's buy box** — add size-table-key metafield reading + stock hint |
| Story card | `product-story` (custom) | Reads `custom.story` + `custom.story_description` metafields |
| Artist card | `product-artist-card` (custom) | Reads `custom.artist` metaobject reference |
| Trust strip | `product-trust-strip` (custom) | Reads store metafield or section settings |
| Proof strip | **Phase 2** | — |
| Delivery/payment | `product-delivery-payment` (custom) | Reads store metafield `custom.delivery_rules` |
| Gift ready | `gift-wrap-upsell` (custom snippet) | Reads store metafield for gift-wrap product handle |
| Related products | Dawn `related-products` | **Keep Dawn's related products** — uses Shopify recommendations API |
| Cross-sell | **Phase 2** | — |
| Size guide | `product-size-guide` (custom) | Reads `custom.fit_by_size` + `custom.size_table_key` metafields |
| Share strip | Dawn `share` snippet | Reuse Dawn's share buttons |
| Reviews | **Phase 2** | — |

**Net new sections**: 5 (story, artist-card, trust-strip, delivery-payment, size-guide)
**Reused Dawn sections**: 3 (main-product, related-products, share)

---

## 3. Shopify Data Model

### 3.1 Metaobjects

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

### 3.2 Product Metafields (`custom` namespace)

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

### 3.3 Collection Metafields (`custom` namespace)

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

### 3.4 Store (Shop) Metafields (`custom` namespace)

| Key | Type | Notes |
|---|---|---|
| `trust_badges` | `json` | Default trust badge config |
| `delivery_rules` | `json` | Shipping windows and cutoffs |
| `size_tables` | `json` | Size table presets |
| `gift_wrap_product` | `product_reference` | **Typed reference** to gift-wrap product |

---

## 4. Collection Strategy

### 4.1 Automated Rules via Product Tags

Products get tags during import. Collections use automated rules.

| Collection | Handle Pattern | Automated Rule | Template |
|---|---|---|---|
| All Products | `all` | Shopify default | Dawn collection |
| Feeling: Confidence | `feeling-confidence` | Product tag = `feeling:confidence` | Collection (feeling hero) |
| Feeling: Rebellion | `feeling-rebellion` | Product tag = `feeling:rebellion` | Collection (feeling hero) |
| Occasion: Eid Gift | `occasion-eid-gift` | Product tag = `occasion:eid-gift` | Collection (occasion hero) |
| Occasion: Birthday | `occasion:birthday` | Product tag = `occasion:birthday` | Collection (occasion hero) |
| Gifts (meta) | — | Not a collection; page template reads metaobjects | Gifts hub page |

### 4.2 Subfeeling Filtering

Subfeelings are **not** separate collections. Within a feeling collection:
- Products are tagged with `line:zodiac`, `line:emotions`, etc.
- Dawn's built-in filter feature renders tag-based filters
- The `collection-subfeeling-nav` section reads the parent feeling's subfeeling metaobject entries and renders them as filter pills

### 4.3 Collection ↔ Metaobject Rendering

When a collection template renders:
1. Read `collection.metafields.custom.feeling` (or `.occasion`) — a **metaobject_reference**
2. Resolve the metaobject entry to get hero_image, blurb, accent_color, etc.
3. Render the collection hero section using that data

This avoids slug-string lookups. The reference is typed and resolved natively by Liquid.

---

## 5. Bilingual Strategy (EN/AR)

### 5.1 Structure at Launch

- Shopify Markets enabled with Arabic as alternate locale
- `locales/en.default.json` + `locales/ar.json` — all UI strings translated
- RTL CSS via Dawn's existing RTL support + `:lang(ar)` overrides for custom sections
- URL pattern: `/en/...` and `/ar/...` via Shopify Markets

### 5.2 Content Translation Tiers

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

### 5.3 RTL in Dawn

Dawn already supports RTL via `dir="rtl"` on `<html>`. Custom sections must:
- Use logical CSS properties (`margin-inline-start` not `margin-left`)
- Test on mobile (78% of Egypt e-commerce traffic is mobile)
- Test on common Egyptian devices (Samsung Galaxy A-series)

---

## 6. Payment Feasibility — Egypt

> **Checkpoint**: This section must be confirmed before code implementation begins.

### 6.1 Shopify in Egypt — Key Constraints

| Constraint | Status |
|---|---|
| **Shopify Payments** | ❌ Not available in Egypt |
| **EGP as store currency** | ✅ Supported (Shopify allows EGP for Egypt-based stores) |
| **Stripe** | ❌ Not available in Egypt |
| **Third-party gateways** | ✅ Available via Shopify's third-party provider system |

### 6.2 Available Payment Methods

| Method | Shopify Implementation | Feasibility | Notes |
|---|---|---|---|
| **COD** | Manual payment method in Shopify Admin | ✅ **Confirmed** | Enable "Cash on Delivery" under Settings → Payments → Manual payments. No app needed. Works with native checkout. |
| **Card (Visa/Mastercard)** | Third-party gateway | ✅ **Confirmed** | Options: **PayTabs** (most common for Egypt Shopify stores), **Telr**, **Fawry Pay**, **Network** (Meeza + cards). All integrate via Shopify's third-party payment provider system. PayTabs is the most widely used and has direct Shopify integration. |
| **Fawry** | Third-party gateway | ✅ **Confirmed** | Fawry Pay integrates as a third-party provider. Supports cards + Fawry wallet. Popular with Egyptian consumers. |
| **Instapay** | Manual payment method | ⚠️ **Workaround** | Instapay is not a Shopify payment provider. Implement as "Bank transfer (Instapay)" manual payment method. Customer selects it at checkout, then completes transfer outside Shopify. Order confirmation email includes Instapay instructions and payout account details. Merchant marks order as paid manually after confirming receipt. |
| **Meeza cards** | Via PayTabs/Network gateway | ✅ **Confirmed** | Meeza (Egyptian domestic card scheme) is supported by PayTabs and Network gateways. |

### 6.3 Recommended Payment Stack (Phase 1)

| Priority | Method | Provider | Implementation |
|---|---|---|---|
| 1 | COD | Shopify manual payment | Enable in Admin → Payments |
| 2 | Card (Visa/Mastercard/Meeza) | PayTabs | Third-party gateway integration in Admin → Payments |
| 3 | Instapay | Shopify manual payment | "Bank transfer (Instapay)" with post-checkout instructions |

### 6.4 Order Confirmation for Instapay

Since Instapay requires manual bank transfer:
1. Customer selects "Bank transfer (Instapay)" at checkout
2. Shopify order confirmation email includes custom Liquid snippet with:
   - Instapay payout account details (merchant's Instapay phone/ID)
   - Transfer amount in EGP
   - Order reference number
3. Customer completes transfer via Instapay app
4. Merchant verifies transfer and marks order as paid in Shopify Admin

### 6.5 Open Questions (to confirm before implementation)

- [ ] Confirm PayTabs account setup and EGP processing fees for your merchant entity
- [ ] Confirm whether your business is registered in Egypt (required for PayTabs/Fawry KYC)
- [ ] Confirm Instapay payout account details for order confirmation snippet
- [ ] Test checkout flow end-to-end with COD + card + bank transfer on a development store

---

## 7. Gift Wrap Strategy

1. Create a product "Gift Wrap" (price: ~EGP 50), tagged `gift-wrap`, excluded from all automated collections
2. Store metafield `custom.gift_wrap_product` = `product_reference` pointing to this product
3. `snippets/gift-wrap-upsell.liquid` renders a checkbox on PDP and cart
4. On check, adds gift-wrap variant to cart via Shopify Ajax API (`/cart/add.js`)
5. Cart shows gift wrap as a normal line item — no app needed

---

## 8. Phased Implementation Plan

### Phase 1: MVP (Weeks 1–4)

**Goal**: Working Dawn-based theme. Browse → PDP → Cart → Checkout. Basic feeling/occasion collections. EN/AR structure.

#### Week 1: Fork Dawn + Config + Locales

- Fork Dawn theme into `shopify-theme/`
- `config/settings_schema.json` — Add HORO brand settings (colors, typography, trust badges, delivery rules, gift wrap product reference)
- `locales/en.default.json` — Override Dawn's English strings for HORO voice
- `locales/ar.json` — Full Arabic translations for Tier 1 strings
- `layout/theme.liquid` — Add Arabic font loading, RTL adjustments

#### Week 2: Custom Snippets + Homepage Sections

- Snippets: `feeling-card`, `occasion-card`, `trust-strip`, `artist-credit`, `gift-wrap-upsell`
- Sections: `home-hero`, `home-trust-ribbon`, `home-primary-routes`, `home-feeling-grid`, `home-occasion-grid`, `home-gift-block`
- Configure `templates/index.json` with HORO section order

#### Week 3: Collection + PDP Custom Sections

- Sections: `collection-feeling-hero`, `collection-occasion-hero`, `collection-subfeeling-nav`
- Sections: `product-story`, `product-artist-card`, `product-trust-strip`, `product-delivery-payment`, `product-size-guide`
- Configure `templates/product.json` — Keep Dawn's `main-product` + add HORO sections
- Configure collection templates — Dawn product grid + custom hero

#### Week 4: Page Templates + Gift Wrap + Polish

- Templates: `page.feelings-hub.json`, `page.occasions-hub.json`, `page.gifts-hub.json`, `page.about.json`
- Sections: `feelings-hub`, `occasions-hub`, `gifts-hub`, `about-brand`
- Gift wrap upsell snippet + cart integration
- CSS polish for mobile, RTL, HORO brand
- `config/settings_data.json` — Default settings

### Phase 2: Extended Features (Weeks 5–8)

| Feature | Implementation |
|---|---|
| Wishlist | Shopify app (e.g. Swym) or custom JS + localStorage snippet |
| Artist pages | Collection template + artist metaobject page |
| Drops/events | Metaobject `custom.drop` + scheduled publish + landing page template |
| Recently viewed | Custom JS snippet + localStorage |
| Quick view | Custom section with JS drawer |
| Advanced cross-sell | `custom.related_products` (list.product_reference) + custom section |
| Reviews | Shopify Product Reviews app (free) |
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

## 9. Theme Directory Structure (Dawn Fork)

```
shopify-theme/
├── assets/                    # Dawn base + HORO additions
│   ├── base.css               # Dawn base (modified for HORO brand)
│   ├── component-hero.css     # Custom hero styles
│   ├── component-feeling-grid.css
│   ├── component-occasion-grid.css
│   ├── component-trust-strip.css
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
│   ├── cart-main.liquid
│   ├── search-results.liquid
│   # ── HORO custom sections ──
│   ├── home-hero.liquid
│   ├── home-trust-ribbon.liquid
│   ├── home-primary-routes.liquid
│   ├── home-feeling-grid.liquid
│   ├── home-occasion-grid.liquid
│   ├── home-gift-block.liquid
│   ├── collection-feeling-hero.liquid
│   ├── collection-occasion-hero.liquid
│   ├── collection-subfeeling-nav.liquid
│   ├── product-story.liquid
│   ├── product-artist-card.liquid
│   ├── product-trust-strip.liquid
│   ├── product-delivery-payment.liquid
│   ├── product-size-guide.liquid
│   ├── feelings-hub.liquid
│   ├── occasions-hub.liquid
│   ├── gifts-hub.liquid
│   └── about-brand.liquid
├── snippets/
│   # ── Dawn snippets (kept as-is) ──
│   ├── product-card.liquid
│   ├── price.liquid
│   ├── share.liquid
│   # ── HORO custom snippets ──
│   ├── feeling-card.liquid
│   ├── occasion-card.liquid
│   ├── trust-strip.liquid
│   ├── artist-credit.liquid
│   └── gift-wrap-upsell.liquid
└── templates/
    ├── index.json             # HORO homepage section order
    ├── product.json           # Dawn main-product + HORO sections
    ├── collection.json        # Dawn grid + HORO hero (conditional)
    ├── page.feelings-hub.json
    ├── page.occasions-hub.json
    ├── page.gifts-hub.json
    ├── page.about.json
    ├── cart.json              # Dawn cart + gift wrap upsell
    ├── search.json            # Dawn search
    └── 404.json               # Dawn 404
```

**Net new files**: ~25 (6 snippets, 18 sections, 1 layout modification, locale files, CSS additions)
**Reused Dawn files**: ~40+ (all Dawn sections, snippets, templates, assets kept as base)

---

## 10. Data Migration Checklist

### Pre-Migration

- [ ] Export all products from Medusa (CSV or API)
- [ ] Export custom module data (feelings, subfeelings, occasions, artists)
- [ ] Export product metadata (all `metadata.*` fields)
- [ ] Map Medusa product handles → Shopify product handles
- [ ] Map Medusa variant IDs → Shopify variant IDs
- [ ] Prepare product tags: `feeling:{slug}`, `occasion:{slug}`, `line:{slug}`

### Shopify Setup

- [ ] Create Shopify store (Egypt region, EGP currency)
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
- [ ] Create collections (automated rules based on tags)
- [ ] Set collection metafields (feeling/occasion references, hero images, blurbs)
- [ ] Set product metafields (feeling/occasion/artist references, story, fit_by_size, etc.)
- [ ] Create gift-wrap product (tagged `gift-wrap`, excluded from collections)
- [ ] Set store metafields (trust_badges, delivery_rules, size_tables, gift_wrap_product)
- [ ] Configure homepage section order in theme editor

### Validation

- [ ] All products visible with correct images, prices, variants
- [ ] Feeling/occasion collections display correct products
- [ ] Metaobject-driven hero sections render correctly
- [ ] EN ↔ AR switching works on all pages
- [ ] RTL layout correct on Arabic pages (test on mobile)
- [ ] Cart → checkout → COD flow works
- [ ] Cart → checkout → card (PayTabs) flow works
- [ ] Cart → checkout → bank transfer (Instapay) flow works
- [ ] Gift wrap add-to-cart works
- [ ] Size guide renders from metafield data
- [ ] Mobile responsiveness across all templates

---

## 11. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Fork Dawn, don't build from scratch** | Dawn is Shopify's reference theme — accessible, performant, maintained. Rebuilding would recreate bugs Dawn already solved. |
| **Metaobject references over slug lookups** | Typed references are validated by Shopify, render natively in Liquid, and show as clickable links in Admin. Slug strings are fragile and require manual Liquid lookups. |
| **Tags for collection rules** | Tags are the simplest automated collection mechanism. They're visible in Admin, easy to bulk-edit, and work with Dawn's built-in filter UI. |
| **Keep Dawn's buy box + gallery** | Dawn's variant picker handles accessibility, error states, and Shopify's product form correctly. Rebuilding would risk regressions. |
| **Native checkout** | No custom checkout template. Shopify handles PCI compliance, fraud, order management. Instapay works as manual payment. |
| **Gift wrap as product** | No paid app. Simple add-to-cart flow. Works with native checkout. |
| **Phased MVP** | Ship core commerce first. Discovery and engagement features are additive and don't affect the purchase flow. |
| **Bilingual structure at launch, full translation incremental** | UI chrome is translated. Content entities (feelings, occasions) can ship in English and be translated incrementally via Shopify Markets. |
| **Subfeelings as tags, not collections** | Avoids collection sprawl. Dawn's filter UI handles tag-based filtering natively. |
| **product_reference + list.product_reference for related products** | Native Shopify product picker in Admin. Renders as clickable links. No slug resolution needed. |
