# HORO Shopify Migration Map

> Migrate HORO from custom Next.js + Medusa to Shopify Online Store 2.0 — bilingual EN/AR, Shopify-native Egypt payments, gift wrap as product add-on, phased MVP approach.

---

## 1. Current Feature Inventory

### 1.1 Pages & Routes

| Current Route | Component | Description |
|---|---|---|
| `/` | `Home.tsx` | Homepage with configurable sections (hero, trust ribbon, founding drop, feeling grid, gift block, etc.) |
| `/feelings` | `ShopByFeeling.tsx` | Feelings hub — grid of all active feelings with hero |
| `/feelings/[slug]` | `FeelingCollection.tsx` | Feeling collection — products filtered by feeling + optional subfeeling line |
| `/feelings/[slug]/[subfeelingSlug]` | `FeelingCollection.tsx` | Subfeeling/line collection within a feeling |
| `/occasions` | `ShopByOccasion.tsx` | Occasions hub — grid of all active occasions |
| `/occasions/[slug]` | `OccasionCollection.tsx` | Occasion collection — products filtered by occasion |
| `/gifts` | `ShopByOccasion.tsx` (mode=gifts) | Gift hub — filtered occasions where `isGiftOccasion=true` |
| `/products` | `ShopAll.tsx` | All products with sort/filter/facets |
| `/products/[slug]` | `ProductDetail.tsx` | PDP with gallery, buy box, story, artist, related, cross-sell |
| `/artists/[slug]` | Artist page | Artist profile + their products |
| `/cart` | `Cart.tsx` | Full cart with shipping estimation, gift wrap, promo codes |
| `/checkout` | `Checkout.tsx` | Custom checkout (COD, card/Paymob, Instapay) |
| `/search` | `Search.tsx` | Full-text search with facets, suggestions, feeling/occasion cards |
| `/wishlist` | `Wishlist.tsx` | Client-side wishlist (localStorage) |
| `/about` | `About.tsx` | Brand story |
| `/faq` | `FAQ.tsx` | FAQ |
| `/size-guide` | `SizeGuide.tsx` | Size tables |
| `/exchange` | `Exchange.tsx` | Exchange policy |
| `/privacy` | `Privacy.tsx` | Privacy policy |
| `/terms` | `Terms.tsx` | Terms of service |
| `/order-confirmation` | `OrderConfirmation.tsx` | Post-purchase with Instapay instructions |

### 1.2 Homepage Sections

| Section Key | Component | Description |
|---|---|---|
| `hero` | `HomeHeroWearMean` | Full-bleed hero with "Wear What You Mean" headline |
| `trust_ribbon` | `HomeTrustRibbon` | Artist-made, printed in Egypt, COD, 14-day exchange, WhatsApp |
| `primary_routes` | `HomePrimaryRoutes` | 3-pillar nav: Feelings, Occasions, Gifts |
| `founding_drop` | `HomeStartHere` | Featured product grid ("Start Here") |
| `featured_piece` | `HomeFeaturedPiece` | Single featured product spotlight |
| `feeling_grid` | `HomeFeelingCards` | Grid of feeling cards with images |
| `occasion_grid` | `HomeOccasionCards` | Grid of occasion cards |
| `gift_block` | `HomeGiftBlock` | Gift-ready CTA block |
| `why_horo` | `HomeWhyHoro` | 6-block value proposition |
| `first_drop_circle` | `HomeFirstDropCircle` | Circular visual CTA for first drop |
| `artist_spotlight` | `HomeArtistSpotlight` | Featured artist section |
| `seen_on_you` | `HomeSeenOnYou` | UGC / lifestyle grid |

### 1.3 PDP Sections

| Section | Component | Description |
|---|---|---|
| Hero gallery | `PdpHeroGallery` | Multi-image gallery with zoom |
| Buy box | `PdpBuyBox` | Size selector, add to cart, price, promo countdown, stock hints |
| Story card | `PdpStoryCard` | Design story accordion |
| Artist card | `PdpArtistCard` | Artist avatar + name + style |
| Trust strip | `PdpTrustStrip` | Artist-made, licensed art, free exchange, COD |
| Proof strip | `PdpProofStrip` | Fabric/print/wash proof images |
| Quality proof | `PdpQualityProofCard` | Quality details card |
| Delivery/payment | `PdpDeliveryPaymentCard` | Shipping windows + payment methods |
| Gift ready | `PdpGiftReadyCard` | Gift wrap upsell |
| Related products | `PdpRelatedProducts` | Same feeling / complementary products |
| Cross-sell | `CrossSellWidget` | "Style it with" / "Frequently bought together" |
| Size guide | `PdpSizeFlatDiagram` | Flat diagram with measurements |
| Share strip | `PdpShareStrip` | Social share buttons |
| Reviews zone | `PdpReviewsZone` | Placeholder for reviews |

### 1.4 Data Entities (Medusa Custom Modules)

| Entity | Medusa Module | Key Fields |
|---|---|---|
| **Feeling** | Product categories under `feelings` root | name, slug, blurb, tagline, accent, hero_image, card_image, manifesto, sort_order, active, seo_title, seo_description |
| **Subfeeling** | Child categories under feeling categories | name, slug, blurb, feeling_slug, hero_image, card_image, sort_order, active, seo_title, seo_description |
| **Occasion** | `storefront_occasion` table | name, slug, blurb, accent, hero_image, card_image, is_gift_occasion, price_hint, sort_order, active, product_handles, seo_title, seo_description |
| **Artist** | `storefront_artist` table | name, slug, style, avatar_src, design_count, active |
| **Merch Event** | `storefront_merch_event` table | name, slug, type, teaser, body, status, starts_at, ends_at, hero_image, card_image, sort_order, active, product_handles, occasion_slug |
| **Homepage Section** | `homepage_section` table | key, type, eyebrow, title, body, primary_cta, secondary_cta, image, accent, sort_order, active, payload |

### 1.5 Product Metafields (from Medusa metadata)

| Field | Source | Description |
|---|---|---|
| `feeling_slug` | `metadata.feeling_slug` / product categories | Primary feeling |
| `primary_feeling_slug` | Derived from categories | Primary feeling for browse |
| `subfeeling_slug` / `line_slug` | `metadata.line_slug` / categories | Thematic line (emotions, zodiac, fiction, career, trends) |
| `occasion_slugs` | `metadata.occasion_slugs` | Associated occasions |
| `artist_slug` | `metadata.artist_slug` | Linked artist |
| `decoration_type` | `metadata.decoration_type` | plain / graphic / embroidered / mixed |
| `story` | `metadata.story` | Short design story |
| `story_description` | `metadata.story_description` | Longer story for accordion |
| `fit_label` | `metadata.fit_label` | "FEELING / FIT" label |
| `size_table_key` | `metadata.size_table_key` | Size preset (oversized, regular) |
| `merchandising_badge` | `metadata.merchandising_badge` | "Bestseller" etc. |
| `promo_label` | `metadata.promo_label` | Campaign chip label |
| `promo_ends_at` | `metadata.promo_ends_at` | Campaign countdown deadline |
| `promo_show_countdown` | `metadata.promo_show_countdown` | Show/hide countdown |
| `feels_like` | `metadata.feels_like` | Mood cues array |
| `works_for` | `metadata.works_for` | Occasion cues array |
| `use_case` | `metadata.use_case` | Short merchandising cue |
| `trust_badges` | `metadata.trust_badges` | Trust signal labels |
| `garment_colors` | `metadata.garment_colors` | Tee body colors |
| `fit_by_size` | `metadata.fit_by_size` | Per-size measurements JSON |
| `pdp_fit_models` | `metadata.pdp_fit_models` | On-body model data JSON |
| `wearer_stories` | `metadata.wearer_stories` | Studio quotes JSON |
| `complementary_slugs` | `metadata.complementary_slugs` | "Style it with" product refs |
| `frequently_bought_with_slugs` | `metadata.frequently_bought_with_slugs` | Co-purchase product refs |
| `customers_also_bought_slugs` | `metadata.customers_also_bought_slugs` | Social-proof product refs |
| `hero_image` / `card_image` / `proof_image` | `metadata.media` | Curated images |
| `launch_at` / `sunset_at` | `metadata.launch_at` / `sunset_at` | Visibility window |
| `pdp_tag_labels` | Product categories | Category display names for PDP chips |
| `capsule_slugs` | `metadata.capsule_slugs` | Recurring capsule references |
| `artwork_slug` | `metadata.artwork_slug` | Artwork reference |
| `inventory_hint_by_size` | `metadata.inventory_hint_by_size` | Per-size FOMO hints |
| `stock_status_by_size` | Live inventory | Per-size stock status |
| `available_sizes` | `metadata.available_sizes` | Restricted size list |

### 1.6 Cart & Checkout Features

| Feature | Current Implementation |
|---|---|
| Cart context | React context + Medusa cart API |
| Gift wrap add-on | Special line item from gift-wrap product |
| Promo codes | Medusa promo codes |
| Shipping estimation | Medusa shipping options API |
| COD | Paymob / custom payment module |
| Card | Paymob card processing |
| Instapay | Custom bank transfer module |
| WhatsApp opt-in | Cart metadata |
| Loyalty credit | Cart-level discount |
| Order confirmation | Custom page with Instapay payout lines |

### 1.7 i18n / Bilingual

| Feature | Current Implementation |
|---|---|
| Locale switching | `useUiLocale` hook, `ar` / `en` |
| Dictionary | `i18n/dictionary.ts` with full EN/AR strings |
| RTL | CSS `dir="rtl"` attribute |
| URL pattern | No URL-based locale (cookie/query) |
| Localized content | `LocalizedStorefrontText = string | { en, ar }` |

---

## 2. Migration Map: Current → Shopify

### 2.1 Pages

| Current | Shopify Target | Notes |
|---|---|---|
| `/` (Home) | `templates/index.json` | Homepage sections become Liquid sections; order controlled by JSON template |
| `/feelings` | `templates/page.feelings-hub.json` | Custom page template with `feelings-hub` section; feelings from metaobjects |
| `/feelings/[slug]` | `templates/collection.feeling.json` | Each feeling = a Shopify Collection + metaobject; template reads metaobject for hero/blurb |
| `/feelings/[slug]/[subfeeling]` | Tag filter within feeling collection | Subfeelings as tags or separate collections; nav section for line switching |
| `/occasions` | `templates/page.occasions-hub.json` | Custom page template with `occasions-hub` section |
| `/occasions/[slug]` | `templates/collection.occasion.json` | Each occasion = a Shopify Collection + metaobject |
| `/gifts` | `templates/page.gifts-hub.json` | Filtered occasions where `is_gift_occasion=true` |
| `/products` | `templates/collection.shop-all.json` | Shopify `all` collection with sort/filter |
| `/products/[slug]` | `templates/product.json` | Shopify PDP with custom sections |
| `/artists/[slug]` | `templates/collection.artist.json` | Each artist = a Shopify Collection + metaobject |
| `/cart` | `templates/cart.json` | Shopify native cart page |
| `/checkout` | Shopify native checkout | No custom checkout template; use Shopify checkout |
| `/search` | `templates/search.json` | Shopify native search + custom sections |
| `/wishlist` | Phase 2 (app or custom JS) | Not in MVP |
| `/about` | `templates/page.about.json` | Custom page template |
| `/faq` | `templates/page.faq.json` | Custom page template |
| `/size-guide` | PDP section | Inline on PDP, not a separate page |
| `/exchange` | `templates/page.exchange.json` | Policy page |
| `/privacy` | Shopify built-in policy | Or custom page template |
| `/terms` | Shopify built-in policy | Or custom page template |
| `/order-confirmation` | Shopify native | Shopify order status page; Instapay instructions via order note or post-purchase app |

### 2.2 Homepage Sections → Shopify Sections

| Current Section | Shopify Section | Data Source |
|---|---|---|
| `hero` | `sections/home-hero.liquid` | Section schema settings (image, headline, CTA) |
| `trust_ribbon` | `sections/home-trust-ribbon.liquid` | Section schema + store metafield `custom.trust_badges` |
| `primary_routes` | `sections/home-primary-routes.liquid` | Hard-coded links to /feelings, /occasions, /gifts |
| `founding_drop` | `sections/home-start-here.liquid` | Featured collection picker in schema |
| `featured_piece` | `sections/home-featured-piece.liquid` | Single product picker in schema |
| `feeling_grid` | `sections/home-feeling-grid.liquid` | Metaobject `custom.feeling` list |
| `occasion_grid` | `sections/home-occasion-grid.liquid` | Metaobject `custom.occasion` list |
| `gift_block` | `sections/home-gift-block.liquid` | Section schema settings + link to gifts page |
| `why_horo` | `sections/home-why-horo.liquid` | Section schema blocks (6 value props) |
| `first_drop_circle` | `sections/home-first-drop-circle.liquid` | Section schema (image, CTA) |
| `artist_spotlight` | `sections/home-artist-spotlight.liquid` | Metaobject `custom.artist` picker |
| `seen_on_you` | `sections/home-seen-on-you.liquid` | Section schema (image grid) |

### 2.3 PDP Sections → Shopify Sections

| Current Section | Shopify Section | Data Source |
|---|---|---|
| Hero gallery | `sections/product-gallery.liquid` | Product media + metafield `custom.hero_image` |
| Buy box | `sections/product-buy-box.liquid` | Shopify product variants + metafields for size hints, promo |
| Story card | `sections/product-story.liquid` | Metafield `custom.story` + `custom.story_description` |
| Artist card | `sections/product-artist-card.liquid` | Metaobject `custom.artist` via `custom.artist_slug` |
| Trust strip | `sections/product-trust-strip.liquid` | Store metafield `custom.trust_badges` |
| Proof strip | `sections/product-proof-strip.liquid` | Metafield `custom.proof_image` + gallery tags |
| Delivery/payment | `sections/product-delivery-payment.liquid` | Store metafield `custom.delivery_rules` |
| Gift ready | `sections/gift-wrap-upsell.liquid` | Store metafield `custom.gift_wrap_product_handle` |
| Related products | `sections/product-related.liquid` | Shopify recommendations + metafield `custom.complementary_slugs` |
| Cross-sell | Part of `product-related.liquid` | Metafield `custom.frequently_bought_with_slugs` |
| Size guide | `sections/product-size-guide.liquid` | Metafield `custom.fit_by_size` + store metafield `custom.size_tables` |
| Share strip | Snippet `share-strip.liquid` | Native browser share API |
| Reviews | Phase 2 (Shopify product reviews app) | Not in MVP |

### 2.4 Cart & Checkout

| Current Feature | Shopify Target | Notes |
|---|---|---|
| Cart drawer/page | Shopify native cart page | `templates/cart.json` |
| Gift wrap add-on | Product add-on via `gift-wrap-upsell` section | Hidden gift-wrap product, added via Ajax API |
| Promo codes | Shopify native discount codes | Configure in Shopify Admin |
| Shipping estimation | Shopify native | Auto-calculated from Shopify shipping profiles |
| COD | Shopify COD payment method | Enable in Shopify Admin → Payments |
| Card (Paymob) | Shopify-supported Egypt gateway | PayTabs or Checkout.com; configure in Admin |
| Instapay | Manual payment method (Phase 1) | "Bank transfer" with instructions in order confirmation |
| WhatsApp opt-in | Cart attribute or note | Custom section in cart template |
| Order confirmation | Shopify native order status page | Add Instapay instructions via order note or post-purchase app (Phase 2) |

### 2.5 Search

| Current Feature | Shopify Target | Notes |
|---|---|---|
| Full-text search | Shopify native search | Enhanced with Search & Discovery app (Phase 2) |
| Facets (feeling, occasion, price, size) | Shopify native filters | Configure filterable metafields in Search & Discovery |
| Suggestions | Shopify predictive search | Built-in, customizable |
| Feeling/occasion cards in results | Phase 2 custom section | Not in MVP search template |

### 2.6 i18n / Bilingual

| Current Feature | Shopify Target | Notes |
|---|---|---|
| `useUiLocale` hook | Shopify Markets locale | `{{ request.locale.iso_code }}` in Liquid |
| Dictionary EN/AR | `locales/en.default.json` + `locales/ar.json` | Shopify locale files |
| RTL CSS | `dir="rtl"` on `<html>` + `:lang(ar)` CSS | Auto-set by Shopify Markets |
| LocalizedStorefrontText | Metaobject fields per locale | Shopify Markets translates metaobject entries |
| URL pattern | `/en/...` and `/ar/...` | Shopify Markets URL routing |

---

## 3. Shopify Metaobjects Proposal

### 3.1 `custom.feeling`

| Field | Type | Description |
|---|---|---|
| `name` | single_line_text_field | Display name (e.g. "Confidence") |
| `slug` | single_line_text_field | URL slug (e.g. "confidence") |
| `blurb` | multi_line_text_field | Short description |
| `tagline` | single_line_text_field | One-liner |
| `accent_color` | single_line_text_field | CSS color (e.g. "#B77A67") |
| `hero_image` | file_reference | Hero banner image |
| `card_image` | file_reference | Card thumbnail image |
| `manifesto` | multi_line_text_field | Feeling manifesto text |
| `sort_order` | number_integer | Sort weight |
| `active` | boolean | Visibility toggle |
| `seo_title` | single_line_text_field | Override meta title |
| `seo_description` | multi_line_text_field | Override meta description |

**Collection link**: Create a Shopify Collection with handle `feeling-{slug}` and metafield `custom.feeling_slug` = slug. The feeling metaobject entry is referenced by the collection template.

### 3.2 `custom.subfeeling`

| Field | Type | Description |
|---|---|---|
| `name` | single_line_text_field | Line name (e.g. "Zodiac") |
| `slug` | single_line_text_field | URL slug |
| `blurb` | multi_line_text_field | Line description |
| `feeling_slug` | single_line_text_field | Parent feeling slug (lookup key) |
| `hero_image` | file_reference | Hero image override |
| `card_image` | file_reference | Card image |
| `sort_order` | number_integer | Sort weight |
| `active` | boolean | Visibility toggle |
| `seo_title` | single_line_text_field | Override meta title |
| `seo_description` | multi_line_text_field | Override meta description |

**Collection link**: Either a sub-collection `feeling-{feeling_slug}-{subfeeling_slug}` or products tagged with `line:{subfeeling_slug}` within the parent feeling collection.

### 3.3 `custom.occasion`

| Field | Type | Description |
|---|---|---|
| `name` | single_line_text_field | Display name (e.g. "Eid Gift") |
| `slug` | single_line_text_field | URL slug |
| `blurb` | multi_line_text_field | Description |
| `accent_color` | single_line_text_field | CSS color |
| `hero_image` | file_reference | Hero banner image |
| `card_image` | file_reference | Card thumbnail |
| `is_gift_occasion` | boolean | Show on gifts hub |
| `price_hint` | single_line_text_field | Price range hint (e.g. "From EGP 650") |
| `sort_order` | number_integer | Sort weight |
| `active` | boolean | Visibility toggle |
| `seo_title` | single_line_text_field | Override meta title |
| `seo_description` | multi_line_text_field | Override meta description |

**Collection link**: Create a Shopify Collection with handle `occasion-{slug}` and metafield `custom.occasion_slug` = slug.

### 3.4 `custom.artist`

| Field | Type | Description |
|---|---|---|
| `name` | single_line_text_field | Artist display name |
| `slug` | single_line_text_field | URL slug |
| `style` | single_line_text_field | Art style description |
| `avatar_image` | file_reference | Profile image |
| `design_count` | number_integer | Number of designs |
| `active` | boolean | Visibility toggle |

**Collection link**: Create a Shopify Collection with handle `artist-{slug}` and metafield `custom.artist_slug` = slug.

### 3.5 `custom.drop` (Merch Event)

| Field | Type | Description |
|---|---|---|
| `name` | single_line_text_field | Drop/event name |
| `slug` | single_line_text_field | URL slug |
| `type` | single_line_text_field | Event type |
| `teaser` | single_line_text_field | Short teaser |
| `body` | multi_line_text_field | Full description |
| `status` | single_line_text_field | upcoming / live / ended |
| `starts_at` | single_line_text_field | ISO datetime |
| `ends_at` | single_line_text_field | ISO datetime |
| `hero_image` | file_reference | Hero banner |
| `card_image` | file_reference | Card thumbnail |
| `sort_order` | number_integer | Sort weight |
| `active` | boolean | Visibility toggle |
| `occasion_slug` | single_line_text_field | Linked occasion |

**Collection link**: Create a Shopify Collection with handle `drop-{slug}`. Phase 2 feature.

---

## 4. Shopify Product Metafields Proposal

### 4.1 Product Metafields (`custom` namespace)

| Key | Type | Description |
|---|---|---|
| `feeling_slug` | single_line_text_field | Primary feeling slug |
| `primary_feeling_slug` | single_line_text_field | Primary feeling for browse |
| `subfeeling_slug` | single_line_text_field | Primary subfeeling/line slug |
| `line_slug` | single_line_text_field | Thematic line slug |
| `occasion_slugs` | list.single_line_text_field | Associated occasion slugs |
| `artist_slug` | single_line_text_field | Linked artist slug |
| `decoration_type` | single_line_text_field | plain / graphic / embroidered / mixed |
| `story` | multi_line_text_field | Short design story |
| `story_description` | multi_line_text_field | Longer story for accordion |
| `fit_label` | single_line_text_field | "FEELING / FIT" label |
| `size_table_key` | single_line_text_field | Size preset key |
| `merchandising_badge` | single_line_text_field | "Bestseller" etc. |
| `promo_label` | single_line_text_field | Campaign chip label |
| `promo_ends_at` | single_line_text_field | ISO datetime countdown deadline |
| `promo_show_countdown` | boolean | Show/hide countdown |
| `feels_like` | list.single_line_text_field | Mood cues |
| `works_for` | list.single_line_text_field | Occasion cues |
| `use_case` | single_line_text_field | Short merchandising cue |
| `trust_badges` | list.single_line_text_field | Trust signal labels |
| `garment_colors` | list.single_line_text_field | Tee body colors |
| `fit_by_size` | json | Per-size measurements |
| `pdp_fit_models` | json | On-body model data |
| `wearer_stories` | json | Studio quotes |
| `complementary_slugs` | list.single_line_text_field | "Style it with" product handles |
| `frequently_bought_with` | list.single_line_text_field | Co-purchase product handles |
| `customers_also_bought` | list.single_line_text_field | Social-proof product handles |
| `hero_image` | file_reference | PDP hero image override |
| `card_image` | file_reference | Card image override |
| `proof_image` | file_reference | Proof section image |
| `launch_at` | single_line_text_field | ISO datetime visibility start |
| `sunset_at` | single_line_text_field | ISO datetime visibility end |
| `artwork_slug` | single_line_text_field | Artwork reference |
| `capsule_slugs` | list.single_line_text_field | Capsule references |

### 4.2 Collection Metafields (`custom` namespace)

| Key | Type | Description |
|---|---|---|
| `feeling_slug` | single_line_text_field | Linked feeling (for feeling collections) |
| `occasion_slug` | single_line_text_field | Linked occasion (for occasion collections) |
| `artist_slug` | single_line_text_field | Linked artist (for artist collections) |
| `hero_image` | file_reference | Collection hero image |
| `card_image` | file_reference | Card image |
| `accent_color` | single_line_text_field | CSS color |
| `blurb` | multi_line_text_field | Collection description |
| `is_gift_occasion` | boolean | Show on gifts hub |
| `price_hint` | single_line_text_field | Price range hint |

### 4.3 Store (Shop) Metafields (`custom` namespace)

| Key | Type | Description |
|---|---|---|
| `trust_badges` | json | Default trust badge config |
| `delivery_rules` | json | Shipping windows and cutoffs |
| `size_tables` | json | Size table presets |
| `homepage_sections` | json | Homepage section order override |
| `gift_wrap_product_handle` | single_line_text_field | Handle of the gift-wrap product |

---

## 5. Collection Strategy

### 5.1 Collection Hierarchy

```
all                          → /products (ShopAll)
feeling-confidence           → /feelings/confidence
feeling-confidence-zodiac    → /feelings/confidence/zodiac (subfeeling)
occasion-eid-gift            → /occasions/eid-gift
artist-ahmed-ali             → /artists/ahmed-ali
drop-summer-2026             → /drops/summer-2026 (Phase 2)
```

### 5.2 Collection ↔ Metaobject Linking

Each themed collection (feeling, occasion, artist) has a metafield pointing to its metaobject entry. The collection template reads the metaobject for hero image, blurb, accent color, etc.

Example flow for a feeling collection:
1. Admin creates metaobject entry `custom.feeling` with slug `confidence`
2. Admin creates collection with handle `feeling-confidence`
3. Admin sets collection metafield `custom.feeling_slug` = `confidence`
4. Template `collection.feeling.json` uses section `collection-hero` which reads the metaobject via `shop.metaobjects.custom.feeling[slug]`
5. Products are added to the collection manually or via automated rules (tag `feeling:confidence`)

### 5.3 Automated Collection Rules

| Collection | Rule | Type |
|---|---|---|
| `feeling-*` | Product tag = `feeling:{slug}` | Automated |
| `occasion-*` | Product tag = `occasion:{slug}` | Automated |
| `artist-*` | Product tag = `artist:{slug}` | Automated |
| `all` | All products | Shopify default |

Product tags to set during migration:
- `feeling:confidence`, `feeling:rebellion`, etc.
- `occasion:eid-gift`, `occasion:birthday`, etc.
- `artist:ahmed-ali`, etc.
- `line:zodiac`, `line:emotions`, etc.
- `gift-wrap` (for the gift wrap add-on product, excluded from browse)

---

## 6. Bilingual Strategy

### 6.1 Shopify Markets Setup

1. Enable Shopify Markets for Egypt (primary) and configure Arabic as alternate locale
2. Set up URL routing: `/en/...` and `/ar/...`
3. Configure market-specific payment methods

### 6.2 Locale Files

- `locales/en.default.json` — All English strings (nav, buttons, trust badges, delivery copy, size labels, etc.)
- `locales/ar.json` — All Arabic translations

Usage in Liquid:
```liquid
{{ 'sections.home_hero.title' | t }}
```

### 6.3 RTL Support

- Shopify sets `dir="rtl"` and `lang="ar"` on `<html>` automatically for Arabic locale
- CSS uses `:lang(ar)` selectors for RTL overrides:
  ```css
  :lang(ar) .nav-links { flex-direction: row-reverse; }
  ```
- Font stack includes Arabic-compatible fonts (Noto Sans Arabic, Cairo)

### 6.4 Metaobject Localization

Shopify Markets Pro supports localized metaobject entries. For each feeling/occasion/artist:
- Create separate entries per locale, or
- Use Shopify's native translation API for metaobject fields

---

## 7. Payment Strategy

### 7.1 Phase 1

| Method | Shopify Implementation |
|---|---|
| **COD** | Enable "Cash on Delivery" in Shopify Admin → Payments → Manual payments |
| **Card** | Configure Shopify-supported Egypt gateway (PayTabs or Checkout.com) in Admin |
| **Instapay** | Add as "Bank transfer" manual payment method with instructions in order confirmation email |

### 7.2 Phase 2 (if needed)

- Evaluate Shopify checkout extensibility for branded Instapay flow
- Consider Shopify Flow for post-purchase Instapay instruction automation

---

## 8. Gift Wrap Strategy

1. Create a hidden product "Gift Wrap" (not visible in collections, tagged `gift-wrap`)
2. Set store metafield `custom.gift_wrap_product_handle` = `gift-wrap`
3. `sections/gift-wrap-upsell.liquid` reads the metafield, shows "Add gift wrap for +EGP X" checkbox
4. On check, adds gift-wrap product to cart via Shopify Ajax API
5. Cart template shows gift wrap as a line item

---

## 9. Phased Implementation Plan

### Phase 1: Foundation + MVP Theme (Weeks 1–4)

**Week 1: Setup + Config**
- Create `shopify-theme/` directory structure
- `config/settings_schema.json` — Brand colors, typography, trust badges, delivery rules
- `locales/en.default.json` + `locales/ar.json`
- `layout/theme.liquid` — Base layout with locale switching, RTL support

**Week 2: Core Snippets + Sections**
- Snippets: `product-card`, `feeling-card`, `occasion-card`, `breadcrumb`, `price-display`, `size-selector`, `trust-strip`, `artist-credit`, `media-gallery`
- Sections: `header`, `footer`, `home-hero`, `home-trust-ribbon`, `home-feeling-grid`, `home-occasion-grid`, `home-gift-block`

**Week 3: PDP + Collection Sections**
- Sections: `product-gallery`, `product-buy-box`, `product-story`, `product-artist-card`, `product-related`, `product-trust-strip`, `product-size-guide`, `gift-wrap-upsell`
- Sections: `collection-hero`, `collection-products`, `collection-subfeeling-nav`

**Week 4: Templates + CSS + JS**
- Templates: `index.json`, `product.json`, `collection.feeling.json`, `collection.occasion.json`, `collection.shop-all.json`, `page.feelings-hub.json`, `page.occasions-hub.json`, `page.gifts-hub.json`, `cart.json`, `search.json`, `404.json`
- CSS: `assets/base.css`, component stylesheets
- JS: `assets/theme.js` (minimal — locale switcher, mobile nav, gift wrap add-to-cart)
- `config/settings_data.json` — Default settings

### Phase 2: Extended Features (Weeks 5–8)

- Search & Discovery app integration (faceted filters)
- Wishlist (app or custom JS + localStorage)
- Artist metaobject pages
- Drop/event landing pages
- Product Quick View drawer
- Recently Viewed strip
- Cross-sell widgets (complementary, frequently bought together)
- Shopify product reviews app
- Analytics (GA4, Facebook Pixel via Shopify integrations)
- Instapay checkout extensibility (if needed)

### Phase 3: Polish + Optimization (Weeks 9–10)

- Core Web Vitals audit
- Image optimization (Shopify CDN, lazy loading, srcset)
- Structured data (Product, BreadcrumbList, Organization)
- Accessibility audit (WCAG 2.1 AA)
- Custom checkout branding (Shopify checkout extensibility)
- WhatsApp floating button section
- PDP proof strip with tagged media
- Performance monitoring

---

## 10. Data Migration Checklist

### 10.1 Pre-Migration

- [ ] Export all products from Medusa (CSV or API)
- [ ] Export all custom module data (feelings, subfeelings, occasions, artists, merch events)
- [ ] Export product metadata (all `metadata.*` fields)
- [ ] Export product images (Shopify needs URLs accessible during import)
- [ ] Map Medusa product handles → Shopify product handles
- [ ] Map Medusa variant IDs → Shopify variant IDs
- [ ] Map Medusa category handles → Shopify collection handles + tags

### 10.2 Shopify Setup

- [ ] Create Shopify store (Egypt region)
- [ ] Enable Shopify Markets for bilingual EN/AR
- [ ] Configure payment methods (COD, card gateway, manual bank transfer)
- [ ] Configure shipping zones and rates for Egypt
- [ ] Create metaobject definitions (feeling, subfeeling, occasion, artist, drop)
- [ ] Create product metafield definitions (all `custom.*` fields)
- [ ] Create collection metafield definitions
- [ ] Create store metafield definitions
- [ ] Upload theme

### 10.3 Data Import

- [ ] Import products via Shopify CSV (with tags for feeling/occasion/artist/line)
- [ ] Create metaobject entries for feelings, subfeelings, occasions, artists
- [ ] Create collections (automated rules based on tags)
- [ ] Set collection metafields (feeling_slug, occasion_slug, hero_image, etc.)
- [ ] Set product metafields (story, fit_by_size, promo_*, etc.)
- [ ] Create gift-wrap product
- [ ] Set store metafields (trust_badges, delivery_rules, size_tables, gift_wrap_product_handle)
- [ ] Configure homepage section order in theme editor

### 10.4 Post-Migration Validation

- [ ] Verify all products visible with correct images, prices, variants
- [ ] Verify feeling/occasion/artist collections display correct products
- [ ] Verify metaobject-driven hero sections render correctly
- [ ] Verify bilingual switching (EN ↔ AR) works on all pages
- [ ] Verify RTL layout on Arabic pages
- [ ] Verify cart → checkout → payment flow (COD, card, bank transfer)
- [ ] Verify gift wrap add-on works
- [ ] Verify promo countdown and pricing display
- [ ] Verify size guide renders from metafield data
- [ ] Verify mobile responsiveness across all templates
- [ ] Verify SEO meta titles and descriptions (from metafields)

---

## 11. Theme Directory Structure

```
shopify-theme/
├── assets/
│   ├── base.css
│   ├── component-product-card.css
│   ├── component-collection-hero.css
│   ├── component-buy-box.css
│   ├── component-gallery.css
│   ├── component-nav.css
│   ├── component-footer.css
│   └── theme.js
├── config/
│   ├── settings_schema.json
│   └── settings_data.json
├── layout/
│   └── theme.liquid
├── locales/
│   ├── en.default.json
│   └── ar.json
├── sections/
│   ├── header.liquid
│   ├── footer.liquid
│   ├── home-hero.liquid
│   ├── home-trust-ribbon.liquid
│   ├── home-primary-routes.liquid
│   ├── home-start-here.liquid
│   ├── home-featured-piece.liquid
│   ├── home-feeling-grid.liquid
│   ├── home-occasion-grid.liquid
│   ├── home-gift-block.liquid
│   ├── home-why-horo.liquid
│   ├── home-first-drop-circle.liquid
│   ├── home-artist-spotlight.liquid
│   ├── home-seen-on-you.liquid
│   ├── collection-hero.liquid
│   ├── collection-products.liquid
│   ├── collection-subfeeling-nav.liquid
│   ├── product-gallery.liquid
│   ├── product-buy-box.liquid
│   ├── product-story.liquid
│   ├── product-artist-card.liquid
│   ├── product-related.liquid
│   ├── product-trust-strip.liquid
│   ├── product-proof-strip.liquid
│   ├── product-delivery-payment.liquid
│   ├── product-size-guide.liquid
│   ├── gift-wrap-upsell.liquid
│   ├── feelings-hub.liquid
│   ├── occasions-hub.liquid
│   └── gifts-hub.liquid
├── snippets/
│   ├── product-card.liquid
│   ├── feeling-card.liquid
│   ├── occasion-card.liquid
│   ├── breadcrumb.liquid
│   ├── price-display.liquid
│   ├── size-selector.liquid
│   ├── trust-strip.liquid
│   ├── artist-credit.liquid
│   ├── media-gallery.liquid
│   └── share-strip.liquid
└── templates/
    ├── index.json
    ├── product.json
    ├── collection.feeling.json
    ├── collection.occasion.json
    ├── collection.artist.json
    ├── collection.shop-all.json
    ├── page.feelings-hub.json
    ├── page.occasions-hub.json
    ├── page.gifts-hub.json
    ├── page.about.json
    ├── page.faq.json
    ├── page.exchange.json
    ├── cart.json
    ├── search.json
    └── 404.json
```

---

## 12. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Metaobjects over custom app** | Feelings, occasions, artists are structured content with images — metaobjects are native, editable in Admin, queryable in Liquid, no app needed |
| **Tags for collection rules** | Simpler than metafield-based automated collections; tags are easy to bulk-edit and visible in Admin |
| **Native checkout** | Avoids Hydrogen/headless complexity; Shopify handles PCI, fraud, order management |
| **Gift wrap as product** | No paid app needed; simple add-to-cart flow; works with native checkout |
| **Phased MVP** | Ship core commerce first (browse → PDP → cart → checkout), layer discovery features second |
| **Shopify Markets for bilingual** | Native URL routing, locale files, RTL support — no third-party app needed |
| **File_reference metafields for images** | Shopify-hosted, CDN-optimized, editable in Admin media picker |
| **JSON metafields for structured data** | fit_by_size, pdp_fit_models, wearer_stories are complex nested objects — JSON is the only viable metafield type |
| **Separate collection templates** | `collection.feeling.json` vs `collection.occasion.json` allows different section layouts per collection type |
