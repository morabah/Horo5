# HORO Shopify Data Contract

Canonical source for Shopify theme metafields, metaobjects, theme settings, collection setup, and Medusa/web-next (`web-next`) alignment.

**Namespace:** `custom` on products/collections unless noted. Do not migrate to `horo` namespace without an Admin migration.

**Liquid architecture (v3):** Option A + C — component snippets for repeated markup; section-level assigns for rich text and lists. Do **not** use `{% render %}` as a shared parent-scope variable module.

**Related:** [`HORO_THEME_BASE.md`](../HORO_THEME_BASE.md) · [`METAFIELD_WIRING.md`](../METAFIELD_WIRING.md) (stub pointer only)

---

## 1. Theme settings (Shopify Admin → Theme settings)

| Setting ID | Admin type | Required | Purpose |
|------------|------------|----------|---------|
| `horo_incentives_live` | Checkbox | No (default off) | Master gate for cart free-shipping progress + bundle nudge. Enable only after matching Shopify shipping/discount rules are live and tested at checkout. |
| `horo_gift_wrap_product` | Product | For gift upsell | Single-SKU gift wrap line item |
| `horo_gift_wrap_label` | Text | No | Upsell CTA label |
| `horo_gift_wrap_price_hint` | Text | No | e.g. "+ EGP 50" |
| `horo_whatsapp_support_url` | URL | Recommended | Default size-help / support link |
| `horo_trust_badge_1` … `horo_trust_badge_5` | Text | No | Global trust copy |
| `horo_delivery_cairo` / `alex` / `other` | Text | No | Delivery estimates |
| `horo_instapay_instructions` | Text | No | Qualified Instapay copy |

---

## 2. Product metafields (`product.metafields.custom`)

### 2.1 Full field table

| Key | Shopify Admin type | Req | Used in theme | Medusa / web-next | Notes |
|-----|-------------------|-----|---------------|-------------------|-------|
| `feeling` | Metaobject → `feeling` | Yes (V1 PDP) | purchase-context, cards, analytics, collections | `primaryFeelingSlug` | Single reference |
| `subfeeling` | Metaobject → `subfeeling` | No | purchase-context, cards, analytics | `primarySubfeelingSlug` / `lineSlug` | Primary thematic line on PDP |
| `pdp_tag_labels` | List single line | No | purchase-context chips, analytics | `pdpTagLabels[]` | **Not** derived from `occasions`; Shopify equivalent of Medusa category-derived PDP tags |
| `occasions` | List metaobject → `occasion` | No | analytics | `occasionSlugs[]` | Do not use as PDP hero chips when `pdp_tag_labels` is set |
| `artist` | Metaobject → `artist` | No | artist card, cards, analytics | `artistSlug` / `artistDisplay` | |
| `artist_display` | Single line | No | artist card, cards, analytics (name fallback) | `artistDisplay.name` | Fallback when `artist` metaobject is unset: `artist.name` → `artist.display_name` → `artist_display` |
| `story` | Rich text or multi-line | No | story, accordions (fallback) | `story` | Short emotional line |
| `story_description` | Rich text or multi-line | No | story, accordions | `storyDescription` | Long body |
| `design_story` | Rich text | No | accordions | — | **Deprecated**; fallback only |
| `emotional_hook` | Single line | No | story | — | “For the one who…” |
| `wearer_story` | Rich text | No | story | — | |
| `design_prompt` | Single line | No | story | — | |
| `fit_note` | Single line | No | purchase-context, size-guide | part of `fitLabel` | |
| `fit_label` | Single line | Rec (V1.4) | purchase-context, cards | `fitLabel` | |
| `size_fit_note` | Single line | No | size-guide | — | Fit chain fallback |
| `size_table` | Metaobject → `size_table` | No | size-guide | `sizeTableKey` | Prefer over legacy `size_table_key` text |
| `materials` | Rich text | No | accordions | `physicalAttributes` | |
| `care_instructions` | Rich text | No | accordions | `careInstructions` | |
| `dimensions_note` | Rich text | No | accordions | `physicalAttributes` | |
| `shipping_returns_note` | Rich text | No | accordions | — | Override theme defaults |
| `trust_chips` | List single line | No | purchase-context, cards | `trustBadges[]` | Not via `horo-product-field` |
| `features` | List single line | No | purchase-context | — | |
| `giftable` | Boolean | No | purchase-context, cards | `giftable` | |
| `gift_occasion_tags` | List single line | No | purchase-context | `giftOccasionTags[]` | |
| `feels_like` | List single line | No | analytics | `feelsLike[]` | |
| `works_for` | List single line | No | analytics | `worksFor[]` | |
| `buyer_route` | Single line | No | analytics | `buyerRoute` | `feeling`, `moment`, `gift`, `personality`, `artist_drop`, `world` |
| `primary_audience` | Single line | No | analytics | `primaryAudience` | V1.4 allowed labels |
| `promo_label` | Single line | No | cards, promo, analytics | `promoLabel` | |
| `promo_active` | Boolean | No | promo-countdown | — | |
| `promo_starts_at` / `promo_ends_at` | Date/time | No | promo-countdown | `launchAt` / `sunsetAt` | |
| `promo_label_ar` | Single line | No | promo-countdown | — | |
| `promo_savings_egp` | Number | No | promo-countdown | — | |
| `promo_show_countdown` | Boolean | No | promo-countdown, analytics | `promoShowCountdown` | Defaults to `true` in analytics when unset |
| `merchandising_badge` | Single line | No | cards (future), analytics | `merchandisingBadge` | e.g. Bestseller, New, Limited |
| `whatsapp_help_url` | URL | No | purchase-context | — | Falls back to `settings.horo_whatsapp_support_url` |
| `complementary_products` | List product refs | No | cross-sell | `complementarySlugs[]` | Style-with / visual pairing |
| `frequently_bought_with_products` | List product refs | No | pair-with | `frequentlyBoughtWithSlugs[]` | Bundle / FBT intent |
| `customers_also_bought_products` | List product refs | No | cross-sell | `customersAlsoBoughtSlugs[]` | Social-proof recommendations |
| `pair_with_products` | List product refs | No | pair-with, cross-sell fallback | legacy pair-with | General fallback when intent-specific lists are empty |
| `stock_note` | Single line | No | analytics | `stockNote` | Scarcity line; analytics falls back to `low_stock_message` |
| `garment_colors` | List single line | No | analytics, search | `garmentColors[]` | Display color labels; else inferred from `Color` variant option |
| `available_sizes` | List single line | No | analytics, search | `availableSizes[]` | Optional override; else inferred from `Size` variant option |
| `proof_gallery` | List metaobject → `proof_item` | No | proof strip | `proofGallery` | Preferred over alt tags |
| `review_proof` | List metaobject → `ugc_proof` | No | seen-on-you | `reviewProof` | Legacy: `horo_ugc` file list |
| `low_stock_message` | Single line | No | purchase-context | — | |
| `delivery_note` | Single line | No | delivery section (product note below cards) | — | |
| `exchange_note` | Single line | No | delivery section (product note below cards) | — | |
| `launch_at` / `sunset_at` | Date/time | No | future use | — | |

### 2.2 `product.metafields.descriptors`

| Key | Admin type | Used in |
|-----|------------|---------|
| `subtitle` | Single line | `main-product` caption block (`templates/product.json`) |

### 2.3 Canonical fallback chains (do not duplicate in sections)

| Logical field | Chain |
|---------------|--------|
| Fit copy | `fit_note` → `fit_label` → `size_fit_note` |
| Design story (accordions) | `story_description` → `story` → `design_story` (deprecated) |
| WhatsApp URL | `whatsapp_help_url` → `settings.horo_whatsapp_support_url` |
| UGC gallery | `review_proof` → `horo_ugc` (legacy) |
| Artist display name | `artist.name` → `artist.display_name` → `artist_display` |
| UGC caption | `body` → `caption` |
| Feeling / occasion collection URL | `collection_url` → `collection` reference `.url` → handle convention `feeling-{slug}` / `occasion-{slug}` |

### 2.4 Cross-sell intent resolution

| Section | Metafield priority (first non-empty wins) |
|---------|-------------------------------------------|
| `product-pair-with` | `frequently_bought_with_products` → `pair_with_products` → `complementary_products` |
| `horo-cross-sell` | `customers_also_bought_products` → `complementary_products` → `pair_with_products` |

Do not merge buckets in Liquid — each web-next/Medusa intent stays separate in Admin.

### 2.5 `feelingBrowseAssignments` (multi-placement browse)

Medusa exposes multiple feeling/subfeeling placements via `feelingBrowseAssignments[]` (from categories under the feelings tree).

**Shopify equivalent:** product **collection membership**, not a metafield list.

- `custom.feeling` + `custom.subfeeling` = **primary** PDP/card/analytics identity only.
- For multi-placement products, add the product to every relevant collection, e.g.:
  - `/collections/feeling-mood`
  - `/collections/feeling-mood-calm`
  - `/collections/feeling-zodiac`
- Collection membership controls browse eligibility; metafields control hero chips and analytics primary slugs.

### 2.6 `physicalAttributes` (limitations)

Medusa builds `physicalAttributes` from product/variant shipping fields (weight, dimensions, HS code, MID, origin, material).

**Shopify theme does not mirror this as a DTO.** Use customer-facing metafields instead:

| Medusa / web-next | Shopify |
|-------------------|---------|
| `physicalAttributes.material` | `custom.materials` (accordion) |
| dimensions | `custom.dimensions_note` |
| care | `custom.care_instructions` |
| weight (shipping) | Native Shopify variant weight only — do not show HS/MID/origin on PDP unless you add explicit metafields and copy |

### 2.7 Analytics payload (`horo-product-analytics-json.liquid`)

Emits `window.HoroCurrentProductData` with `| json` on every value. Key parity fields:

| Field | Source |
|-------|--------|
| `lineSlug` | `subfeeling` slug (same as Medusa `lineSlug` / `primarySubfeelingSlug`) |
| `pdpTagLabels` | `custom.pdp_tag_labels` |
| `promoStartsAt` / `promoEndsAt` | `custom.promo_starts_at` / `promo_ends_at` |
| `promoShowCountdown` | `custom.promo_show_countdown` (default `true` when blank) |
| `merchandisingBadge` | `custom.merchandising_badge` |
| `stockNote` | `custom.stock_note` → `custom.low_stock_message` |
| `garmentColors` | `custom.garment_colors` → `Color` option values |
| `availableSizes` | `custom.available_sizes` → in-stock variant `Size` values (not all defined option values) |
| `occasionSlugs` / `occasionLabels` | `custom.occasions` metaobject list |
| `inventoryTracked` / `inventoryQuantity` | selected variant; `null` quantity when not Shopify-tracked |
| `frequentlyBoughtWithProductHandles` / `complementaryProductHandles` / `customersAlsoBoughtProductHandles` | respective product-list metafields |

### 2.8 `horo-product-field.liquid` (scalar only)

Allowed `field` keys only:

`fit_label`, `buyer_route`, `primary_audience`, `promo_label`, `low_stock_message`, `feeling_title`, `feeling_slug`, `subfeeling_title`, `subfeeling_slug`, `artist_name`

Rich text and lists must be read in sections or dedicated snippets — not through this helper.

**Example:**

```liquid
{% capture fit_label %}{% render 'horo-product-field', product: product, field: 'fit_label' %}{% endcapture %}
```

---

## 3. Metaobject definitions

### 3.1 `feeling`

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `title` | Single line | Yes | Cards, heroes, hubs |
| `name` | Single line | No | Fallback for `title` |
| `slug` / `handle` | Single line | Yes | URLs `feeling-{slug}` |
| `active` | Boolean | Yes | Hub grids filter |
| `sort_order` | Integer | No | Hub + subfeeling nav ordering |
| `tagline` | Single line | No | Collection hero |
| `description` / `blurb` | Multi-line | No | Cards, hero |
| `manifesto` | Multi-line | No | Collection hero teaser |
| `card_image` | File | Rec | Cards |
| `hero_image` | File | No | PLP hero |
| `accent_color` | Color | No | Hero accent bar |
| `collection` | Collection ref | Rec | URL when `collection_url` is blank |
| `collection_url` | URL | No | Overrides `collection` reference and handle convention |
| `seo_title` / `seo_description` | Single line | No | SEO |

**Example entries:** `mood`, `zodiac`, `career`, `fiction`, `trends` → collections `feeling-mood`, `feeling-zodiac`, …

### 3.2 `subfeeling`

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `title` | Single line | Yes | Nav pills |
| `slug` | Single line | Yes | `feeling-{parent}-{slug}` |
| `active` | Boolean | Yes | Nav filter |
| `sort_order` | Integer | No | Nav order (ascending) |
| `parent_feeling` | Metaobject → `feeling` | Yes | Nav grouping |
| `feeling_slug` | Single line | No | Legacy parent key |
| `collection_url` | URL | Rec | Nav link |
| `filter_url` | URL | No | Search/collection filter link |
| `description` / `blurb` | Multi-line | No | |
| `card_image` / `hero_image` | File | No | |

**Example:** `feeling-mood-joy`, `feeling-zodiac-aries`

### 3.3 `occasion`

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `title` | Single line | Yes | Cards, heroes |
| `slug` | Single line | Yes | `occasion-{slug}` |
| `active` | Boolean | Yes | Hubs |
| `sort_order` | Integer | No | Hub order |
| `description` / `blurb` | Multi-line | No | |
| `tagline` | Single line | No | Hero |
| `card_image` / `hero_image` | File | No | |
| `accent_color` | Color | No | |
| `collection` | Collection ref | Rec | URL when `collection_url` is blank |
| `collection_url` | URL | No | Overrides `collection` reference and handle convention |
| `is_gift_occasion` | Boolean | No | Gift flows |
| `price_hint` | Single line | No | Occasion hero |

### 3.4 `artist`

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `name` | Single line | Yes | PDP artist card |
| `display_name` | Single line | No | Fallback |
| `style` | Single line | No | Artist card |
| `bio` | Multi-line text | No | Artist card (`escape`; not rich text) |
| `avatar` | File | No | |
| `portfolio_url` | URL | No | |
| `active` | Boolean | No | Spotlight |
| `design_count` | Integer | No | Display only |

### 3.5 `size_table`

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `title` | Single line | Yes | Admin label |
| `rows` | JSON | No | Structured table in `product-size-guide` when `rows` is non-empty |
| `content` | Rich text | No | Fallback RTE block when `rows` is empty |

**`rows` JSON shape** (array of objects; theme reads `size_label` with fallback to `size`):

```json
[
  {
    "size_label": "S",
    "chest": "50 cm",
    "length": "68 cm",
    "shoulder": "45 cm",
    "sleeve": "21 cm"
  },
  {
    "size_label": "M",
    "size": "M",
    "chest": "52 cm",
    "length": "70 cm",
    "shoulder": "46 cm",
    "sleeve": "22 cm"
  }
]
```

Column keys used by the theme: `size_label` (or `size`), `chest`, `length`, `shoulder`, `sleeve`. Missing keys render as empty cells.

### 3.6 `proof_item` (metaobject type for `proof_gallery` list)

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `image` | File | Yes | Proof strip — **only** this field is passed to `image_url` |
| `tag` | Single line | Rec | `proof_fabric`, `proof_print`, `proof_wash`, `lifestyle`, `flat_lay` |
| `label` | Single line | No | Short label under image |
| `caption` | Single line | No | Longer caption below label |
| `sort_order` | Integer | No | Display order |

### 3.7 `ugc_proof` (entries in `review_proof` list)

| Field | Admin type | Req | Theme usage |
|-------|------------|-----|-------------|
| `product` | Product ref | No | Filter global entries |
| `image` | File | Yes | Seen-on-you |
| `video_url` | URL | No | |
| `body` | Multi-line | No | Caption (`body` → `caption` fallback) |
| `rating` | Number | No | Seen-on-you meta line (optional) |
| `instagram_handle` | Single line | No | Seen-on-you meta line (optional) |
| `permission_to_repost` | Boolean | Rec | Hide when `false` (legal) |
| `ugc_type` | Single line | No | |
| `source` | Single line | No | |
| `sort_order` | Integer | No | |
| `active` | Boolean | Yes | Hide when false |

---

## 4. Collection metafields (`collection.metafields.custom`)

| Key | Admin type | Used in |
|-----|------------|---------|
| `feeling` | Metaobject → `feeling` | `collection-horo-header`, subfeeling nav |
| `occasion` | Metaobject → `occasion` | `collection-horo-header` |
| `editorial_heading` | Single line | editorial proof |
| `editorial_text` | Multi-line | editorial proof |
| `editorial_image` | File | editorial proof |

### 4.1 Collection setup (manual)

| Taxonomy | Handle pattern | Metafield |
|----------|----------------|-----------|
| Feeling | `feeling-{slug}` | `custom.feeling` → that feeling |
| Subfeeling | `feeling-{feeling}-{subfeeling}` | `custom.feeling` → parent feeling |
| Occasion | `occasion-{slug}` | `custom.occasion` → that occasion |
| All products | `all` | — |

**Rule:** Every feeling/occasion metaobject should have `collection_url` or a linked collection matching the handle pattern.

**Multi-placement products:** assign the product to all relevant feeling/subfeeling collections (see §2.5). Subfeeling nav sorts by `subfeeling.sort_order` ascending (`collection-subfeeling-nav.liquid`).

---

## 5. Hub pages (Online Store → Pages)

| Page handle | Template suffix | Sections |
|-------------|-----------------|----------|
| `feelings` | `feelings` or `feelings-hub` | feelings-hub, editorial guide, related routes |
| `occasions` | `occasions` or `occasions-hub` | occasions-hub, editorial guide, related routes |
| `gifts-hub` | `gifts-hub` | gifts-hub, editorial guide |

**Do not use** `/pages/gifts` unless you create a redirect; canonical gift hub is **`/pages/gifts-hub`**.

---

## 6. Proof strip resolution

1. If `custom.proof_gallery` (list of `proof_item`) has entries with **`image` set** → render those only.
2. Else scan `product.media` alt text (case-insensitive contains): `proof_fabric`, `proof_print`, `proof_wash`, `lifestyle`, `flat_lay`.
3. Else hide section (design mode shows placeholder).

**Never** pass a metaobject handle to `image_url` when `image` is blank.

---

## 7. Search & discovery

### 7.1 Product tags (recommended)

Add tags for meaning-first discovery:

- `feeling:mood`, `feeling:zodiac`, `feeling:career`
- `alias:stars`, `alias:symbol`, `alias:برج`
- `giftable` (when `custom.giftable` is true)

### 7.2 `data/search-synonyms.json`

Reference file for **Shopify Search & Discovery** (not read by Liquid). Import synonyms and redirects manually.

Redirects must use `/pages/gifts-hub`, not `/pages/gifts`.

### 7.3 Search UI

- `horo-search-recovery` — intent chips (EN + AR)
- `search-support-links` — quick routes; preset Gifts URL = `/pages/gifts-hub`

---

## 8. Cart & gift-wrap

- `gift-wrap.js` loads from [`snippets/cart-drawer.liquid`](../snippets/cart-drawer.liquid) on every page (not inside Ajax-replaced extras).
- Gift wrap markup renders inside [`horo-cart-drawer-extras`](../snippets/horo-cart-drawer-extras.liquid) when cart has lines.
- Duplicate prevention: same gift-wrap product handle cannot be added twice.

---

## 9. Medusa / web-next DTO quick map

| web-next / Medusa concept | Shopify |
|---------------------------|---------|
| `StorefrontProductDTO.feeling` / slugs | `custom.feeling` |
| `subfeeling` / `lineSlug` | `custom.subfeeling` |
| `pdpTagLabels[]` | `custom.pdp_tag_labels` |
| `feelingBrowseAssignments[]` | product collection membership (§2.5) |
| `occasions[]` | `custom.occasions` |
| `artist` | `custom.artist` |
| `story` / `storyDescription` | `custom.story` / `story_description` |
| `fitLabel` | fit chain |
| `trustBadges` | `custom.trust_chips` |
| `giftable` | `custom.giftable` |
| `complementarySlugs[]` | `custom.complementary_products` |
| `frequentlyBoughtWithSlugs[]` | `custom.frequently_bought_with_products` |
| `customersAlsoBoughtSlugs[]` | `custom.customers_also_bought_products` |
| legacy pair-with | `custom.pair_with_products` |
| `merchandisingBadge` / `stockNote` | `custom.merchandising_badge` / `custom.stock_note` |
| `garmentColors[]` / `availableSizes[]` | metafield or variant options |
| `promoStartsAt` / `promoEndsAt` / `promoShowCountdown` | promo timing metafields |
| `physicalAttributes` | §2.6 (partial; manual metafields only) |
| `proofGallery` | `custom.proof_gallery` |
| `reviewProof` | `custom.review_proof` |

---

## 10. Admin readiness checklist

- [ ] Create metaobject definitions: `feeling`, `subfeeling`, `occasion`, `artist`, `size_table`, `proof_item`, `ugc_proof`
- [ ] Create product metafields per §2 with correct types and **Storefront** access
- [ ] Create collection metafields per §4
- [ ] Create taxonomy collections per §4.1 and link metaobjects
- [ ] Create pages: `feelings`, `occasions`, `gifts-hub` with correct templates
- [ ] Set `horo_gift_wrap_product` in theme settings
- [ ] Configure Search & Discovery using `data/search-synonyms.json`
- [ ] Publish products with required `feeling` + `fit_label` (or fit chain)
- [ ] Set `custom.pdp_tag_labels` per product (category-style PDP chips; not occasions)
- [ ] Configure cross-sell intent lists (`frequently_bought_with_products`, `complementary_products`, `customers_also_bought_products`) where merchandised
- [ ] Add multi-placement products to all relevant feeling/subfeeling collections
- [ ] Verify EN/AR in theme editor
- [ ] Test checkout: COD, shipping, discounts match PDP/cart copy
- [ ] Enable `horo_incentives_live` only after incentive rules verified

---

## 11. Ops outside theme

Post-delivery UGC requests (Shopify Flow, WhatsApp, Medusa jobs) are **not** implemented in the theme. Theme only displays `review_proof` / `horo_ugc` content configured in Admin.
