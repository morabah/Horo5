# HORO Shopify Phase 1.7b — Visual & Content Readiness Polish Report

## Objective
Review and refine the remaining visual and content gaps in the HORO Shopify theme after Phase 1.7a. Focus on section order, copy refinement, testimonial safety, collection page conciseness, search polish, and admin-readiness documentation. Do not create major new features.

## Files reviewed
- `templates/index.json`
- `templates/collection.json`
- `templates/search.json`
- `templates/product.json`
- `templates/cart.json`
- `templates/page.feelings-hub.json`
- `templates/page.occasions-hub.json`
- `templates/page.gifts-hub.json`
- `templates/page.about-horo.json`
- `templates/page.faq-horo.json`
- `templates/page.exchange-policy-horo.json`
- `templates/page.size-guide.json`
- `sections/home-hero.liquid`
- `sections/home-primary-routes.liquid`
- `sections/home-feeling-grid.liquid`
- `sections/home-occasion-grid.liquid`
- `sections/horo-story-plan.liquid`
- `sections/horo-testimonials.liquid`
- `sections/horo-final-cta.liquid`
- `sections/collection-editorial-proof.liquid`
- `sections/collection-related-routes.liquid`
- `sections/search-support-links.liquid`
- `sections/feelings-hub.liquid`
- `sections/gifts-hub.liquid`

## Files changed
- `shopify-theme/templates/index.json` — reordered sections, refined copy
- `shopify-theme/templates/collection.json` — refined editorial_proof fallback copy
- `shopify-theme/templates/search.json` — added "Size guide" to popular searches
- `docs/shopify-visual-content-readiness-audit.md` — created
- `docs/shopify-navigation-footer-final-checklist.md` — created
- `docs/shopify-admin-content-readiness-checklist.md` — created

## Homepage changes
- **Section order updated:**
  1. home_hero
  2. horo_trust_ribbon
  3. primary_routes
  4. **story_plan** (moved up from position 8 to 4 — explains HORO before product browsing)
  5. featured_collection
  6. feeling_grid
  7. occasion_grid
  8. testimonials
  9. **gift_block** (moved down to position 9)
  10. final_cta
- **Hero subheading** refined: "Original artwork printed on everyday T-shirts — made to carry a feeling, sign, or attitude."
- **Story plan heading** refined: "Start with a feeling. Choose the piece."
- **Story plan subheading** refined: "HORO helps you shop by mood, sign, attitude, or moment — not only by product type."
- **Gift block heading** refined: "Gift by feeling"
- **Gift block text** refined: "Choose a design that says something personal without needing a long message."
- **Testimonial eyebrow** changed from "What people say" to "What HORO is designed to feel like" (reduces fake-review pattern risk).
- **Final CTA heading** refined: "Find the piece that feels like you"
- **Final CTA text** refined: "Start with a feeling and move from there."
- No sections removed. Hero image reference untouched.

## Collection changes
- `editorial_proof` fallback copy refined:
  - Heading: "Designed around this feeling"
  - Text: "This collection gathers pieces connected by the same mood, sign, or attitude."
- More compact than previous fallback. Collection metafield override still works.

## Hub page changes
- No code changes made.
- **Feelings hub** is clean; depends on `feeling` metaobjects.
- **Occasions hub** is clean; depends on `occasion` metaobjects.
- **Gifts hub** filters `occasion` metaobjects by `is_gift_occasion == true`. Documented: hide from main menu until gift metaobjects are populated.

## Product page notes
- No code changes made to preserve Theme Editor safety.
- **Empty Dawn collapsible tabs** exist in `main-product` blocks (`collapsible-row-0` through `collapsible-row-3`) with empty `content` and `page` fields.
- These will render as blank accordions on the live storefront.
- **Action:** Hide these blocks in Shopify Theme Editor (`main-product` section > block visibility) or populate them with content/pages.
- Do NOT remove them in code — that would overwrite Theme Editor customizations.
- Product story and artist card sections depend on product metafields.
- Delivery estimate is present but `show_exact_date_range` is `false` by default (safe fallback).

## Search page changes
- Added "Size guide" to `popular_searches` in `search_support_links`.
- Popular searches now: "Zodiac, Cancer, I care, Gift, Size guide"
- Search fallback page structure is solid (results first, then recovery links).

## Navigation/footer checklist
Created `docs/shopify-navigation-footer-final-checklist.md` with:
- Recommended main menu (max 4–5 items)
- Recommended footer groups (Shop, Support, Legal)
- Note: hide Gifts from main menu if metaobjects not ready
- Pre-launch checklist

## Shopify Admin content checklist
Created `docs/shopify-admin-content-readiness-checklist.md` with:
- Homepage content checklist (hero image, route images, metaobjects, testimonials)
- Product checklist (variants, inventory, images, metafields)
- Metaobject checklist (feeling, subfeeling, occasion, artist, size_table)
- Collection checklist (7 collections, collection metafields)
- Policy checklist (Exchange, Privacy, Terms, Shipping, Contact)
- Gift wrap product setup
- Free shipping threshold configuration
- Delivery estimate settings
- Full path test (Home → Feelings → Zodiac → Cancer → Product → Cart → Checkout → COD / Instapay)
- Mobile & RTL checks

## Remaining content/admin tasks
1. Upload hero image in Theme Editor.
2. Upload primary_routes card images.
3. Populate `feeling` metaobjects with images and active status.
4. Populate `occasion` metaobjects with images and active status.
5. Populate gift `occasion` metaobjects (with `is_gift_occasion: true`) before linking Gifts in menu.
6. Replace testimonial sample copy with real quotes, or hide the section before launch.
7. Hide empty Dawn collapsible tabs in product page Theme Editor.
8. Populate product metafields (story, artist, fit_note, materials, care, etc.).
9. Configure gift wrap product.
10. Configure free shipping rate and enable progress bar.
11. Create policy pages (Privacy, Terms, Shipping).
12. Configure footer navigation in Shopify Admin.
13. Test full purchase path on mobile (375px).
14. RTL check if Arabic localization is planned.

## Deferred features
- New major homepage animations
- Cinematic sticky scroll
- Interactive vibe accordion
- Predictive search
- Quick view upgrades
- Mobile sticky ATC upgrades
- Automatic discount logic
- App proxy
- Shopify Functions
- Fake reviews / live stock counters
- Restock waitlist
- Custom checkout

## Safety notes
- No checkout logic changed.
- No payment/shipping settings changed.
- `buy-buttons.liquid` untouched.
- `product-variant-picker.liquid` untouched.
- Dawn product form unchanged.
- Cart quantity/remove logic unchanged.
- `gift-wrap.js` untouched.
- No automatic discount calculations added.
- No fake reviews or live stock counters.
- No external libraries.
- All changes are Liquid/CSS/template copy only.
- RTL-safe logical CSS preserved.
- Mobile-first behavior preserved.

## Theme check result
`shopify theme check --path shopify-theme` returned:
- **0 new HORO errors**
- **0 new HORO warnings**
- 2 existing errors (`ValidSchemaTranslations` in `main-product.liquid` — baseline)
- 24 existing warnings (variable naming, unused assigns, orphaned snippets — baseline)
- No errors or warnings introduced by any changed files (`index.json`, `collection.json`, `search.json`).

## Manual test checklist
- [ ] Homepage desktop — section order feels logical, no repetition fatigue
- [ ] Homepage mobile 375px — scroll length is acceptable, trust ribbon is visible
- [ ] Collection page — editorial proof is compact, product grid is easy to reach
- [ ] Feelings hub — placeholder only visible in editor, live page shows metaobjects
- [ ] Occasions hub — placeholder only visible in editor
- [ ] Gifts hub — empty grid if no gift metaobjects (hide from nav until ready)
- [ ] Product page — no blank Dawn accordions (hide in Theme Editor if empty)
- [ ] Cart page — free shipping progress can be enabled in settings
- [ ] Search page — "Size guide" appears in popular searches
- [ ] About page — copy matches brand voice
- [ ] Footer links — all support pages reachable
- [ ] RTL quick check — logical CSS works, no hardcoded left/right
