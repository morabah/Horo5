# HORO Shopify Implementation Sequence

> Step-by-step implementation guide for the HORO Dawn-based Shopify theme. Each step is atomic: implement, test, commit. If a step breaks Dawn behavior, roll back before proceeding.

---

## Base Theme

- **Theme**: Shopify Dawn
- **Version**: `v15.4.1` (commit `9ccdacf`, released December 2025)
- **Source**: https://github.com/Shopify/dawn/tree/v15.4.1
- **Fork into**: `shopify-theme/` at repo root

## Hard Rules

| Rule | Enforcement |
|---|---|
| Do not modify checkout | No changes to checkout.liquid, checkout CSS, or checkout extensibility in Phase 1 |
| Do not add apps | No Shopify app installations in Phase 1 |
| Do not create custom product form | Keep Dawn's `main-product.liquid` product form as-is |
| Do not create custom cart | Keep Dawn's `main-cart-items.liquid` and `main-cart-footer.liquid` as-is |
| Do not create custom gallery | Keep Dawn's media gallery inside `main-product.liquid` as-is |
| Do not create custom variant picker | Keep Dawn's variant picker inside `main-product.liquid` as-is |
| Payment work blocked | Steps requiring payment verification (marked 🔒) cannot proceed until Payment Feasibility Checklist (v2.1 §2) is manually completed |

## Payment Verification Gate

| Status | Meaning |
|---|---|
| 🔒 **Blocked** | Requires payment verification in Shopify Admin. Cannot proceed until checklist items pass. |
| ✅ **Unblocked** | Does not depend on payment setup. Can proceed immediately. |

---

## Step 0: Fork Dawn

**Status**: ✅ Unblocked

### What

Clone Dawn v15.4.1 into `shopify-theme/` at the repo root. Commit the unmodified fork as the baseline.

### Files Changed

- Entire `shopify-theme/` directory (new)

### Files Not Changed

- All existing project files (`web-next/`, `medusa-backend/`, etc.)

### Data Needed

- None

### Acceptance Criteria

- [ ] `shopify-theme/` contains the complete Dawn v15.4.1 source
- [ ] `git log` shows the Dawn source at tag `v15.4.1`
- [ ] Theme uploads to a Shopify development store without errors via Shopify CLI
- [ ] Default Dawn homepage renders correctly on the dev store

### Test Method

1. `shopify theme push --untheme` (or `shopify theme dev`) from `shopify-theme/`
2. Open dev store URL — verify Dawn homepage renders
3. Navigate to a product page — verify Dawn product page renders
4. Navigate to a collection page — verify Dawn collection renders
5. Navigate to cart — verify Dawn cart renders

### Rollback Plan

Delete `shopify-theme/` directory. Re-clone from Dawn v15.4.1.

---

## Step 0b: Create HORO_THEME_BASE.md

**Status**: ✅ Unblocked

### What

Create `shopify-theme/HORO_THEME_BASE.md` — a manifest file documenting the Dawn base version, the files that must never be modified, and the fork's purpose. This file serves as a permanent reference for anyone working on the theme.

### Files Changed

- `shopify-theme/HORO_THEME_BASE.md` — New file

### Files Not Changed

- All Dawn source files

### Data Needed

- Dawn version: v15.4.1
- Dawn commit: 9ccdacf
- List of files that must never be modified (from "Files That Must Never Be Changed" section below)

### Acceptance Criteria

- [ ] `HORO_THEME_BASE.md` exists in `shopify-theme/`
- [ ] Documents Dawn base version (v15.4.1, commit 9ccdacf)
- [ ] Lists all files that must never be modified
- [ ] Lists all files where minimal additions are allowed (with scope of allowed changes)
- [ ] States the purpose: HORO brand customization on top of Dawn, not a fork-and-rewrite

### Test Method

1. Verify file exists and is readable
2. Verify it references correct Dawn version
3. Verify it lists the same protected files as the "Files That Must Never Be Changed" section

### Rollback Plan

Delete `HORO_THEME_BASE.md`. Re-create from template.

---

## Step 1: HORO Brand Settings

**Status**: ✅ Unblocked

### What

Add HORO-specific entries to `config/settings_schema.json`. Do not remove or modify Dawn's existing schema entries — only append new groups.

### Files Changed

- `shopify-theme/config/settings_schema.json` — Append HORO brand settings groups

### Files Not Changed

- All Dawn sections, snippets, templates, layout, assets, locales

### Data Needed

- HORO brand colors (from brand guidelines)
- HORO typography choices
- Trust badge labels and icons
- Delivery rule defaults
- Gift wrap product handle (can be placeholder until product exists)

### Acceptance Criteria

- [ ] `settings_schema.json` contains new HORO groups appended after Dawn's existing groups
- [ ] Dawn's existing settings groups are untouched
- [ ] HORO settings appear in Shopify theme editor sidebar
- [ ] Changing HORO brand colors in the editor updates `settings_data.json`
- [ ] Theme still renders correctly after schema changes

### Test Method

1. `shopify theme push` the updated config
2. Open theme editor → verify HORO settings group appears
3. Change a brand color → save → verify it persists
4. View storefront → verify Dawn still renders correctly

### Rollback Plan

Revert `config/settings_schema.json` to the Dawn v15.4.1 original. Re-push theme.

---

## Step 2: Locale Keys

**Status**: ✅ Unblocked

### What

Add HORO-specific translation keys to `locales/en.default.json` and create `locales/ar.json` with Arabic translations for Tier 1 strings. Do not remove Dawn's existing keys — only add new ones under a `horo` namespace.

### Files Changed

- `shopify-theme/locales/en.default.json` — Add `horo.*` keys
- `shopify-theme/locales/ar.json` — New file with Arabic translations

### Files Not Changed

- All Dawn sections, snippets, templates, layout, assets, config

### Data Needed

- Complete list of Tier 1 strings (from v2.1 §6.2):
  - Navigation labels
  - Button text (Add to Cart, Checkout, Filter, Sort)
  - Trust strip copy
  - Delivery/payment card copy
  - Cart/checkout UI strings
  - Policy page labels
  - Size guide labels

### Acceptance Criteria

- [ ] `en.default.json` contains all Dawn keys + new `horo.*` keys
- [ ] `ar.json` exists with Arabic translations for all Tier 1 strings
- [ ] Dawn's existing translation keys are untouched
- [ ] Switching to Arabic locale in Shopify Markets renders Dawn's UI in Arabic
- [ ] `{{ 'horo.home_hero.title' | t }}` resolves correctly in both locales

### Test Method

1. `shopify theme push` the updated locales
2. Set store to English → verify Dawn UI still renders in English
3. Set store to Arabic → verify Dawn UI renders in Arabic (Dawn's built-in keys)
4. Create a test snippet with `{{ 'horo.home_hero.title' | t }}` → verify it outputs the correct string in both locales

### Rollback Plan

Revert `en.default.json` to Dawn original. Delete `ar.json`. Re-push.

---

## Step 3: Layout — Arabic Font + RTL

**Status**: ✅ Unblocked

### What

Add Arabic font loading to `layout/theme.liquid`. Add minimal CSS for Arabic font stack and RTL adjustments for custom sections. Do not modify Dawn's existing CSS or layout structure — only append.

### Files Changed

- `shopify-theme/layout/theme.liquid` — Add Arabic font `<link>` in `<head>` (after Dawn's existing font loading)
- `shopify-theme/assets/base.css` — Append `:lang(ar)` font-family override and custom section RTL rules at the end of the file

### Files Not Changed

- All Dawn sections, snippets, templates (other than layout)
- Dawn's existing CSS rules (only append, never modify)

### Data Needed

- Arabic font choice (recommended: Noto Sans Arabic or Cairo from Google Fonts)

### Acceptance Criteria

- [ ] Arabic font loads when locale is Arabic (check Network tab)
- [ ] `:lang(ar)` CSS override applies Arabic font to body text
- [ ] Dawn's English rendering is unchanged
- [ ] Dawn's existing RTL behavior (via `dir="rtl"`) still works
- [ ] No layout shift when switching between EN and AR

### Test Method

1. `shopify theme push` the updated layout + CSS
2. View storefront in English → verify no visual changes from Step 0
3. Switch to Arabic → verify Arabic font loads and renders
4. Check Dawn's product page in Arabic → verify variant picker, gallery, cart still work in RTL
5. Lighthouse Performance → verify no font-loading regression (LCP < 4s)

### Rollback Plan

Revert `theme.liquid` and `base.css` to Dawn originals. Re-push.

---

## Step 4: home-hero.liquid

**Status**: ✅ Unblocked

### What

Create the first custom section: `sections/home-hero.liquid`. Full-bleed hero with "Wear What You Mean" headline. Add only the CSS required for this section in a new file `assets/component-home-hero.css`.

### Files Changed

- `shopify-theme/sections/home-hero.liquid` — New file
- `shopify-theme/assets/component-home-hero.css` — New file
- `shopify-theme/templates/index.json` — Replace Dawn's hero section with `home-hero`

### Files Not Changed

- All Dawn sections (header, footer, featured-collection, etc.)
- All Dawn snippets
- Dawn's `base.css`, `theme.js`
- All other templates

### Data Needed

- Hero image URL (can use placeholder initially)
- Hero headline text ("Wear What You Mean")
- Hero CTA label and link
- Section schema settings for image, headline, CTA (editable in theme editor)

### Acceptance Criteria

- [ ] `home-hero.liquid` renders a full-bleed hero with image, headline, and CTA
- [ ] Section is configurable in Shopify theme editor (image, headline, CTA)
- [ ] Hero renders correctly on mobile (375px) and desktop (1440px)
- [ ] Hero renders correctly in RTL (Arabic locale)
- [ ] `component-home-hero.css` is the only new CSS file
- [ ] Dawn's other homepage sections still render below the hero
- [ ] No JavaScript added (CSS-only layout)

### Test Method

1. `shopify theme push` the new section + CSS + updated template
2. Open homepage → verify hero renders with placeholder image
3. Open theme editor → verify hero section settings appear and are editable
4. Change hero image in editor → save → verify it updates on storefront
5. Switch to Arabic → verify hero renders in RTL with Arabic text
6. Test on 375px viewport → verify responsive behavior
7. Verify Dawn's other sections (featured-collection, etc.) still render below hero

### Rollback Plan

1. Revert `templates/index.json` to use Dawn's original hero section
2. Delete `sections/home-hero.liquid` and `assets/component-home-hero.css`
3. Re-push

---

## Step 5: home-trust-ribbon.liquid (or Dawn custom-liquid)

**Status**: ✅ Unblocked

### What

Add a trust ribbon strip below the hero. **Try Dawn's `custom-liquid` block first**: add a custom-liquid block to the homepage template with trust badge HTML. If Dawn's custom-liquid rendering is insufficient (wrong layout, no icon support), build `sections/home-trust-ribbon.liquid`.

### Files Changed (if Dawn custom-liquid works)

- `shopify-theme/templates/index.json` — Add custom-liquid block with trust ribbon HTML

### Files Changed (if custom section needed)

- `shopify-theme/sections/home-trust-ribbon.liquid` — New file
- `shopify-theme/assets/component-home-trust-ribbon.css` — New file
- `shopify-theme/templates/index.json` — Add `home-trust-ribbon` section

### Files Not Changed

- All Dawn sections (other than template JSON)
- All Dawn snippets
- Dawn's `base.css`, `theme.js`

### Data Needed

- Trust badge labels: Artist-made, Printed in Egypt, COD, 14-day exchange, WhatsApp
- Trust badge icons (SVG or icon font)

### Acceptance Criteria

- [ ] Trust ribbon renders below hero on homepage
- [ ] All 5 trust badges display with icons and labels
- [ ] Trust ribbon renders correctly on mobile (horizontal scroll or wrap)
- [ ] Trust ribbon renders correctly in RTL (Arabic)
- [ ] If using custom-liquid: no new section file needed
- [ ] If using custom section: section is editable in theme editor

### Test Method

1. Add custom-liquid block to homepage template with trust ribbon HTML
2. Push and verify rendering
3. If layout is wrong or icons don't work → build custom section instead
4. Test on mobile + RTL
5. Verify Dawn sections below still render correctly

### Rollback Plan

Remove the custom-liquid block or custom section from `templates/index.json`. Re-push.

---

## Step 6: home-primary-routes.liquid

**Status**: ✅ Unblocked

### What

Create `sections/home-primary-routes.liquid` — 3-card navigation: Feelings, Occasions, Gifts. Add CSS in `assets/component-home-primary-routes.css`.

### Files Changed

- `shopify-theme/sections/home-primary-routes.liquid` — New file
- `shopify-theme/assets/component-home-primary-routes.css` — New file
- `shopify-theme/templates/index.json` — Add section

### Files Not Changed

- All Dawn sections, snippets, base CSS, theme.js

### Data Needed

- 3 route labels and links (Feelings → `/pages/feelings`, Occasions → `/pages/occasions`, Gifts → `/pages/gifts`)
- Accent colors per route (from brand guidelines)
- Card images (can use placeholders)

### Acceptance Criteria

- [ ] 3 cards render with images, labels, and links
- [ ] Cards are configurable in theme editor (image, label, link per card)
- [ ] Responsive: 3 columns on desktop, stacked on mobile
- [ ] RTL renders correctly
- [ ] Dawn sections above/below still render

### Test Method

1. Push and verify 3-card layout on homepage
2. Click each card → verify navigation to correct page (pages don't exist yet; 404 is acceptable)
3. Test on mobile → verify stacking
4. Test in Arabic → verify RTL

### Rollback Plan

Remove section from `templates/index.json`. Delete section + CSS files. Re-push.

---

## Step 7: home-feeling-grid.liquid

**Status**: ✅ Unblocked

### What

Create `sections/home-feeling-grid.liquid` — reads `custom.feeling` metaobject entries and renders a card grid. Add CSS in `assets/component-home-feeling-grid.css`. Add `snippets/feeling-card.liquid` for individual card rendering.

### Files Changed

- `shopify-theme/sections/home-feeling-grid.liquid` — New file
- `shopify-theme/snippets/feeling-card.liquid` — New file
- `shopify-theme/assets/component-home-feeling-grid.css` — New file
- `shopify-theme/templates/index.json` — Add section

### Files Not Changed

- All Dawn sections, snippets (other than new), base CSS, theme.js

### Data Needed

- `custom.feeling` metaobject definition created in Shopify Admin
- At least 2 feeling metaobject entries with card_image, name, blurb, slug
- Feeling collection handles matching `feeling-{slug}`

### Acceptance Criteria

- [ ] Feeling grid renders all active `custom.feeling` metaobject entries
- [ ] Each card shows image, name, and blurb
- [ ] Each card links to the corresponding feeling collection (`/collections/feeling-{slug}`)
- [ ] Responsive: 2 columns on mobile, 3+ on desktop
- [ ] RTL renders correctly
- [ ] Section has settings for heading text and grid columns (editable in theme editor)

### Test Method

1. Create `custom.feeling` metaobject definition in Admin (if not already done)
2. Create 2 test feeling entries with images
3. Push section + snippet + CSS
4. Verify grid renders on homepage
5. Click a feeling card → verify it navigates to the collection (404 is acceptable if collection doesn't exist yet)
6. Test mobile + RTL

### Rollback Plan

Remove section from template. Delete section + snippet + CSS. Re-push.

---

## Step 8: home-occasion-grid.liquid

**Status**: ✅ Unblocked

### What

Create `sections/home-occasion-grid.liquid` — reads `custom.occasion` metaobject entries and renders a card grid. Add CSS in `assets/component-home-occasion-grid.css`. Add `snippets/occasion-card.liquid`.

### Files Changed

- `shopify-theme/sections/home-occasion-grid.liquid` — New file
- `shopify-theme/snippets/occasion-card.liquid` — New file
- `shopify-theme/assets/component-home-occasion-grid.css` — New file
- `shopify-theme/templates/index.json` — Add section

### Files Not Changed

- All Dawn sections, snippets (other than new), base CSS, theme.js

### Data Needed

- `custom.occasion` metaobject definition created in Shopify Admin
- At least 2 occasion metaobject entries with card_image, name, blurb, slug
- Occasion collection handles matching `occasion-{slug}`

### Acceptance Criteria

- [ ] Occasion grid renders all active `custom.occasion` metaobject entries
- [ ] Each card shows image, name, and blurb
- [ ] Each card links to the corresponding occasion collection
- [ ] Responsive + RTL
- [ ] Section editable in theme editor

### Test Method

Same pattern as Step 7, substituting occasions for feelings.

### Rollback Plan

Same pattern as Step 7.

---

## Step 9: Gift Block (Dawn rich-text or custom)

**Status**: ✅ Unblocked

### What

Add a gift-ready CTA block. **Try Dawn's `rich-text` section first**: add it to the homepage template with gift-themed headline, body, and CTA button linking to `/pages/gifts`. If the visual treatment is insufficient, build `sections/home-gift-block.liquid`.

### Files Changed (if Dawn rich-text works)

- `shopify-theme/templates/index.json` — Add `rich-text` section with gift content

### Files Changed (if custom section needed)

- `shopify-theme/sections/home-gift-block.liquid` — New file
- `shopify-theme/assets/component-home-gift-block.css` — New file
- `shopify-theme/templates/index.json` — Add section

### Files Not Changed

- Dawn sections (other than template JSON), snippets, base CSS, theme.js

### Data Needed

- Gift block headline, body text, CTA label, CTA link (`/pages/gifts`)
- Optional: gift block image

### Acceptance Criteria

- [ ] Gift CTA renders on homepage
- [ ] CTA links to `/pages/gifts` (page doesn't exist yet; 404 is acceptable)
- [ ] Responsive + RTL
- [ ] If using Dawn `rich-text`: no new section file needed

### Test Method

1. Add Dawn `rich-text` section to homepage template with gift content
2. Push and verify rendering
3. If visual treatment is insufficient → build custom section
4. Test mobile + RTL

### Rollback Plan

Remove section from template. Delete custom section + CSS if created. Re-push.

---

## Step 10: Homepage Integration Test

**Status**: ✅ Unblocked

### What

Verify the complete homepage renders with all sections in the correct order. No new files — only verification.

### Files Changed

- None (verification only)

### Data Needed

- All data from Steps 4–9 in place

### Acceptance Criteria

- [ ] Homepage renders: hero → trust ribbon → primary routes → featured collection (Dawn) → feeling grid → occasion grid → gift block → featured product (Dawn)
- [ ] All sections are editable in theme editor
- [ ] All sections render correctly on mobile (375px)
- [ ] All sections render correctly in Arabic RTL
- [ ] Lighthouse Performance ≥ 70 on mobile
- [ ] LCP < 4s on mobile
- [ ] CLS < 0.1
- [ ] No JavaScript errors in console

### Test Method

1. Full homepage walkthrough on desktop
2. Full homepage walkthrough on mobile (375px Chrome DevTools)
3. Switch to Arabic → full walkthrough in RTL
4. Run Lighthouse audit on homepage
5. Check browser console for JS errors

### Rollback Plan

N/A — verification step only. If issues found, roll back the specific step that introduced the problem.

---

## Step 11: feelings-hub.liquid + Page Template

**Status**: ✅ Unblocked

### What

Create `sections/feelings-hub.liquid` and `templates/page.feelings-hub.json`. The section reads all active `custom.feeling` metaobject entries and renders them as a full-page grid (reusing `snippets/feeling-card.liquid` from Step 7).

### Files Changed

- `shopify-theme/sections/feelings-hub.liquid` — New file
- `shopify-theme/templates/page.feelings-hub.json` — New file

### Files Not Changed

- All Dawn sections, snippets, base CSS, theme.js, other templates

### Data Needed

- `custom.feeling` metaobject entries (from Step 7)
- A page created in Shopify Admin with template `page.feelings-hub`

### Acceptance Criteria

- [ ] `/pages/feelings` renders a grid of all active feeling cards
- [ ] Each card links to its feeling collection
- [ ] Responsive + RTL
- [ ] Page uses Dawn's header and footer

### Test Method

1. Create page in Admin with `feelings-hub` template
2. Push section + template
3. Navigate to `/pages/feelings` → verify grid renders
4. Test mobile + RTL

### Rollback Plan

Delete template + section. Reassign page to default template in Admin. Re-push.

---

## Step 12: occasions-hub.liquid + Page Template

**Status**: ✅ Unblocked

### What

Create `sections/occasions-hub.liquid` and `templates/page.occasions-hub.json`. Reads all active `custom.occasion` metaobject entries. Reuses `snippets/occasion-card.liquid`.

### Files Changed

- `shopify-theme/sections/occasions-hub.liquid` — New file
- `shopify-theme/templates/page.occasions-hub.json` — New file

### Files Not Changed

- All Dawn sections, snippets, base CSS, theme.js, other templates

### Data Needed

- `custom.occasion` metaobject entries (from Step 8)
- A page created in Admin with template `page.occasions-hub`

### Acceptance Criteria

- [ ] `/pages/occasions` renders a grid of all active occasion cards
- [ ] Each card links to its occasion collection
- [ ] Responsive + RTL

### Test Method

Same pattern as Step 11.

### Rollback Plan

Same pattern as Step 11.

---

## Step 13: gifts-hub.liquid + Page Template

**Status**: ✅ Unblocked

### What

Create `sections/gifts-hub.liquid` and `templates/page.gifts-hub.json`. Reads `custom.occasion` metaobject entries filtered by `is_gift_occasion=true`.

### Files Changed

- `shopify-theme/sections/gifts-hub.liquid` — New file
- `shopify-theme/templates/page.gifts-hub.json` — New file

### Files Not Changed

- All Dawn sections, snippets, base CSS, theme.js, other templates

### Data Needed

- `custom.occasion` entries with `is_gift_occasion=true` set
- A page created in Admin with template `page.gifts-hub`

### Acceptance Criteria

- [ ] `/pages/gifts` renders only occasions where `is_gift_occasion=true`
- [ ] Non-gift occasions do not appear
- [ ] Responsive + RTL

### Test Method

1. Set `is_gift_occasion=true` on at least 2 test occasions
2. Create page with `gifts-hub` template
3. Push and verify only gift occasions render
4. Test mobile + RTL

### Rollback Plan

Same pattern as Step 11.

---

## Step 14: collection-feeling-hero.liquid

**Status**: ✅ Unblocked

### What

Create `sections/collection-feeling-hero.liquid` — reads the collection's `custom.feeling` metaobject reference and renders a hero banner with image, blurb, accent color. Add CSS in `assets/component-collection-hero.css`.

### Files Changed

- `shopify-theme/sections/collection-feeling-hero.liquid` — New file
- `shopify-theme/assets/component-collection-hero.css` — New file
- `shopify-theme/templates/collection.json` — Add section above Dawn's product grid

### Files Not Changed

- Dawn's `main-collection-product-grid.liquid`
- Dawn's `product-card.liquid` snippet
- Dawn's filter/sort behavior
- All other Dawn sections and snippets

### Data Needed

- At least 1 feeling collection with `custom.feeling` metaobject reference set
- Feeling metaobject entry with hero_image, blurb, accent_color

### Acceptance Criteria

- [ ] Feeling collection page renders hero with metaobject-driven image, blurb, accent color
- [ ] Dawn's product grid renders below the hero
- [ ] Dawn's sort and filter still work
- [ ] Responsive + RTL
- [ ] Non-feeling collections (e.g. `all`) render without errors (section gracefully hides if no feeling reference)

### Test Method

1. Create a feeling collection in Admin with `custom.feeling` metafield set
2. Push section + CSS + updated template
3. Navigate to the feeling collection → verify hero + product grid
4. Navigate to `all` collection → verify it renders without hero (no error)
5. Test Dawn's sort dropdown → verify it still works
6. Test Dawn's filter UI → verify it still works
7. Test mobile + RTL

### Rollback Plan

Remove section from `collection.json`. Delete section + CSS. Re-push. Dawn collection template reverts to default.

---

## Step 15: collection-occasion-hero.liquid

**Status**: ✅ Unblocked

### What

Create `sections/collection-occasion-hero.liquid` — same pattern as Step 14 but reads `custom.occasion` metaobject reference. Reuse `component-collection-hero.css` from Step 14.

### Files Changed

- `shopify-theme/sections/collection-occasion-hero.liquid` — New file
- `shopify-theme/templates/collection.json` — Add section (conditional: render only if `custom.occasion` reference exists)

### Files Not Changed

- Dawn's collection product grid, filters, sort
- `component-collection-hero.css` (reused from Step 14)

### Data Needed

- At least 1 occasion collection with `custom.occasion` metaobject reference set

### Acceptance Criteria

- [ ] Occasion collection renders hero with metaobject-driven image, blurb, accent
- [ ] Dawn product grid + filters still work below
- [ ] Non-occasion collections render without errors

### Test Method

Same pattern as Step 14, substituting occasions.

### Rollback Plan

Same pattern as Step 14.

---

## Step 16: collection-subfeeling-nav.liquid

**Status**: ✅ Unblocked

### What

Create `sections/collection-subfeeling-nav.liquid` — reads the parent feeling's `custom.subfeeling` metaobject entries and renders them as filter pills. Clicking a pill filters the collection by the corresponding `line:*` tag.

> ⚠️ **WARNING**: Subfeeling filter URLs must follow Shopify's actual filter URL format. Do not guess the format. Shopify's filter URL structure varies by filter type (tag, metafield, option) and may use query parameters like `?filter.p.tag=line%3Azodiac` or path-based formats. **Before implementing this section**, verify the exact URL format by:
> 1. Enabling tag-based filters on a test collection in Shopify Admin
> 2. Clicking a filter in the storefront
> 3. Observing the URL format Shopify generates
> 4. Using that exact format for subfeeling pill links
>
> The filter URL format may change between Shopify/Dawn versions. Always verify against the live store.

### Files Changed

- `shopify-theme/sections/collection-subfeeling-nav.liquid` — New file
- `shopify-theme/templates/collection.json` — Add section between hero and product grid

### Files Not Changed

- Dawn's filter/sort UI (the subfeeling nav supplements it, doesn't replace it)
- Dawn's product grid

### Data Needed

- At least 1 feeling with subfeeling metaobject entries
- Products tagged with `line:*` tags matching subfeeling slugs

### Acceptance Criteria

- [ ] Subfeeling pills render on feeling collection pages
- [ ] Clicking a pill filters the collection by tag
- [ ] Dawn's native filter UI still works alongside
- [ ] Pills do not render on non-feeling collections
- [ ] Responsive + RTL

### Test Method

1. Create subfeeling metaobject entries linked to a feeling
2. Tag products with `line:zodiac`, `line:emotions`, etc.
3. Push section + updated template
4. Navigate to feeling collection → verify pills render
5. Click a pill → verify products filter correctly
6. Verify Dawn's filter dropdown still works
7. Navigate to `all` collection → verify no pills render

### Rollback Plan

Remove section from template. Delete section file. Re-push.

---

## Step 17: product-story.liquid

**Status**: ✅ Unblocked

### What

Create `sections/product-story.liquid` — reads `custom.story` and `custom.story_description` metafields and renders a collapsible story block on the PDP. Add CSS in `assets/component-product-story.css`.

### Files Changed

- `shopify-theme/sections/product-story.liquid` — New file
- `shopify-theme/assets/component-product-story.css` — New file
- `shopify-theme/templates/product.json` — Add section below Dawn's `main-product`

### Files Not Changed

- Dawn's `main-product.liquid` (gallery, variant picker, add-to-cart)
- Dawn's `related-products.liquid`
- Dawn's `share` snippet

### Data Needed

- At least 1 product with `custom.story` and `custom.story_description` metafields set

### Acceptance Criteria

- [ ] Story section renders on PDP below the buy box
- [ ] `custom.story` renders as visible text
- [ ] `custom.story_description` renders as a collapsible accordion
- [ ] Products without story metafields render the section gracefully (hidden or empty)
- [ ] Responsive + RTL
- [ ] Dawn's product form, gallery, and variant picker are unaffected

### Test Method

1. Set `custom.story` and `custom.story_description` on a test product
2. Push section + CSS + updated template
3. Navigate to product page → verify story renders below buy box
4. Verify Dawn's gallery, variant picker, add-to-cart still work
5. Navigate to a product without story metafields → verify no error
6. Test mobile + RTL

### Rollback Plan

Remove section from `product.json`. Delete section + CSS. Re-push.

---

## Step 18: product-artist-card.liquid

**Status**: ✅ Unblocked

### What

Create `sections/product-artist-card.liquid` — reads `custom.artist` metaobject reference and renders artist name, avatar, and style. Add CSS in `assets/component-product-artist-card.css`.

### Files Changed

- `shopify-theme/sections/product-artist-card.liquid` — New file
- `shopify-theme/assets/component-product-artist-card.css` — New file
- `shopify-theme/templates/product.json` — Add section

### Files Not Changed

- Dawn's `main-product.liquid`, `related-products.liquid`, `share` snippet

### Data Needed

- At least 1 product with `custom.artist` metaobject reference set
- At least 1 artist metaobject entry with name, avatar_image, style

### Acceptance Criteria

- [ ] Artist card renders on PDP with name, avatar, and style
- [ ] Products without artist reference render gracefully (section hidden)
- [ ] Responsive + RTL
- [ ] Dawn's product form unaffected

### Test Method

1. Set `custom.artist` on a test product
2. Push section + CSS + updated template
3. Navigate to product → verify artist card renders
4. Navigate to product without artist → verify no error
5. Test mobile + RTL

### Rollback Plan

Same pattern as Step 17.

---

## Step 19: product-delivery-payment.liquid

**Status**: ✅ Unblocked

### What

Create `sections/product-delivery-payment.liquid` — reads store metafield `custom.delivery_rules` and renders delivery windows and payment method icons. Add CSS in `assets/component-product-delivery-payment.css`.

### Files Changed

- `shopify-theme/sections/product-delivery-payment.liquid` — New file
- `shopify-theme/assets/component-product-delivery-payment.css` — New file
- `shopify-theme/templates/product.json` — Add section

### Files Not Changed

- Dawn's `main-product.liquid`, `related-products.liquid`

### Data Needed

- Store metafield `custom.delivery_rules` set with delivery window data

### Acceptance Criteria

- [ ] Delivery/payment section renders on PDP
- [ ] Delivery windows display correctly (e.g. "Cairo: 1–2 days, Alexandria: 2–3 days")
- [ ] Payment method icons display (COD, card, Instapay)
- [ ] Responsive + RTL

### Test Method

1. Set `custom.delivery_rules` store metafield
2. Push section + CSS + updated template
3. Navigate to product → verify section renders
4. Test mobile + RTL

### Rollback Plan

Same pattern as Step 17.

---

## Step 20: product-size-guide.liquid + size-guide-page.liquid

**Status**: ✅ Unblocked

### What

Create two sections:
1. `sections/product-size-guide.liquid` — inline on PDP, reads `custom.fit_by_size` and `custom.size_table_key` metafields
2. `sections/size-guide-page.liquid` — standalone page, reads store metafield `custom.size_tables`

Add CSS in `assets/component-product-size-guide.css`. Create `templates/page.size-guide.json`.

### Files Changed

- `shopify-theme/sections/product-size-guide.liquid` — New file
- `shopify-theme/sections/size-guide-page.liquid` — New file
- `shopify-theme/assets/component-product-size-guide.css` — New file
- `shopify-theme/templates/product.json` — Add section
- `shopify-theme/templates/page.size-guide.json` — New file

### Files Not Changed

- Dawn's `main-product.liquid`, `related-products.liquid`

### Data Needed

- At least 1 product with `custom.fit_by_size` JSON metafield set
- Store metafield `custom.size_tables` with preset data
- A page created in Admin with template `page.size-guide`

### Acceptance Criteria

- [ ] PDP size guide renders as collapsible block with measurement table
- [ ] "Size guide" link in variant selector area opens the collapsible
- [ ] Standalone `/pages/size-guide` renders all size presets from store metafield
- [ ] Both sections read from the same data structure
- [ ] Responsive + RTL
- [ ] Dawn's variant picker unaffected

### Test Method

1. Set `custom.fit_by_size` on a test product
2. Set `custom.size_tables` store metafield
3. Create size-guide page in Admin
4. Push sections + CSS + templates
5. Verify PDP inline size guide renders and collapses/expands
6. Verify standalone page renders all presets
7. Test mobile + RTL

### Rollback Plan

Remove sections from templates. Delete section + CSS + template files. Re-push.

---

## Step 21: gift-wrap-upsell.liquid (Snippet)

**Status**: ✅ Unblocked (functionally), 🔒 Blocked (end-to-end payment test)

### What

Create `snippets/gift-wrap-upsell.liquid` — renders a checkbox on PDP and a link in cart. On check/click, adds gift-wrap variant via Shopify Ajax API. Includes duplicate prevention logic.

### Files Changed

- `shopify-theme/snippets/gift-wrap-upsell.liquid` — New file
- `shopify-theme/assets/theme.js` — Append gift wrap Ajax logic (minimal addition at end of file)
- `shopify-theme/templates/product.json` — Add `custom_liquid` block with gift wrap upsell HTML/JS (or add a separate `gift-wrap-upsell` section below `main-product`)
- `shopify-theme/sections/cart-gift-wrap-upsell.liquid` — New section for cart gift wrap upsell
- `shopify-theme/templates/cart.json` — Add `cart-gift-wrap-upsell` section

### Files Not Changed

- Dawn's `main-product.liquid` — **Not edited**; gift wrap is added via product.json block or separate section
- Dawn's `main-cart-items.liquid` — **Not edited**; gift wrap is a separate section in cart.json
- Dawn's `main-cart-footer.liquid` — **Not edited**
- Dawn's product form logic, variant picker, gallery, cart quantity controls
- Dawn's CSS files

### Data Needed

- Gift wrap product created in Admin (tagged `gift-wrap`, excluded from collections)
- Store metafield `custom.gift_wrap_product` set as `product_reference`
- Gift wrap product variant ID

### Acceptance Criteria

- [ ] Gift wrap checkbox renders below add-to-cart on PDP
- [ ] Checking the box adds gift wrap to cart via Ajax
- [ ] Gift wrap cannot be added twice (duplicate prevention)
- [ ] Gift wrap appears as a line item in Dawn's cart
- [ ] Gift wrap can be removed via Dawn's native quantity controls
- [ ] Gift wrap product does not appear in automated collections
- [ ] Gift wrap price is included in cart subtotal

### Test Method

1. Create gift wrap product in Admin
2. Set store metafield
3. Push snippet + section + JS changes + template updates
4. Add a product to cart → verify no gift wrap
5. Check gift wrap checkbox on PDP → verify it adds to cart
6. Check again → verify duplicate prevention message
7. Go to cart → verify gift wrap line item appears and cart-gift-wrap-upsell section renders
8. Remove gift wrap → verify it's removed
9. Verify gift wrap product doesn't appear in `/collections/all`

### Rollback Plan

1. Remove gift-wrap-upsell block/section from `product.json`
2. Remove `cart-gift-wrap-upsell` section from `cart.json`
3. Revert `theme.js` to pre-gift-wrap version
4. Delete snippet + section files
5. Re-push

---

## Step 22: Trust Strip on PDP (Dawn custom-liquid or custom section)

**Status**: ✅ Unblocked

### What

Add a trust strip to the PDP. **Try Dawn's `custom-liquid` block first**: add a custom-liquid block to the product template with trust strip HTML. If insufficient, build `sections/product-trust-strip.liquid`.

### Files Changed (if Dawn custom-liquid works)

- `shopify-theme/templates/product.json` — Add custom-liquid block

### Files Changed (if custom section needed)

- `shopify-theme/sections/product-trust-strip.liquid` — New file
- `shopify-theme/assets/component-product-trust-strip.css` — New file
- `shopify-theme/templates/product.json` — Add section

### Files Not Changed

- Dawn's `main-product.liquid`, `related-products.liquid`

### Data Needed

- Trust strip labels: Artist-made design, Licensed art, Free exchange 14d, COD available

### Acceptance Criteria

- [ ] Trust strip renders on PDP
- [ ] Responsive + RTL
- [ ] Dawn's product form unaffected

### Test Method

1. Add custom-liquid block to product template
2. Push and verify
3. If insufficient → build custom section
4. Test mobile + RTL

### Rollback Plan

Remove from template. Delete custom section if created. Re-push.

---

## Step 23: About / FAQ / Exchange Pages (Dawn Sections Only)

**Status**: ✅ Unblocked

### What

Create About, FAQ, and Exchange policy pages using only Dawn's built-in sections (`rich-text`, `collapsible-content`, `image-with-text`). No custom sections.

### Files Changed

- None (configure pages in Shopify Admin using Dawn sections)

### Files Not Changed

- All theme files

### Data Needed

- About page content (brand story text + images)
- FAQ questions and answers
- Exchange policy text

### Acceptance Criteria

- [ ] `/pages/about` renders with Dawn's `rich-text` + `image-with-text` sections
- [ ] `/pages/faq` renders with Dawn's `collapsible-content` section
- [ ] `/pages/exchange` renders with Dawn's `rich-text` section
- [ ] All pages render correctly in Arabic RTL

### Test Method

1. Create pages in Admin and configure Dawn sections
2. Navigate to each page → verify content renders
3. Switch to Arabic → verify RTL rendering

### Rollback Plan

Delete pages in Admin. No theme file changes to revert.

---

## Step 24: Payment Verification 🔒

**Status**: 🔒 **Blocked** — Cannot proceed until Payment Feasibility Checklist is manually verified

### What

Complete all items in the Payment Feasibility Checklist (v2.1 §2). This is not a coding step — it's an administrative verification step that unblocks Step 25.

### Files Changed

- None

### Data Needed

- Shopify Admin access to a development store with Egypt region + EGP currency
- PayTabs (or chosen gateway) merchant account
- Instapay payout account details

### Acceptance Criteria

- [ ] COD manual payment method enabled and tested with a test order
- [ ] Card gateway (PayTabs or selected) enabled and tested with a test transaction
- [ ] EGP processing and settlement confirmed with gateway provider
- [ ] Fawry/Meeza support confirmed if needed
- [ ] Instapay manual bank transfer enabled with clear customer-facing wording
- [ ] Instapay test order placed and manually marked as paid
- [ ] Gift wrap + COD test order completed
- [ ] Gift wrap + card test order completed

### Test Method

Place real test orders in Shopify Admin for each payment method. Verify order status, payment capture, and confirmation emails.

### Rollback Plan

N/A — administrative step. If a payment method fails verification, document the failure and adjust the payment stack before proceeding.

---

## Step 25: End-to-End Checkout Flow Test 🔒

**Status**: 🔒 **Blocked** — Depends on Step 24

### What

Test the complete purchase flow from browse → PDP → cart → checkout → order confirmation for all payment methods. Verify gift wrap works with each method.

### Files Changed

- None (verification only)

### Data Needed

- All payment methods verified (Step 24)
- Test products with correct pricing in EGP
- Gift wrap product

### Acceptance Criteria

- [ ] COD: browse → add to cart → checkout → select COD → order confirmed → order appears in Admin as "Payment pending"
- [ ] Card: browse → add to cart → checkout → select PayTabs → payment captured → order confirmed
- [ ] Instapay: browse → add to cart → checkout → select bank transfer → order confirmed with instructions → manually mark paid
- [ ] Gift wrap + COD: add product + gift wrap → checkout → COD → both line items in order
- [ ] Gift wrap + card: add product + gift wrap → checkout → PayTabs → both line items in order
- [ ] Order confirmation emails sent for all methods
- [ ] Arabic checkout renders correctly in RTL

### Test Method

Place test orders for each combination. Verify in Shopify Admin.

### Rollback Plan

N/A — verification step. If checkout fails, debug the specific payment method configuration in Admin.

---

## Step 26: Full Phase 1 Acceptance Test

**Status**: 🔒 **Blocked** — Depends on Step 25

### What

Run all Phase 1 Acceptance Criteria from v2.1 §10.

### Files Changed

- None (verification only)

### Data Needed

- All test data from previous steps
- All payment methods verified

### Acceptance Criteria

All items in v2.1 §10 pass.

### Test Method

Systematic walkthrough of every acceptance criterion. Document pass/fail for each.

### Rollback Plan

N/A — verification step. If criteria fail, roll back the specific step that introduced the failure.

---

## Summary: Step Dependencies

```
Step 0  Fork Dawn                          ✅
Step 0b HORO_THEME_BASE.md                ✅ (depends on 0)
Step 1  Brand settings                     ✅ (depends on 0)
Step 2  Locale keys                        ✅ (depends on 0)
Step 3  Arabic font + RTL                  ✅ (depends on 0)
Step 4  home-hero                          ✅ (depends on 1, 2, 3)
Step 5  Trust ribbon                       ✅ (depends on 4)
Step 6  Primary routes                     ✅ (depends on 4)
Step 7  Feeling grid                       ✅ (depends on 4, metaobjects in Admin)
Step 8  Occasion grid                      ✅ (depends on 4, metaobjects in Admin)
Step 9  Gift block                         ✅ (depends on 4)
Step 10 Homepage integration test          ✅ (depends on 4–9)
Step 11 Feelings hub page                  ✅ (depends on 7)
Step 12 Occasions hub page                 ✅ (depends on 8)
Step 13 Gifts hub page                     ✅ (depends on 8)
Step 14 Collection feeling hero            ✅ (depends on metaobjects + collections in Admin)
Step 15 Collection occasion hero           ✅ (depends on 14)
Step 16 Collection subfeeling nav          ✅ (depends on 14, subfeeling metaobjects)
Step 17 Product story                      ✅ (depends on product metafields in Admin)
Step 18 Product artist card                ✅ (depends on artist metaobjects in Admin)
Step 19 Product delivery/payment           ✅ (depends on store metafields in Admin)
Step 20 Product size guide + page          ✅ (depends on product + store metafields)
Step 21 Gift wrap upsell                   ✅ (functionally unblocked; 🔒 payment-dependent tests blocked until Step 24)
Step 22 PDP trust strip                    ✅ (depends on 17)
Step 23 About/FAQ/Exchange pages           ✅ (Dawn sections only, no code)
Step 24 Payment verification               🔒 BLOCKED
Step 25 End-to-end checkout test           🔒 (depends on 24)
Step 26 Full Phase 1 acceptance test       🔒 (depends on 25)
```

**Steps 0–23 can proceed without payment verification.**
**Steps 24–26 are blocked until Payment Feasibility Checklist is manually verified.**

## Files That Must Never Be Changed

| File | Reason |
|---|---|
| Dawn's `main-product.liquid` | Custom product form, gallery, and variant picker are forbidden. No edits whatsoever — gift wrap is added via product.json block or separate section |
| Dawn's `main-cart-items.liquid` | Custom cart is forbidden. No edits — gift wrap upsell is a separate section in cart.json |
| Dawn's `main-cart-footer.liquid` | Custom cart is forbidden. No edits |
| Dawn's media gallery logic inside `main-product.liquid` | Custom gallery is forbidden |
| Dawn's variant picker inside `main-product.liquid` | Custom variant picker is forbidden |
| Dawn's `product-card.liquid` snippet | Keep Dawn's product card rendering |
| Dawn's `price.liquid` snippet | Keep Dawn's price rendering |
| Any checkout files | Checkout modification is forbidden |
| Dawn's `base.css` existing rules | Only append, never modify existing rules |

**No exceptions.** Gift wrap and all other custom UI are added via JSON template blocks, custom_liquid blocks, or separate sections — never by editing Dawn's section files.
