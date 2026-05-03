# HORO Shopify Phase 1.5 — Data and Visual Setup

> **Date**: 2026-05-03  
> **Status**: Ready for data population. Theme code is complete and pushed.  
> **Goal**: Explain why the storefront looks empty, define every data object needed, and provide exact setup steps.

---

## Why the store looks empty

The HORO theme contains **complete Liquid, CSS, JSON template, and JavaScript code** for a fully functional storefront. However, Shopify themes are **data-driven**: sections that rely on metaobjects, metafields, collections, products, and images will render as **empty or hidden** when that Shopify data does not exist in the store.

| Symptom | Root cause |
|---|---|
| Homepage feeling grid is invisible / shows placeholder | No `feeling` metaobjects created |
| Homepage occasion grid is invisible / shows placeholder | No `occasion` metaobjects created |
| Gifts block is invisible | No `occasion` entries with `is_gift_occasion = true` |
| Collection pages show no hero | Collection has no `custom.feeling` or `custom.occasion` metafield |
| Product pages show no story / artist / size guide | Product has no `custom.story`, `custom.artist`, etc. metafields |
| Hero image is a gray placeholder SVG | No hero image uploaded in the theme editor |
| Trust ribbon, delivery cards are empty | Theme settings have defaults but may not be saved to the live theme |
| Primary route cards are empty | No blocks configured in the theme editor |

**This is not a code bug. It is a missing-data symptom.**

---

## Required data model

### 1. Metaobject definitions

Metaobjects must be defined in **Settings → Custom data → Metaobjects** before entries can be created.

#### `feeling`

Used by: homepage feeling grid, feelings hub page, collection hero, subfeeling nav.

| Field | Type | Required | Example value |
|---|---|---|---|
| `name` | Single-line text | **Yes** | "Cancer" |
| `slug` | Single-line text | **Yes** | `cancer` (used to build `/collections/feeling-cancer`) |
| `card_image` | File (image) | Recommended | 1100×1100 JPEG |
| `hero_image` | File (image) | Optional | 1920×600 JPEG for collection hero |
| `blurb` | Multi-line text | Optional | "Emotional, protective, intuitive" |
| `accent_color` | Color | Optional | `#6B4C8A` |
| `active` | Boolean | Optional | `true` (defaults to true if omitted) |

#### `occasion`

Used by: homepage occasion grid, gifts block, occasions hub page, collection hero.

| Field | Type | Required | Example value |
|---|---|---|---|
| `name` | Single-line text | **Yes** | "Birthday" |
| `slug` | Single-line text | **Yes** | `birthday` (used to build `/collections/occasion-birthday`) |
| `card_image` | File (image) | Recommended | 1100×1100 JPEG |
| `hero_image` | File (image) | Optional | 1920×600 JPEG |
| `blurb` | Multi-line text | Optional | "Make it unforgettable" |
| `price_hint` | Single-line text | Optional | "From EGP 450" |
| `accent_color` | Color | Optional | `#E8593C` |
| `active` | Boolean | Optional | `true` |
| `is_gift_occasion` | Boolean | Optional | `true` (set to true for entries that appear on the Gifts page) |

#### `subfeeling`

Used by: collection subfeeling nav.

| Field | Type | Required | Example value |
|---|---|---|---|
| `name` | Single-line text | **Yes** | "Cancer Man" |
| `feeling_slug` | Single-line text | **Yes** | `cancer` (must match a `feeling.slug`) |
| `filter_url` | Single-line text | Optional | `/collections/feeling-cancer?filter.v.availability=1` |
| `collection_url` | Single-line text | Optional | `/collections/cancer-man` |
| `active` | Boolean | Optional | `true` |

#### `artist`

Used by: product artist card.

| Field | Type | Required | Example value |
|---|---|---|---|
| `name` | Single-line text | **Yes** | "Ahmed El-Sayed" |
| `avatar_image` | File (image) | Optional | 500×500 JPEG |
| `style` | Single-line text | Optional | "Digital illustration, zodiac portraiture" |
| `short_bio` | Multi-line text | Optional | "Cairo-based artist..." |
| `bio` | Multi-line text | Optional | Fallback if `short_bio` is empty |
| `profile_url` | URL | Optional | `https://instagram.com/artist` |

---

### 2. Product metafields (namespace: `custom`)

Defined in **Settings → Custom data → Metafields → Products**.

| Metafield key | Type | Required | Used by |
|---|---|---|---|
| `story` | Rich text | Optional | `product-story.liquid` |
| `story_description` | Rich text | Optional | `product-story.liquid` (accordion body) |
| `artist` | Metaobject reference → `artist` | Optional | `product-artist-card.liquid` |
| `size_fit_note` | Single-line text | Optional | `product-size-guide.liquid` (if referenced) |
| `size_table` | Rich text | Optional | `product-size-guide.liquid` |

**Note**: The product story section reads `product.metafields.custom.story.value` and `product.metafields.custom.story_description.value`. The `custom` namespace must exist in your metafield definitions.

---

### 3. Collection metafields (namespace: `custom`)

Defined in **Settings → Custom data → Metafields → Collections**.

| Metafield key | Type | Required | Used by |
|---|---|---|---|
| `feeling` | Metaobject reference → `feeling` | Optional | `collection-feeling-hero.liquid`, `collection-subfeeling-nav.liquid` |
| `occasion` | Metaobject reference → `occasion` | Optional | `collection-occasion-hero.liquid` |

**Behavior**: If a collection has `custom.feeling` set, the feeling hero renders with the feeling's `hero_image` and `accent_color`. If `custom.occasion` is set, the occasion hero renders instead. Normal collections without these metafields show no custom hero.

---

## Minimum MVP data

To make the Phase 1 storefront look complete, create **at minimum**:

### Metaobject entries

| Metaobject | Count | Example entries |
|---|---|---|
| `feeling` | 3 | `cancer`, `aries`, `gemini` |
| `occasion` | 3 | `birthday`, `graduation`, `ramadan` |
| `subfeeling` | 2 | `cancer-man`, `cancer-woman` |
| `artist` | 1 | `ahmed-el-sayed` |

### Collections

| Collection handle | Condition | Purpose |
|---|---|---|
| `all` | Already exists by default | Featured collection on homepage |
| `feeling-cancer` | Create manually | Feeling page route |
| `feeling-aries` | Create manually | Feeling page route |
| `feeling-gemini` | Create manually | Feeling page route |
| `occasion-birthday` | Create manually | Occasion page route |
| `occasion-graduation` | Create manually | Occasion page route |
| `occasion-ramadan` | Create manually | Occasion page route |

**Important**: The feeling/occasion card snippets build URLs as `/collections/feeling-{slug}` and `/collections/occasion-{slug}`. The collection handle must match exactly.

### Products

| Product | Details |
|---|---|
| Test product 1 | Has variants (S, M, L), images, price in EGP |
| Test product 2 | Has variants, images, price in EGP |
| Test product 3 | Has variants, images, price in EGP |
| Gift Wrap | Simple product, price ~EGP 50, no variants required |

### Pages

| Page handle | Template | Status |
|---|---|---|
| `feelings` | `page.feelings-hub` | Must create |
| `occasions` | `page.occasions-hub` | Must create |
| `gifts` | `page.gifts-hub` | Must create |
| `about` | `page.about-horo` | Must create |
| `faq` | `page.faq-horo` | Verify exists |
| `exchange` | `page.exchange-policy-horo` | Verify exists |
| `size-guide` | `page.size-guide` | Verify exists |

---

## Product setup checklist

For each test product:

- [ ] Create product in **Products → Add product**
- [ ] Set title, description, price in **EGP**
- [ ] Add at least one variant (e.g., Size: S, M, L)
- [ ] Upload at least 2 product images
- [ ] Add to at least one collection (e.g., `feeling-cancer` or `occasion-birthday`)
- [ ] Set **metafields** (optional but recommended for testing):
  - `custom.story` → Rich text: "This design captures the protective shell and emotional depth of Cancer..."
  - `custom.story_description` → Rich text: "Printed on 100% cotton, pre-shrunk, locally printed in Cairo."
  - `custom.artist` → Metaobject reference: select the artist entry
  - `custom.size_fit_note` → Text: "True to size. Order your usual size."
  - `custom.size_table` → Rich text: HTML table with cm/inch measurements

---

## Collection setup checklist

For each feeling collection (e.g., `feeling-cancer`):

- [ ] Create collection in **Products → Collections → Create collection**
- [ ] Handle must be `feeling-{slug}` (e.g., `feeling-cancer`)
- [ ] Add products to the collection
- [ ] Set **collection metafield**:
  - `custom.feeling` → Metaobject reference: select the matching `feeling` entry

For each occasion collection (e.g., `occasion-birthday`):

- [ ] Handle must be `occasion-{slug}`
- [ ] Add products
- [ ] Set **collection metafield**:
  - `custom.occasion` → Metaobject reference: select the matching `occasion` entry

---

## Homepage visual setup (Theme Editor)

Open **Online Store → Themes → Customize** on the live/preview theme.

### 1. Home Hero section

| Setting | Action |
|---|---|
| **Hero image** | Upload a 1920×1080 or 3840×2160 lifestyle image. JPG recommended. |
| **Heading** | Default: "Wear What You Mean" — change if needed. |
| **Subheading** | Default: "Original digital artwork, turned into identity-led t-shirts" |
| **Button label** | Default: "Shop by Feeling" |
| **Button link** | Select `/pages/feelings` or a collection |
| **Overlay opacity** | 30% default. Adjust for text readability over the image. |
| **Desktop content position** | Center (default) or adjust based on image focal point. |

### 2. Trust Ribbon section

This section uses **theme settings** (not section settings). Go to **Theme settings → HORO Trust & Delivery**:

| Setting | Default | Action |
|---|---|---|
| Trust badge 1 | "Artist-made design" | Verify or edit |
| Trust badge 2 | "Printed in Egypt" | Verify or edit |
| Trust badge 3 | "COD available" | Verify or edit |
| Trust badge 4 | "14-day exchange" | Verify or edit |
| Trust badge 5 | "WhatsApp support" | Verify or edit |

### 3. Primary Routes section

Add **3 blocks** in the theme editor. Each block needs:

| Block field | Example value |
|---|---|
| **Image** | Upload 1100×1100 image |
| **Link** | Select `/pages/feelings`, `/pages/occasions`, `/collections/all` |
| **Label** | "Shop by Feeling", "Shop by Occasion", "Shop All" |

### 4. Featured Collection section

| Setting | Action |
|---|---|
| **Collection** | Select the "All" collection (or a curated collection) |
| **Products to show** | 8 |
| **Show view all** | Enable |

### 5. Feeling Grid section

No manual configuration needed. It auto-populates from `feeling` metaobjects. Ensure metaobjects are created and `active != false`.

### 6. Occasion Grid section

Auto-populates from `occasion` metaobjects. Ensure metaobjects are created.

### 7. Gift Block section

Auto-populates from `occasion` metaobjects where `is_gift_occasion = true`. Create at least one occasion entry with that flag set.

---

## Color / font setup (Theme Editor)

Go to **Theme settings → HORO Brand**.

These defaults are already defined in `settings_schema.json`, but the live theme may not have them saved. Click through each color and re-save if they appear blank:

| Setting | Default hex | Purpose |
|---|---|---|
| Background (Papyrus) | `#F5F0E8` | Page background |
| Headlines / Dark (Obsidian) | `#1A1A1A` | H1–H6 |
| Body text (Warm Charcoal) | `#2C2A26` | Paragraphs |
| CTA / Accent (Ember) | `#E8593C` | Buttons, links |
| Borders / Hover (Desert Sand) | `#C4956A` | Dividers |
| Badges / Quality (Kohl Gold) | `#D4A24E` | Trust icons |
| Dividers / Disabled (Stone) | `#D4CFC5` | Muted borders |
| Caption text (Clay Earth) | `#6B5E4F` | Small text |
| Feeling accent: Emotions (Dusk Violet) | `#6B4C8A` | Emotion/feeling themes |
| Feeling accent: Zodiac (Kohl Gold Bright) | `#D4A24E` | Zodiac themes |

Font settings:

| Setting | Default | Action |
|---|---|---|
| Heading font stack | Avenir Next (brand spec) | Keep or switch to system fallback if preferred |
| Body font stack | Avenir Next (brand spec) | Keep or switch |

---

## Manual setup steps (Shopify Admin)

### Step A — Create metaobject definitions

1. **Settings → Custom data → Metaobjects**
2. Click **Add definition**
3. Create each definition from the tables above (`feeling`, `occasion`, `subfeeling`, `artist`)
4. Field types must match exactly (single-line text, multi-line text, file, color, boolean, metaobject_reference)

### Step B — Create metaobject entries

1. **Content → Metaobjects**
2. Select a definition (e.g., `feeling`)
3. Click **Add entry**
4. Fill in fields for each entry
5. Save

### Step C — Create collections

1. **Products → Collections → Create collection**
2. Set title, description, handle
3. Add products manually or via conditions
4. Save

### Step D — Link collection metafields

1. Open a collection
2. Scroll to **Metafields** section (bottom of page)
3. Click **Show all**
4. Set `custom.feeling` or `custom.occasion` to the matching metaobject entry
5. Save

### Step E — Create products and link metafields

1. **Products → Add product**
2. Fill title, description, price, variants, images
3. Scroll to **Metafields** section
4. Set `custom.story`, `custom.artist`, etc.
5. Save

### Step F — Create pages

1. **Online Store → Pages → Add page**
2. Set title, handle, content (optional — theme sections provide most content)
3. In **Theme template** dropdown on the right, select:
   - `page.feelings-hub`
   - `page.occasions-hub`
   - `page.gifts-hub`
   - `page.about-horo`
4. Save

### Step G — Configure theme in the editor

1. **Online Store → Themes → Customize**
2. Navigate through homepage sections and fill images / links / collections
3. Go to **Theme settings → HORO Brand** and verify colors
4. Go to **Theme settings → HORO Trust & Delivery** and verify text
5. Go to **Theme settings → HORO Gift Wrap** and select the Gift Wrap product
6. Save

### Step H — Update navigation

1. **Online Store → Navigation → Main menu**
2. Add links:
   - Feelings → `/pages/feelings`
   - Occasions → `/pages/occasions`
   - Gifts → `/pages/gifts`
   - About → `/pages/about`
   - FAQ → `/pages/faq`
   - Exchange → `/pages/exchange`
   - Size Guide → `/pages/size-guide`
3. Save

---

## Optional automation later

| Method | Feasibility | Notes |
|---|---|---|
| **Product CSV export/import** | Medium | Can bulk-import products, images, prices, variants. Metafields require CSV column mapping. |
| **Matrixify (Excelify)** | High | Best Shopify bulk tool. Can import products, collections, metaobjects, metafields, pages in one sheet. Paid app. |
| **Shopify Admin API / GraphQL** | High | Full automation possible. Requires API credentials and a script. Best for repeated syncs. |
| **Shopify CLI `shopify theme push`** | Already used | Pushes theme files only, not store data. |
| **Manual setup** | Immediate | Required for Phase 1. No automation needed for MVP launch. |

**Recommendation for Phase 1**: Use manual setup. It takes 1–2 hours and gives full control over images and copy. Automate later with Matrixify or Admin API when the catalog grows beyond 20 products.

---

## Final retest checklist

After all data is populated and the theme is re-customized, verify every surface:

### Homepage
- [ ] Hero image renders, text is readable
- [ ] Trust ribbon shows 5 badges
- [ ] Primary route cards show 3 images with labels
- [ ] Featured collection shows products
- [ ] Feeling grid shows feeling cards with images and names
- [ ] Occasion grid shows occasion cards with images and names
- [ ] Gift block shows gift occasions
- [ ] No horizontal overflow on mobile (375px)

### Hub pages
- [ ] `/pages/feelings` — shows all feeling cards
- [ ] `/pages/occasions` — shows all occasion cards
- [ ] `/pages/gifts` — shows only `is_gift_occasion = true` entries
- [ ] `/pages/about` — renders HORO About section content
- [ ] `/pages/faq` — FAQ accordions expand/collapse
- [ ] `/pages/exchange` — policy items render
- [ ] `/pages/size-guide` — size table renders

### Collections
- [ ] `/collections/feeling-cancer` — feeling hero renders with image + accent color
- [ ] `/collections/occasion-birthday` — occasion hero renders
- [ ] Normal collection (no metafield) — no custom hero, standard grid only
- [ ] Subfeeling nav appears when subfeelings match the feeling slug
- [ ] Product grid, filters, sorting work

### Product page
- [ ] Product images render in gallery
- [ ] Variant picker works (S/M/L)
- [ ] Add to cart works
- [ ] Product story renders (if metafields set)
- [ ] Artist card renders (if metafield set)
- [ ] Delivery/payment cards render
- [ ] Size guide renders (if metafield set)
- [ ] Gift wrap upsell appears (if gift wrap product configured in theme settings)
- [ ] Trust strip renders (if section settings enabled)
- [ ] Related products render

### Cart / Checkout
- [ ] Cart shows items, quantity +/- works, remove works
- [ ] Gift wrap can be added once, not duplicated
- [ ] COD checkout completes
- [ ] Instapay checkout completes
- [ ] Shipping rate appears
- [ ] Tax behavior is consistent

### Console / Mobile / RTL
- [ ] No red JS errors on homepage, product, collection, cart
- [ ] Mobile 375px: no overflow, buttons readable, images not broken
- [ ] Arabic RTL: layout direction correct (if Arabic enabled)

---

## Summary

| Area | Status | Next action |
|---|---|---|
| Theme code | ✅ Complete | Pushed to `medusa` |
| Metaobject definitions | ❌ Not created | Create in Admin (Step A) |
| Metaobject entries | ❌ Not created | Create 3 feelings, 3 occasions, 2 subfeelings, 1 artist |
| Collections | ❌ Not created | Create 6–7 collections with matching handles |
| Collection metafields | ❌ Not set | Link `custom.feeling` / `custom.occasion` |
| Products | ❌ Not created | Create 3 products + 1 gift wrap product |
| Product metafields | ❌ Not set | Add story, artist, size notes |
| Pages | Partial | Create `/pages/gifts` and `/pages/about`; verify others |
| Homepage images | ❌ Not uploaded | Upload hero + 3 primary route images in theme editor |
| Theme colors/fonts | ⚠️ May be unsaved | Re-save in Theme settings → HORO Brand |
| Navigation | ❌ Not updated | Update Main menu (Step H) |
| Gift wrap product | ❌ Not selected | Select in Theme settings → HORO Gift Wrap |

**Do not proceed to Phase 2 until this checklist is complete and the final retest passes.**
