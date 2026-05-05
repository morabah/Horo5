# HORO Shopify — Final Admin Data Model Lock

> **Version:** 1.0 — Locked 2026-05-05
> **Purpose:** Single source of truth for all metaobjects, metafields, and settings before Shopify Admin population begins.
> **Rule:** Do NOT create legacy slug-based fields. Use this document as the authoritative reference.

---

## 1. Final Metaobject Definitions

Create these in **Shopify Admin → Content → Metaobjects**.

### 1.1 `feeling`

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `title` | Single-line text | Yes | Feeling hub grid, collection page heading | "Zodiac" |
| `handle` | Single-line text | Yes | URL-safe identifier, collection automation | "feeling-zodiac" |
| `description` | Multi-line text | No | Feeling hub card, SEO | "Explore designs that match your cosmic energy." |
| `tagline` | Single-line text | No | Feeling hub card subtitle | "Wear your sign" |
| `accent_color` | Color | No | CSS theming, card border | `#E53935` |
| `hero_image` | File reference (image) | No | Feeling collection hero banner | `feeling-zodiac-hero.jpg` |
| `card_image` | File reference (image) | Recommended | Feeling hub grid card | `feeling-zodiac-card.jpg` |
| `manifesto` | Multi-line text | No | Feeling collection editorial | "We believe in the power of self-expression..." |
| `sort_order` | Integer | No | Grid sort position | `3` |
| `active` | True/False | Yes (default true) | Visibility toggle | `true` |

**Access type:** Storefront
**Used by sections:** `home-feeling-grid.liquid`, `collection-feeling-hero.liquid`, `product-purchase-context.liquid`

---

### 1.2 `subfeeling`

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `title` | Single-line text | Yes | Subfeeling nav, collection heading | "Cancer" |
| `handle` | Single-line text | Yes | URL-safe identifier | "feeling-zodiac-cancer" |
| `parent_feeling` | Metaobject reference → `feeling` | Yes | Parent feeling linkage | `feeling: zodiac` |
| `description` | Multi-line text | No | Collection page editorial | "For those born under the crab..." |
| `hero_image` | File reference (image) | No | Collection hero | `subfeeling-cancer-hero.jpg` |
| `card_image` | File reference (image) | No | Subfeeling nav thumbnail | `subfeeling-cancer-card.jpg` |
| `sort_order` | Integer | No | Nav sort position | `2` |
| `active` | True/False | Yes (default true) | Visibility toggle | `true` |

**Access type:** Storefront
**Used by sections:** `collection-subfeeling-nav.liquid`, `home-feeling-grid.liquid` (as child items), `product-purchase-context.liquid`

---

### 1.3 `occasion`

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `title` | Single-line text | Yes | Occasion hub grid, collection heading | "Birthday" |
| `handle` | Single-line text | Yes | URL-safe identifier | "occasion-birthday" |
| `description` | Multi-line text | No | Occasion hub card | "The perfect gift to celebrate their day." |
| `accent_color` | Color | No | CSS theming | `#4CAF50` |
| `hero_image` | File reference (image) | No | Occasion collection hero | `occasion-birthday-hero.jpg` |
| `card_image` | File reference (image) | Recommended | Occasion hub grid card | `occasion-birthday-card.jpg` |
| `is_gift_occasion` | True/False | Yes (default false) | Gift hub filter | `true` |
| `price_hint` | Single-line text | No | Occasion card pricing context | "From 450 EGP" |
| `sort_order` | Integer | No | Grid sort position | `1` |
| `active` | True/False | Yes (default true) | Visibility toggle | `true` |

**Access type:** Storefront
**Used by sections:** `home-occasion-grid.liquid`, `collection-occasion-hero.liquid`, `page-gifts-hub.liquid`

---

### 1.4 `artist`

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `name` | Single-line text | Yes | Artist card, artist page heading | "Ahmed Raafat" |
| `slug` | Single-line text | Yes | URL-safe identifier, collection rule | "ahmed-raafat" |
| `style` | Single-line text | No | Artist card tagline | "Illustration & Street Art" |
| `bio` | Multi-line text | Yes | Artist profile page | "Ahmed is a Cairo-based illustrator..." |
| `avatar` | File reference (image) | Recommended | Artist card, profile page | `artist-ahmed-avatar.jpg` |
| `portfolio_url` | URL | No | External artist portfolio | `https://instagram.com/ahmedraafat` |
| `design_count` | Integer | No | Artist card stat | `12` |
| `active` | True/False | Yes (default true) | Visibility toggle | `true` |

**Access type:** Storefront
**Used by sections:** `product-artist-card.liquid`, `page-artist-profile.liquid` (Phase 2B), `artists-hub-grid.liquid` (Phase 2B)

---

### 1.5 `size_table`

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `name` | Single-line text | Yes | Size guide heading | "HORO Unisex" |
| `handle` | Single-line text | Yes | Reference identifier | "horo-unisex" |
| `unit_system` | Single-line text | No | Display unit label | "cm" |
| `rows` | JSON | Yes | Table data (array of measurement objects) | See JSON format below |
| `note` | Multi-line text | No | Size guide footer note | "Measurements may vary ±2cm" |

**JSON format for `rows`:**
```json
[
  { "size": "S", "chest": "52", "length": "68", "shoulder": "46" },
  { "size": "M", "chest": "54", "length": "70", "shoulder": "48" },
  { "size": "L", "chest": "56", "length": "72", "shoulder": "50" }
]
```

**Access type:** Storefront
**Used by sections:** `product-size-guide.liquid`

---

### 1.6 `drop` (Phase 2C)

| Field | Shopify Type | Required | Used by | Example |
|-------|-------------|----------|---------|---------|
| `name` | Single-line text | Yes | Drop page heading, homepage block | "Summer Drop 2026" |
| `slug` | Single-line text | Yes | URL-safe identifier | "summer-drop-2026" |
| `status` | Single-line text | Yes | Display state | `"coming_soon"`, `"live"`, `"ended"` |
| `teaser` | Multi-line text | No | Pre-launch description | "Something new is coming..." |
| `body` | Rich text | No | Full drop description | Editorial content |
| `launch_at` | Date and time | Yes | Countdown target, scheduled publish | `2026-06-01T12:00:00+02:00` |
| `end_at` | Date and time | No | Drop closure date | `2026-06-15T23:59:59+02:00` |
| `hero_image` | File reference (image) | Recommended | Drop page hero | `drop-summer-hero.jpg` |
| `products` | List of product references | Yes | Drop product grid | `[product:cancer-tee, product:aries-tee]` |
| `sort_order` | Integer | No | Homepage block priority | `1` |
| `active` | True/False | Yes (default true) | Visibility toggle | `true` |

**Access type:** Storefront
**Used by sections:** `page-drop.liquid` (Phase 2C), `home-first-drop-circle.liquid` (Phase 2C)

---

## 2. Final Product Metafields

Create these in **Shopify Admin → Settings → Custom data → Metafields → Products**.

> **Rule:** Use `metaobject_reference` types for feelings, subfeelings, occasions, artists, and size tables. Do NOT use `single_line_text_field` with slugs.

| Namespace | Key | Shopify Type | Req | Theme Section | Example | Legacy to avoid |
|-----------|-----|-------------|-----|---------------|---------|-----------------|
| `custom` | `feeling` | Metaobject reference → `feeling` | Rec | `product-purchase-context`, collection routing | `feeling:zodiac` | `custom.feeling_slug` |
| `custom` | `subfeeling` | Metaobject reference → `subfeeling` | Opt | `product-purchase-context`, subfeeling nav | `subfeeling:cancer` | `custom.subfeeling_slug` |
| `custom` | `occasions` | List of metaobject references → `occasion` | Opt | `product-purchase-context`, occasion routing | `[occasion:birthday]` | `custom.occasion_slugs` |
| `custom` | `artist` | Metaobject reference → `artist` | Rec | `product-artist-card`, `product-story` | `artist:ahmed-raafat` | `custom.artist_slug` |
| `custom` | `story` | Multi-line text | Yes | `product-story` | "Born from a late-night sketch..." | — |
| `custom` | `story_description` | Rich text | Yes | `product-story` (collapsible) | "The artist spent three weeks..." | — |
| `custom` | `design_story` | Rich text | Rec | `product-details-accordions` | "Inspired by Cairo street art..." | — |
| `custom` | `fit_note` | Multi-line text | Yes | `product-purchase-context`, `product-size-guide` | "Oversized fit. Model is 180cm wearing L." | `custom.fit_label` |
| `custom` | `materials` | Rich text | Rec | `product-details-accordions` | "100% Egyptian cotton, 220 GSM..." | — |
| `custom` | `care_instructions` | Rich text | Rec | `product-details-accordions` | "Machine wash cold, hang dry..." | — |
| `custom` | `dimensions_note` | Rich text | Opt | `product-details-accordions` | "Unisex cut. Chest 56cm (M)." | — |
| `custom` | `features` | List of single-line text | Rec | `product-purchase-context` chips | `["220 GSM cotton", "Screen printed"]` | `custom.pdpTagLabels` |
| `custom` | `trust_chips` | List of single-line text | Opt | `product-purchase-context` chips | `["Printed in Egypt", "COD available"]` | `custom.trustBadges` |
| `custom` | `whatsapp_help_url` | URL | Opt | `product-purchase-context` support link | `https://wa.me/201xxxx` | — |
| `custom` | `size_fit_note` | Multi-line text | Yes | `product-size-guide` | Same as `fit_note` | **DEPRECATED** — use `custom.fit_note` |
| `custom` | `size_table` | Metaobject reference → `size_table` | Rec | `product-size-guide` | `size_table:horo-unisex` | `custom.size_table_key` |
| `custom` | `pair_with_products` | List of product references | Opt | `product-pair-with` | `[product:aries-tee, product:gemini-tee]` | `custom.frequently_bought_with` |
| `custom` | `promo_active` | True/False | Opt | `product-promo-countdown` | `true` | `custom.promo_show_countdown` |
| `custom` | `promo_ends_at` | Date and time | Opt | `product-promo-countdown` | `2026-05-10T23:59:59` | — |
| `custom` | `promo_label` | Single-line text | Opt | `product-promo-countdown` | "Flash Sale" | — |
| `custom` | `promo_label_ar` | Single-line text | Opt | `product-promo-countdown` (AR locale) | "عرض نهاية الأسبوع" | — |
| `custom` | `promo_savings_egp` | Integer | Opt | `product-promo-countdown` | `150` | — |

### Notes

- **Rec** = Recommended for full brand expression. Sections render nothing if missing.
- **Opt** = Optional. Use if the product has this data.
- **Yes** = Required for core PDP experience.
- All metafields are nullable/blank-safe. Sections use defensive Liquid (`!= blank`).

---

## 3. Final Collection Metafields

Create these in **Shopify Admin → Settings → Custom data → Metafields → Collections**.

| Namespace | Key | Shopify Type | Req | Purpose | Example |
|-----------|-----|-------------|-----|---------|---------|
| `custom` | `feeling` | Metaobject reference → `feeling` | Yes (for feeling collections) | Links collection to feeling metaobject | `feeling:zodiac` |
| `custom` | `occasion` | Metaobject reference → `occasion` | Yes (for occasion collections) | Links collection to occasion metaobject | `occasion:birthday` |
| `custom` | `editorial_heading` | Single-line text | Opt | Collection page editorial headline | "Born under the stars" |
| `custom` | `editorial_text` | Multi-line text | Opt | Collection page editorial body | "These designs are for the dreamers..." |
| `custom` | `editorial_image` | File reference (image) | Opt | Collection page editorial image | `collection-zodiac-editorial.jpg` |
| `custom` | `hero_image` | File reference (image) | Opt | Collection page hero banner | `collection-zodiac-hero.jpg` |
| `custom` | `card_image` | File reference (image) | Opt | Hub page card thumbnail | `collection-zodiac-card.jpg` |
| `custom` | `blurb` | Multi-line text | Opt | Short description for cards/lists | "Zodiac-inspired streetwear" |
| `custom` | `price_hint` | Single-line text | Opt | Pricing context for cards | "From 450 EGP" |
| `custom` | `is_gift_occasion` | True/False | Yes (for gift filter) | Flags collection as gift-appropriate | `true` |

---

## 4. Final Shop / Theme Settings Data

Configure these in **Theme Editor → Theme settings**.

### 4.1 HORO Brand Settings

| Setting ID | Type | Required | Purpose | Example |
|-----------|------|----------|---------|---------|
| `horo_gift_wrap_product` | Product picker | Yes | Gift wrap upsell product | `Gift Wrap` product |
| `horo_gift_wrap_label` | Text | No | Gift wrap button label override | "Add gift wrap" |
| `horo_gift_wrap_price_hint` | Text | No | Price hint override (blank = live price) | "+ EGP 50" |

### 4.2 Trust & Delivery Settings

| Setting ID | Type | Required | Purpose | Example |
|-----------|------|----------|---------|---------|
| `horo_trust_badge_1_icon` | Text (icon name) | No | Trust strip icon 1 | "cotton" |
| `horo_trust_badge_1_label` | Text | No | Trust strip label 1 | "Premium cotton" |
| `horo_trust_badge_2_icon` | Text | No | Trust strip icon 2 | "print" |
| `horo_trust_badge_2_label` | Text | No | Trust strip label 2 | "Printed in Egypt" |
| `horo_delivery_standard_min` | Integer | No | Standard delivery min days | `3` |
| `horo_delivery_standard_max` | Integer | No | Standard delivery max days | `7` |
| `horo_delivery_express_min` | Integer | No | Express delivery min days | `2` |
| `horo_delivery_express_max` | Integer | No | Express delivery max days | `4` |
| `horo_whatsapp_support_url` | URL | No | Global WhatsApp support link | `https://wa.me/201xxxx` |

### 4.3 Incentive Section Defaults (set per-section in Theme Editor)

These are section-level settings, not global theme settings:

| Section | Setting | Default | Purpose |
|---------|---------|---------|---------|
| `cart-free-shipping-progress` | `threshold_egp` | `1500` | Must match Admin shipping rate |
| `cart-free-shipping-progress` | `enable_free_shipping_progress` | `false` | Master toggle |
| `cart-bundle-nudge` | `required_quantity` | `3` | Must match Admin discount minimum |
| `cart-bundle-nudge` | `enable_bundle_message` | `false` | Master toggle |
| `product-promo-countdown` | (no enable toggle) | — | Auto-hides without metafields |
| `cart-savings-summary` | (no enable toggle) | — | Auto-hides without savings |
| `product-pair-with` | `include_current_product` | `false` | Adds main product to selection |

---

## 5. Legacy Fields to Avoid

| Old field (DO NOT CREATE) | Replacement field | Reason |
|---------------------------|-------------------|--------|
| `custom.feeling_slug` | `custom.feeling` (metaobject reference) | Typed references are queryable, translatable, and future-proof |
| `custom.artist_slug` | `custom.artist` (metaobject reference) | Same as above |
| `custom.subfeeling_slug` | `custom.subfeeling` (metaobject reference) | Same as above |
| `custom.occasion_slugs` | `custom.occasions` (list of metaobject references) | Same as above |
| `custom.size_table_key` | `custom.size_table` (metaobject reference) | Same as above |
| `custom.fit_label` | `custom.fit_note` | Richer multi-line guidance replaces single-line label |
| `custom.promo_show_countdown` | `custom.promo_active` | Boolean is cleaner; countdown logic handled by section |
| `custom.pdpTagLabels` | `custom.features` | Semantically clearer name |
| `custom.trustBadges` | `custom.trust_chips` | Consistent with `horo.incentives` naming |
| `custom.frequently_bought_with` | `custom.pair_with_products` | Named to match the `product-pair-with` section |
| `custom.customers_also_bought` | `custom.pair_with_products` | Same purpose; use one list, not two |
| `custom.complementary_slugs` | `custom.pair_with_products` | Same purpose |
| `custom.related_products` | `custom.pair_with_products` | Same purpose; avoid duplicate lists |
| `custom.wearer_stories` | `custom.story_description` | Design narrative goes in story fields |
| `custom.hero_image` | Product featured image | Use native Shopify product images |
| `custom.card_image` | Product featured image | Use native Shopify product images |
| `custom.proof_image` | Product media | Use native Shopify product media gallery |
| `custom.launch_at` | `drop.launch_at` (metaobject) | Drop scheduling belongs on the drop metaobject |
| `custom.sunset_at` | `drop.end_at` (metaobject) | Same as above |
| `custom.capsule_slugs` | Collection tags + automated collections | Use Shopify collections, not product slugs |
| `custom.artwork_slug` | `custom.artist` (metaobject reference) | Artist attribution belongs on artist metaobject |

### Special case: `custom.size_fit_note` vs `custom.fit_note`

- **Current:** Both exist. `custom.size_fit_note` was used by the legacy size guide.
- **Going forward:** Populate `custom.fit_note` only. `custom.size_fit_note` is deprecated but left for backwards compatibility on existing products.
- **Action:** Do NOT create new `custom.size_fit_note` definitions. Migrate existing values to `custom.fit_note`.

---

## 6. Admin Creation Checklist

Follow this exact order. Do not skip steps.

### Step 1 — Create Metaobject Definitions

1. Go to **Shopify Admin → Content → Metaobjects**
2. Create `feeling` definition with all fields from §1.1
3. Create `subfeeling` definition with all fields from §1.2
4. Create `occasion` definition with all fields from §1.3
5. Create `artist` definition with all fields from §1.4
6. Create `size_table` definition with all fields from §1.5
7. **(Phase 2C)** Create `drop` definition with all fields from §1.6

### Step 2 — Create Metaobject Entries

1. Populate feelings: Mood, Zodiac, Attitude
2. Populate subfeelings: I Care, I Don't Care, Cancer, Aries, etc.
3. Link each subfeeling to its parent feeling
4. Populate occasions: Birthday, Graduation, Just Because
5. Populate artists: Ahmed Raafat, etc.
6. Populate size tables: HORO Unisex, HORO Oversized, etc.
7. Upload all images (hero, card, avatar) during entry creation

### Step 3 — Create Product Metafield Definitions

1. Go to **Shopify Admin → Settings → Custom data → Metafields → Products**
2. Create every metafield from §2 above
3. For `metaobject_reference` types: select the corresponding metaobject
4. For `list` types: select **List of values**
5. For `rich_text_field`: ensure WYSIWYG editor is available
6. **Do NOT create any legacy fields** from §5

### Step 4 — Create Collection Metafield Definitions

1. Go to **Shopify Admin → Settings → Custom data → Metafields → Collections**
2. Create every metafield from §3 above

### Step 5 — Create Collections

1. Create manual collections for each feeling: `feeling-mood`, `feeling-zodiac`, `feeling-attitude`
2. Create manual collections for each subfeeling: `feeling-mood-i-care`, `feeling-zodiac-cancer`, etc.
3. Create manual collections for each occasion: `occasion-birthday`, `occasion-graduation`, etc.
4. Assign `custom.feeling` or `custom.occasion` metafield to each collection
5. Assign products to collections (a product should be in both parent feeling + subfeeling collections)

### Step 6 — Create Gift Wrap Product

1. **Products → Add product**
2. Name: `Gift Wrap`
3. Price: e.g., `50` EGP
4. Upload featured image
5. Save
6. **Theme Editor → Theme settings → HORO** → Select gift wrap product

### Step 7 — Create Discounts

1. **Settings → Shipping and delivery** → Create free shipping rate (e.g., threshold `1500` EGP)
2. **Discounts → Create discount → Automatic discount**
   - Type: Amount off order
   - Value: `100` EGP
   - Minimum quantity: `3`
   - Title: `Buy 3 save 100 EGP`
3. Save and test with draft order

### Step 8 — Populate Product Data

1. Pick one representative product
2. Upload product images (front, back, print proof, fabric, flat lay, lifestyle)
3. Assign to collections (feeling + subfeeling + occasion if applicable)
4. Populate all product metafields from §2:
   - `custom.feeling` → select metaobject
   - `custom.subfeeling` → select metaobject
   - `custom.artist` → select metaobject
   - `custom.story` → write narrative
   - `custom.story_description` → write longer narrative
   - `custom.fit_note` → write fit guidance
   - `custom.materials` → write fabric details
   - `custom.features` → add chips
   - `custom.size_table` → select size_table metaobject
   - `custom.pair_with_products` → select companion products
5. Save product

### Step 9 — Configure Theme Settings

1. **Theme Editor → Theme settings → HORO**
2. Select gift wrap product
3. Set gift wrap label and price hint (optional)
4. **Theme Editor → Cart page**
5. Enable `cart-free-shipping-progress` and set `threshold_egp` to match Admin
6. Enable `cart-bundle-nudge` and set `required_quantity` to match Admin discount

### Step 10 — Arabic / RTL QA

1. **Settings → Languages** → Ensure Arabic is published
2. Open test product in Arabic locale
3. Verify all `horo.*` translation keys render correctly
4. Verify RTL text direction on all sections
5. Verify no truncated or overlapping text

---

## 7. Validation Path

Run this exact flow after Admin population to confirm everything works.

### 7.1 Homepage

- [ ] Hero loads with heading, subheading, CTA
- [ ] Trust ribbon visible with correct badges
- [ ] Primary routes (Feelings, Occasions, Gifts) clickable
- [ ] Feeling grid loads with card images
- [ ] Occasion grid loads with card images

### 7.2 Feelings Hub

- [ ] Navigate to `/pages/feelings` (or feelings hub page)
- [ ] Feeling cards display: title, tagline, card image
- [ ] Click "Zodiac" → routes to `/collections/feeling-zodiac`

### 7.3 Zodiac Collection

- [ ] Collection hero loads with `hero_image` and `editorial_heading`
- [ ] Subfeeling nav visible: Cancer, Aries, etc.
- [ ] Products assigned to Zodiac display in grid
- [ ] Click "Cancer" → routes to `/collections/feeling-zodiac-cancer`

### 7.4 Cancer Collection

- [ ] Collection heading: "Cancer"
- [ ] Products assigned to Cancer display
- [ ] Click any product → routes to PDP

### 7.5 Product Detail Page (PDP)

- [ ] Product images load (gallery, thumbnails)
- [ ] Variant picker works (size, color)
- [ ] Price displays correctly
- [ ] **Add to cart** works
- [ ] `product-story` section renders with `custom.story` text
- [ ] `product-artist-card` renders with artist avatar, name, bio
- [ ] Artist name is clickable (links to artist page, Phase 2B)
- [ ] `product-purchase-context` renders feeling pill, fit note, feature chips
- [ ] `product-size-guide` renders size table from `custom.size_table` metaobject
- [ ] `product-details-accordions` renders materials, care, design story
- [ ] `product-promo-countdown` renders ONLY if `promo_active=true` + future date
- [ ] `product-pair-with` renders companion products from `custom.pair_with_products`
- [ ] `product-gift-wrap-upsell` renders with image, price, toggle
- [ ] `product-trust-strip` renders with correct badges
- [ ] `product-delivery-payment` renders with COD, Instapay, exchange info

### 7.6 Cart

- [ ] Cart items display with correct images, titles, prices
- [ ] Quantity selector works (+ / - / input)
- [ ] Remove item works
- [ ] `cart-gift-wrap-upsell` renders (if gift wrap not in cart)
- [ ] Gift wrap toggle adds product to cart
- [ ] Gift wrap checkbox (when in cart) removes product on uncheck
- [ ] `cart-bundle-nudge` renders with correct remaining count (if enabled)
- [ ] `cart-free-shipping-progress` renders with correct remaining amount (if enabled)
- [ ] `cart-savings-summary` renders if compare-at or discount savings exist
- [ ] `cart_trust_explainer` renders

### 7.7 Checkout

- [ ] Shipping rates load
- [ ] Free shipping applies when cart total >= threshold (if configured)
- [ ] Bundle discount applies when quantity >= required (if configured)
- [ ] COD option visible
- [ ] Order completes successfully

### 7.8 Arabic / RTL Verification

- [ ] Switch store locale to Arabic
- [ ] Re-run PDP and Cart validation
- [ ] All `horo.*` translation keys render in Arabic
- [ ] Text direction is RTL
- [ ] No layout breakage on mobile (375px) or desktop

---

## Decision Log

1. **Metaobjects over slugs:** All taxonomy data uses typed metaobject references. Slug fields are legacy and should not be created.
2. **Single pair-with list:** `custom.pair_with_products` replaces `frequently_bought_with`, `customers_also_bought`, `complementary_slugs`, and `related_products`. One list is sufficient.
3. **Size table as metaobject:** `size_table` is a metaobject (not inline JSON on the product) so the same table can be reused across many products.
4. **Drop as metaobject:** Drop scheduling uses the `drop` metaobject, not product metafields. This keeps drop logic centralized.
5. **No `promo_show_countdown`:** The countdown section reads `promo_active` directly. No extra boolean needed.
6. **Gift wrap as real product:** Uses Shopify's native product type, not a custom line-item property. This ensures inventory, price, and image are all native.

---

## Document Lock

This document is locked as of 2026-05-05. Any new field requests must go through a review process and be added here with a version bump. Do not create fields in Shopify Admin that are not listed in this document.
