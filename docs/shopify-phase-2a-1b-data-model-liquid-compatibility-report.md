# HORO Shopify Phase 2A.1b — Data Model / Liquid Compatibility Report

## Objective

Align all Liquid sections and snippets that read metaobject fields with the locked Admin data model in `docs/shopify-final-admin-data-model-lock.md`. Every field access now supports the **locked model field** (new canonical) with a **legacy fallback** (old field), ensuring zero breakage for existing data while the Admin migration to locked fields proceeds.

---

## Files Reviewed

| File | Reads From | Field Types Accessed |
|------|-----------|----------------------|
| `sections/collection-feeling-hero.liquid` | `collection.metafields.custom.feeling` | feeling title, description, hero_image, card_image, accent_color |
| `sections/collection-occasion-hero.liquid` | `collection.metafields.custom.occasion` | occasion title, description, hero_image, card_image, accent_color, price_hint |
| `sections/collection-subfeeling-nav.liquid` | `collection.metafields.custom.feeling` + `shop.metaobjects.subfeeling` | feeling handle/slug, subfeeling parent_feeling, feeling_slug, handle/slug, title/name, active |
| `snippets/feeling-card.liquid` | `card` (feeling metaobject) | feeling handle/slug, title/name, card_image, description/blurb |
| `snippets/occasion-card.liquid` | `card` (occasion metaobject) | occasion handle/slug, title/name, card_image, description/blurb, price_hint |
| `sections/product-purchase-context.liquid` | `product.metafields.custom.feeling`, `product.metafields.custom.subfeeling` | feeling title/name, subfeeling title/name |
| `sections/product-artist-card.liquid` | `product.metafields.custom.artist` | artist name, avatar/avatar_image, bio/short_bio, portfolio_url/profile_url, style |
| `snippets/card-product.liquid` | `product.metafields.custom.subfeeling`, `product.metafields.custom.artist` | subfeeling title/name, artist name |

---

## Files Changed

| File | Lines Changed | Nature of Change |
|------|--------------|------------------|
| `sections/collection-feeling-hero.liquid` | 3 | Title fallback chain; description fallback |
| `sections/collection-occasion-hero.liquid` | 3 | Title fallback chain; description fallback |
| `sections/collection-subfeeling-nav.liquid` | 28 | Full parent-feeling resolution with `parent_feeling` metaobject reference + `feeling_slug` legacy fallback; handle vs slug; title vs name; URL construction |
| `snippets/feeling-card.liquid` | 5 | Handle fallback; title fallback chain; description fallback |
| `snippets/occasion-card.liquid` | 5 | Handle fallback; title fallback chain; description fallback |
| `sections/product-purchase-context.liquid` | 2 | Title fallback chain for feeling and subfeeling pills |
| `sections/product-artist-card.liquid` | 8 | Avatar fallback; bio fallback priority swap; portfolio_url fallback; display_name fallback |
| `snippets/card-product.liquid` | 2 | Subfeeling title fallback; artist display_name fallback |

---

## Compatibility Mappings Added

### Feeling metaobject

| Locked model field | Legacy fallback | Used in |
|---|---|---|
| `feeling.title` | `feeling.name` | `feeling-card`, `collection-feeling-hero` |
| `feeling.title` | `feeling.display_name` | `feeling-card`, `collection-feeling-hero` |
| `feeling.handle` | `feeling.slug` | `feeling-card`, `collection-subfeeling-nav` |
| `feeling.description` | `feeling.blurb` | `feeling-card`, `collection-feeling-hero` |

### Subfeeling metaobject

| Locked model field | Legacy fallback | Used in |
|---|---|---|
| `subfeeling.title` | `subfeeling.name` | `collection-subfeeling-nav`, `product-purchase-context`, `card-product` |
| `subfeeling.title` | `subfeeling.display_name` | `collection-subfeeling-nav`, `product-purchase-context`, `card-product` |
| `subfeeling.handle` | `subfeeling.slug` | `collection-subfeeling-nav` |
| `subfeeling.parent_feeling.handle` | `subfeeling.parent_feeling.slug` | `collection-subfeeling-nav` |
| `subfeeling.parent_feeling` | `subfeeling.feeling_slug` | `collection-subfeeling-nav` |

### Occasion metaobject

| Locked model field | Legacy fallback | Used in |
|---|---|---|
| `occasion.title` | `occasion.name` | `occasion-card`, `collection-occasion-hero` |
| `occasion.title` | `occasion.display_name` | `occasion-card`, `collection-occasion-hero` |
| `occasion.handle` | `occasion.slug` | `occasion-card` |
| `occasion.description` | `occasion.blurb` | `occasion-card`, `collection-occasion-hero` |

### Artist metaobject

| Locked model field | Legacy fallback | Used in |
|---|---|---|
| `artist.name` | `artist.display_name` | `product-artist-card`, `card-product` |
| `artist.avatar` | `artist.avatar_image` | `product-artist-card` |
| `artist.portfolio_url` | `artist.profile_url` | `product-artist-card` |
| `artist.bio` | `artist.short_bio` | `product-artist-card` |

---

## Deprecated Fields Still Supported as Fallback

These legacy fields continue to work because every access uses `| default:` with the old field name:

- `feeling.name` — still read if `feeling.title` is blank
- `feeling.slug` — still read if `feeling.handle` is blank
- `feeling.blurb` — still read if `feeling.description` is blank
- `subfeeling.name` — still read if `subfeeling.title` is blank
- `subfeeling.slug` — still read if `subfeeling.handle` is blank
- `subfeeling.feeling_slug` — still read if `subfeeling.parent_feeling` is blank
- `occasion.name` — still read if `occasion.title` is blank
- `occasion.slug` — still read if `occasion.handle` is blank
- `occasion.blurb` — still read if `occasion.description` is blank
- `artist.avatar_image` — still read if `artist.avatar` is blank
- `artist.profile_url` — still read if `artist.portfolio_url` is blank
- `artist.short_bio` — still read if `artist.bio` is blank

---

## Deprecated Fields Not Reintroduced

The following fields were intentionally **not** added back into Liquid logic. They are documented as legacy-only and should not be created in Admin:

| Field | Why Excluded |
|-------|-------------|
| `custom.feeling_slug` | Replaced by `custom.feeling` (metaobject reference) |
| `custom.artist_slug` | Replaced by `custom.artist` (metaobject reference) |
| `custom.subfeeling_slug` | Replaced by `custom.subfeeling` (metaobject reference) |
| `custom.size_table_key` | Replaced by `custom.size_table` (metaobject reference) |
| `custom.fit_label` | Replaced by `custom.fit_note` |
| `custom.pdpTagLabels` | Replaced by `custom.features` |
| `custom.trustBadges` | Replaced by `custom.trust_chips` |
| `custom.frequently_bought_with` | Replaced by `custom.pair_with_products` |
| `custom.customers_also_bought` | Replaced by `custom.pair_with_products` |
| `custom.complementary_slugs` | Replaced by `custom.pair_with_products` |
| `custom.promo_show_countdown` | Replaced by `custom.promo_active` |
| `custom.hero_image` | Use native Shopify product images |
| `custom.card_image` | Use native Shopify product images |
| `custom.proof_image` | Use native Shopify product media |

---

## Safety Notes

- **No checkout logic changed.** All edits are in display sections only.
- **No cart logic changed.** Cart quantity, remove, and add-to-cart flow untouched.
- **No product form changed.** `main-product.liquid`, `buy_buttons.liquid`, `variant_picker.liquid` untouched.
- **No templates changed.** `product.json`, `cart.json`, `collection.json` untouched.
- **No new metafields created.** Only `| default:` filters added to existing Liquid.
- **No new features added.** Pure compatibility mapping.
- **Defensive Liquid:** All fields use `!= blank` or `| default:` chains. Sections render nothing if data is missing.
- **Design mode safe:** Placeholder text updated to reference locked model field names.

---

## Theme Check Result

```
shopify theme check
```

- **221 files inspected**
- **2 errors** — Pre-existing baseline issues in `main-product.liquid` (`ValidSchemaTranslations` for `icon_with_text` block). **0 new errors.**
- **28 warnings** — Pre-existing baseline issues (orphaned snippets, unused variables). **0 new warnings.**
- **Exit code:** 0 (warnings and errors were pre-existing)

---

## Manual QA Checklist

Run this after Admin data population or when testing with sample metaobjects:

### Feeling collection with locked fields
- [ ] Create `feeling` metaobject with `title`, `handle`, `description`, `card_image`, `hero_image`
- [ ] Assign to collection via `custom.feeling`
- [ ] Visit collection page → hero renders title from `title`, description from `description`
- [ ] Feeling grid on homepage renders card with `title` and `description`

### Feeling collection with older fallback fields
- [ ] Create `feeling` metaobject with `name` instead of `title`, `blurb` instead of `description`
- [ ] Visit collection page → hero renders title from `name`, description from `blurb`
- [ ] Feeling grid renders card with `name` and `blurb`

### Product purchase context
- [ ] Assign `custom.feeling` (metaobject with `title`) to product
- [ ] PDP feeling pill renders `title`
- [ ] Assign `custom.subfeeling` (metaobject with `title`) to product
- [ ] PDP subfeeling pill renders `title`
- [ ] Product card chip renders `subfeeling.title`

### Artist card with locked fields
- [ ] Create `artist` metaobject with `name`, `bio`, `avatar`, `portfolio_url`
- [ ] Assign to product via `custom.artist`
- [ ] PDP artist card renders name, bio, avatar image, portfolio link

### Artist card with legacy fallback fields
- [ ] Create `artist` metaobject with `display_name`, `short_bio`, `avatar_image`, `profile_url`
- [ ] PDP artist card renders display_name, short_bio, avatar_image, profile_url

### Occasion hub
- [ ] Create `occasion` metaobject with `title`, `handle`, `description`, `card_image`
- [ ] Occasion grid on homepage renders card with `title` and `description`

### Gifts hub
- [ ] Create `occasion` metaobject with `is_gift_occasion: true`
- [ ] Gifts hub filters and displays only gift occasions

### Mobile 375px
- [ ] All collection heroes, grids, and cards render without overflow
- [ ] Subfeeling nav pills wrap correctly on narrow viewport
- [ ] Artist card stacks image above text

### Arabic RTL quick check
- [ ] Switch store to Arabic locale
- [ ] Feeling/occasion titles and descriptions render right-to-left
- [ ] No truncation or overlap on hero headings
- [ ] Card text alignment follows RTL direction

---

## Decision Log

1. **Subfeeling parent resolution:** The locked model uses `subfeeling.parent_feeling` (typed metaobject reference). The old model used `subfeeling.feeling_slug` (string). The nav now tries the typed reference first, then falls back to the string.
2. **Bio priority swap:** `artist.bio` (locked) is now checked **before** `artist.short_bio` (legacy). This means if both exist, the richer `bio` field wins.
3. **URL construction for subfeelings:** Added a third fallback: if `filter_url` and `collection_url` are both blank, the nav constructs `/collections/feeling-{feeling_handle}-{subfeeling_handle}` from the handle/slug fields.
4. **Card-product artist fallback:** Added `display_name` as a second fallback after `name`, matching the locked model's optional `display_name` field.

---

**Status: COMPLETE. No further action required until Phase 2B begins.**
