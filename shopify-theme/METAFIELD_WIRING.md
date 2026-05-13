# HORO Shopify Theme — Metafield & Metaobject Wiring

This document maps the Shopify theme's metafield/metaobject consumption to the `web-next` data model so both storefronts remain in sync.

---

## Product Metafields (`product.metafields.custom`)

| Metafield key | Type | Used in (Shopify) | web-next equivalent | Notes |
|---------------|------|-------------------|---------------------|-------|
| `feeling` | Metaobject reference → `feeling` | `horo-product-data.liquid`, `product-story.liquid`, collection templates | `Product.feelings[]` (category slugs) | Single feeling assignment. Theme reads `.value.title` / `.value.name`. |
| `occasions` | List of metaobject references → `occasion` | `horo-product-data.liquid` | `Product.occasions[]` | Mapped to `title` values. |
| `artist` | Metaobject reference → `artist` | `product-artist-card.liquid` | `Product.artistSlug` + `Artist` catalog lookup | Reads `.value.name`, `.value.display_name`. |
| `story` | Single-line text | `product-story.liquid` | `Product.story` | Short narrative text. |
| `story_description` | Multi-line text | `product-story.liquid` | `Product.storyDescription` | Extended narrative. |
| `subtitle` | Single-line text | `templates/product.json` (caption block) | `Product.subtitle` | Rendered under product title in PDP. |
| `subfeeling` | Metaobject reference → `subfeeling` | `collection-subfeeling-nav.liquid` | `Product.subfeelingSlug` / `FeelingBrowseAssignment` | For sub-feeling navigation on collection pages. |
| `feels_like` | List / CSV text | Headless PDP | `Product.feelsLike` | Emotional line under title. |
| `works_for` | List / CSV text | Headless PDP | `Product.worksFor` | Moments/occasions shown in story block. |
| `fit_label` | Single-line text | `product-purchase-context.liquid`, headless PDP | `Product.fitLabel` | Required for V1.4 published products. |
| `size_table_key` | Single-line text | Headless PDP | `Product.sizeTableKey` | Required for V1.4 published products. |
| `giftable` | Boolean | `product-purchase-context.liquid`, headless `/gifts` | `Product.giftable` | Enables gift helper and gift route inclusion. |
| `gift_occasion_tags` | List / CSV text | `product-purchase-context.liquid`, headless `/gifts` | `Product.giftOccasionTags` | Real gift tags only; no placeholder occasions. |
| `buyer_route` | Single-line text | Headless analytics/readiness | `Product.buyerRoute` | Use `feeling`, `moment`, `gift`, `personality`, `artist_drop`, or `world`. |
| `primary_audience` | Single-line text | Headless analytics/readiness | `Product.primaryAudience` | Use V1.4 allowed audience labels. |
| `artist_display` | Single-line text | Headless PDP | `Product.artistDisplay.name` | Fallback artist credit for Shopify headless. |
| `care_instructions` | Multi-line text | Headless PDP | `Product.careInstructions` | Only show care claims that are configured. |
| `material` | Single-line text | Headless PDP | `Product.physicalAttributes.material` | If missing, storefront says `Cotton T-shirt`; do not claim GSM/cotton % without data. |
| `whatsapp_help_url` | URL | `product-purchase-context.liquid`, headless PDP | Support channel | Size help CTA. |
| `delivery_note` | Text | Headless PDP | Storefront delivery proof | Operational copy only. |
| `exchange_note` | Text | Headless PDP | Storefront exchange proof | Operational copy only. |

---

## Product Metafields (`product.metafields.descriptors`)

| Metafield key | Type | Used in (Shopify) | web-next equivalent |
|---------------|------|-------------------|---------------------|
| `subtitle` | Single-line text | `main-product.liquid` caption block | `Product.subtitle` |

---

## Metaobjects

### `feeling`

| Field | Type | Used in (Shopify) | web-next equivalent |
|-------|------|-------------------|---------------------|
| `title` | Single-line text | `feelings-hub.liquid`, `horo-product-data.liquid` | `Feeling.name` |
| `name` | Single-line text | fallback for title | `Feeling.name` |
| `active` | Boolean | `feelings-hub.liquid` | `Feeling.active` |
| `slug` | Single-line text | `feeling-card.liquid` | `Feeling.slug` |
| `sort_order` | Integer | `feelings-hub.liquid` | `Feeling.sortOrder` |

### `occasion`

| Field | Type | Used in (Shopify) | web-next equivalent |
|-------|------|-------------------|---------------------|
| `title` | Single-line text | `occasions-hub.liquid`, `horo-product-data.liquid` | `Occasion.name` |
| `active` | Boolean | `occasions-hub.liquid` | `Occasion.active` |
| `slug` | Single-line text | occasion cards | `Occasion.slug` |
| `sort_order` | Integer | `occasions-hub.liquid` | `Occasion.sortOrder` |

### `artist`

| Field | Type | Used in (Shopify) | web-next equivalent |
|-------|------|-------------------|---------------------|
| `name` | Single-line text | `product-artist-card.liquid`, `page-artist.liquid` | `Artist.name` |
| `display_name` | Single-line text | fallback for name | `Artist.displayName` |
| `style` | Single-line text | `product-artist-card.liquid` | `Artist.style` |
| `bio` | Multi-line text | `page-artist.liquid` | `Artist.bio` |
| `avatar` | File / image | `product-artist-card.liquid` | `Artist.avatarSrc` |
| `active` | Boolean | `home-artist-spotlight.liquid` | `Artist.active` |
| `design_count` | Integer | computed | `Artist.designCount` |

### `subfeeling`

| Field | Type | Used in (Shopify) | web-next equivalent |
|-------|------|-------------------|---------------------|
| `title` | Single-line text | `collection-subfeeling-nav.liquid` | `Subfeeling.name` |
| `slug` | Single-line text | `collection-subfeeling-nav.liquid` | `Subfeeling.slug` |
| `parent_feeling` | Metaobject reference → `feeling` | `collection-subfeeling-nav.liquid` | `Subfeeling.feelingSlug` |

---

## Theme Settings (metafield-adjacent)

| Setting ID | Type | Purpose |
|------------|------|---------|
| `horo_gift_wrap_product` | Product picker | Product used for gift-wrap upsell |
| `horo_gift_wrap_label` | Text | Upsell CTA label |
| `horo_gift_wrap_price_hint` | Text | Price hint (e.g. "+ EGP 50") |

---

## Review Metafields (Shopify standard)

| Metafield key | Type | Used in (Shopify) |
|---------------|------|-------------------|
| `product.metafields.reviews.rating` | Rating | `main-product.liquid` star display |
| `product.metafields.reviews.rating_count` | Number | review count |

---

## Data Flow Summary

```
Shopify Admin
├── Metaobjects
│   ├── feeling      → shop.metaobjects.feeling.values
│   ├── occasion     → shop.metaobjects.occasion.values
│   ├── artist       → shop.metaobjects.artist.values
│   └── subfeeling   → shop.metaobjects.subfeeling.values
│
├── Product Metafields (custom namespace)
│   ├── feeling      → product.metafields.custom.feeling
│   ├── occasions    → product.metafields.custom.occasions
│   ├── artist       → product.metafields.custom.artist
│   ├── story        → product.metafields.custom.story
│   ├── story_description → product.metafields.custom.story_description
│   └── subtitle     → product.metafields.custom.subtitle
│
└── Theme Settings
    ├── horo_gift_wrap_product
    ├── horo_gift_wrap_label
    └── horo_gift_wrap_price_hint
```

---

## i18n Key Mapping

The theme uses a single `horo` namespace in `locales/en.default.json` and `locales/ar.json` to keep parity with `web-next`'s `dictionary.ts`.

| Theme locale path | web-next dictionary path |
|-------------------|--------------------------|
| `horo.brand.mantra` | `shell.brandMantra` |
| `horo.nav.feelings` | `shell.shopByFeeling` |
| `horo.nav.occasions` | `shell.shopByMoment` |
| `horo.nav.shop_all` | `shell.shopAll` |
| `horo.nav.about` | `shell.about` |
| `horo.footer.*` | `footer.*` |
| `horo.pages.size_guide_*` | `sizeGuide.*` |
| `horo.pages.faq_*` | `faq.*` |
| `horo.pdp.*` | `pdp.*` |
| `horo.cart.*` | `cart.*` |
| `horo.404.*` | `shell.pageNotFound` + custom |

---

## Maintenance Notes

1. **Adding a new metaobject field**: Update both the Shopify metaobject definition (Admin → Content → Metaobjects) and this document. If `web-next` also consumes the field, update `catalog-types.ts`.
2. **Renaming a metafield**: Always provide a migration period. Update Liquid references in the theme, then regenerate the Medusa mapping (if applicable) for `web-next`.
3. **Locale additions**: Add keys to both `en.default.json` and `ar.json` under the same nested path to maintain RTL parity.
