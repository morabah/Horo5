# Phase 1.8 — Shopify Visual Adaptation to Web-next Report

## Objective
Adapt the Shopify Dawn-based HORO theme to visually feel closer to the custom Medusa/web-next storefront. This phase focused on:
- Creating a shared HORO visual system
- Cinematic homepage enhancements
- Editorial product card styling
- Collection page visual weight
- Hub page polish
- Cart/PDP copy refinement
- Validation with `shopify theme check`

## What was done

### PART A: Visual Parity Audit
Created `/docs/shopify-visual-parity-to-web-next-audit.md` comparing 15 areas:
- Homepage hero, feeling expression, route cards, featured products, trust ribbon, testimonials, final CTA
- Product cards, collection hero, editorial proof, filters, product page, cart, search, mobile experience
- Rated each area by gap severity, priority, and risk

### PART B: HORO Visual System CSS
Created `/shopify-theme/assets/component-horo-visual-system.css` with:
- Brand color tokens: obsidian, papyrus, linen, clay, warm-charcoal, deep-teal, stone, ember, amber-700
- Surface backgrounds: `.horo-surface--papyrus`, `.horo-surface--linen`, `.horo-surface--obsidian`
- Editorial typography: `.horo-eyebrow`, `.horo-heading--editorial`, `.horo-heading--large`, `.horo-body--editorial`
- Card utilities: `.horo-card`, `.horo-card--hover`, `.horo-card--paper`, `.horo-card--glass`
- Image treatments: `.horo-image--rounded`, `.horo-image--lift`
- Shadow utilities: `.horo-shadow--soft`, `.horo-shadow--medium`
- Button style: `.horo-btn--label`, `.horo-btn--label-dark`
- Chip/badge: `.horo-chip`
- Layout: `.horo-container`, `.horo-section-padding`
- Grain overlay reusable class: `.horo-grain`
- RTL-safe logical properties throughout
- `prefers-reduced-motion` respected
- Loaded globally in `layout/theme.liquid`

### PART C: Homepage Cinematic Adaptation
Enhanced `sections/home-hero.liquid`:
- New settings: `enable_cinematic_mode`, `show_grain_overlay`, `show_split_typography`
- Split typography with 3 editable lines (aria-hidden decorative text)
- Hero ribbon with editable trust text
- Separate CTA position selectors for desktop (`bottom-left` default) and mobile (`center` default)
- Legacy editorial word layer preserved

Enhanced `assets/component-home-hero.css`:
- `.home-hero--cinematic` uses `min-height: 100dvh` with stronger scrim
- `.home-hero--no-grain` hides grain overlay
- Split typography layer with low-opacity large text
- Hero ribbon at bottom with gradient background
- Desktop and mobile position systems using data attributes
- Mobile cinematic mode also uses full viewport height

Created new section `sections/horo-feeling-expression.liquid`:
- Eyebrow, large editorial heading, subheading, CTA button
- 3 expression cards with image, label, short text
- Hover lift and image zoom effects
- Added to `templates/index.json` between primary_routes and story_plan
- CSS: `assets/component-horo-feeling-expression.css`

Updated `templates/index.json`:
- Added `feeling_expression` section with default blocks (Mood, Sign, Attitude)
- Added new hero settings (cinematic off by default, grain on, ribbon on)
- Changed featured_collection title from "Featured products" to "Just Dropped"
- Desktop hero CTA position: bottom-left
- Mobile hero CTA position: center

### PART D: Product Card Adaptation
Enhanced `snippets/card-product.liquid`:
- Added `component-horo-product-card.css` include
- Wrapped card in `.horo-product-card` class
- Added chip display logic: checks `custom.subfeeling` metafield → `custom.fit_note` metafield → fallback "220 GSM cotton"
- Added artist credit display from `custom.artist` metafield
- Kept all Dawn quick-add, quick-view, and badge functionality intact

Created `assets/component-horo-product-card.css`:
- Rounded corners (`1.2rem`) and subtle border
- Hover lift with shadow (`translateY(-0.3rem)`)
- Image zoom on hover (`scale(1.03)`)
- Editorial heading typography
- Price styling with sale color (ember)
- Chip styling: uppercase, small, rounded, with backdrop blur
- Artist credit: clay color, uppercase, small
- Quick view button fades in on hover (desktop), always visible on mobile
- Card inner ratio set to 4:5 (`--ratio-percent: 125%`)
- `prefers-reduced-motion` respected

### PART E: Collection Page Adaptation
Enhanced `sections/collection-feeling-hero.liquid`:
- Added product count display (`{{ collection.products_count }} design(s)`)
- Added fallback blurb from `collection.description` if feeling blurb is blank

Enhanced `assets/component-collection-hero.css`:
- Added `.collection-hero__count` styling (uppercase, letter-spacing, light color)

Updated `sections/collection-related-routes.liquid`:
- Changed preset route_2 from "Shop gifts" to "Shop by occasion" with link to `/pages/occasions`

### PART F: Hub Pages Adaptation
Hub page templates (`page.feelings-hub.json`, `page.occasions-hub.json`, `page.gifts-hub.json`) already had strong copy from Phase 1.7b. Verified:
- Feelings hub: "Find the mood you wear" + editorial guide
- Occasions hub: "Dress for the moment" + editorial guide
- Gifts hub: "Say it without saying it" + editorial guide

### PART G: Product Page Visual Adaptation
Updated `templates/product.json`:
- Changed related-products heading from "You may also like" to "More pieces that fit"
- Existing sections (product_story, artist_card, delivery_payment, size_guide, trust_strip, gift_wrap) remain intact

### PART H: Cart Polish
Updated `templates/cart.json`:
- Changed cart_trust_explainer heading from "Quick info" to "What to expect"
- Changed featured-collection title from "Featured collection" to "Complete your look"

### PART I: Content Readiness
Audit document created in PART A notes areas needing admin content:
- Hero image for cinematic mode
- Feeling expression card images
- Product metafields: `custom.subfeeling`, `custom.fit_note`, `custom.artist`
- Collection metafields: `custom.editorial_heading`, `custom.editorial_text`, `custom.editorial_image`

### PART K: Validation
Ran `shopify theme check`:
- Result: **0 new errors, 0 new warnings** from this phase's changes
- Pre-existing: 2 errors in `sections/featured-product.liquid` (ValidSchemaTranslations — schema translation keys missing from `locales/en.default.schema.json`)
- Pre-existing: 24 warnings across 11 files (VariableName with underscore prefixes in gift-wrap snippets, RemoteAsset, UndefinedObject, UnusedAssign, OrphanedSnippet)
- All new files passed cleanly

## Files changed

### New files
- `docs/shopify-visual-parity-to-web-next-audit.md`
- `shopify-theme/assets/component-horo-visual-system.css`
- `shopify-theme/sections/horo-feeling-expression.liquid`
- `shopify-theme/assets/component-horo-feeling-expression.css`
- `shopify-theme/assets/component-horo-product-card.css`

### Modified files
- `shopify-theme/layout/theme.liquid` — load visual system CSS
- `shopify-theme/sections/home-hero.liquid` — cinematic mode settings, split typography, ribbon, CTA positions
- `shopify-theme/assets/component-home-hero.css` — cinematic styles, split typography, ribbon, responsive positioning
- `shopify-theme/snippets/card-product.liquid` — HORO wrapper, chip logic, artist credit
- `shopify-theme/sections/collection-feeling-hero.liquid` — product count, description fallback
- `shopify-theme/assets/component-collection-hero.css` — product count styling
- `shopify-theme/sections/collection-related-routes.liquid` — preset defaults
- `shopify-theme/templates/index.json` — feeling_expression section, hero settings, "Just Dropped" title
- `shopify-theme/templates/product.json` — related products heading
- `shopify-theme/templates/cart.json` — trust explainer heading, featured collection title

## What was NOT changed
- No checkout logic or payment/shipping settings
- No heavy JavaScript or React app rebuilding
- No fake reviews or predictive search
- No breaking Shopify Theme Editor flexibility
- All new settings have safe defaults (cinematic mode off by default)
- Dawn product form, cart drawer, and core commerce untouched

## Next steps for launch readiness
1. **Hero image**: Upload a high-quality hero image in Theme Editor and optionally enable cinematic mode
2. **Feeling expression cards**: Add card images and refine labels in Theme Editor
3. **Product metafields**: Populate `custom.subfeeling`, `custom.fit_note`, and `custom.artist` for richer cards
4. **Collection metafields**: Populate editorial content for collection pages
5. **Testimonial copy**: Replace sample quotes with real customer feedback before launch
6. **Schema translations**: Fix the 2 pre-existing `ValidSchemaTranslations` errors in `sections/featured-product.liquid`
