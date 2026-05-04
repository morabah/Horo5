# HORO Shopify Phase 1.6c — Gap Fill Report

## Objective
Fill practical gaps between the current Shopify Dawn-based HORO implementation and the custom Medusa/web-next visual implementation, without risking commerce functionality.

## Files created

- `shopify-theme/sections/horo-trust-ribbon.liquid`
- `shopify-theme/assets/component-horo-trust-ribbon.css`
- `shopify-theme/sections/horo-story-plan.liquid`
- `shopify-theme/assets/component-horo-story-plan.css`
- `shopify-theme/sections/horo-testimonials.liquid`
- `shopify-theme/assets/component-horo-testimonials.css`
- `docs/shopify-taxonomy-content-population-checklist.md`
- `docs/shopify-navigation-final-guide.md`
- `docs/shopify-phase-1-6c-gap-fill-report.md`

## Files changed

- `shopify-theme/templates/index.json`
- `shopify-theme/templates/product.json`
- `shopify-theme/sections/home-hero.liquid`
- `shopify-theme/assets/component-home-hero.css`

## Shopify vs web-next gaps addressed

| web-next concept | Shopify implementation | Status |
|-----------------|----------------------|--------|
| `HomeTrustRibbon` | `horo-trust-ribbon` section (editable, blocks) | Done |
| `PDP_SCHEMA.storyPlanSteps` | `horo-story-plan` section (3 steps, editable) | Done |
| `HOME_QUOTES` | `horo-testimonials` section (sample-safe) | Done |
| `HomeHeroExplosive` editorial layer | Optional editorial word layer on `home-hero` | Done |
| Generic Dawn placeholders | HORO-specific copy in `product.json` | Done |

## Trust ribbon replacement

- Replaced the old `custom-liquid` trust ribbon in `index.json` with the new `horo-trust-ribbon` section.
- Section order preserved: `home_hero` → `horo_trust_ribbon` → `primary_routes`.
- New section uses blocks (up to 5), each with show/hide toggle, icon select (artist, print, cash, exchange, whatsapp, cotton, delivery), label, and optional subtext.
- No JavaScript. Semantic `<ul>`/`<li>`. Mobile wraps cleanly.
- Default badges: Original artist-made designs, Printed locally in Egypt, Cash on delivery available, 14-day size exchange, WhatsApp support.

## Story plan section

- Created `horo-story-plan` with eyebrow, heading, subheading, and up to 3 step blocks.
- Defaults: Find your feeling → Pick your design → Wear it.
- Desktop: 3-column grid. Mobile: stacked.
- Warm card style with border and border-radius matching the theme.
- No JavaScript.

## Testimonials section

- Created `horo-testimonials` with editable heading/eyebrow and up to 6 testimonial blocks.
- Each block: quote, name, city, optional label.
- Defaults use cautious placeholder copy (not claimed as real reviews).
- Section-level "Show as sample copy" toggle (default true).
- When enabled, displays a small editor-only notice: "Sample copy — replace before launch" (uses `request.design_mode`).
- No JavaScript.

## Product template cleanup

- Replaced generic Dawn placeholder copy in `product.json`:
  - Image-with-text heading: "Made to say something"
  - Image-with-text text: "HORO pieces begin with a feeling, then become artwork you can wear."
  - Multicolumn column 1: "Printed locally" / "Produced in Egypt with careful print handling."
  - Multicolumn column 2: "Size support" / "Check the size guide before ordering; exchange terms apply."
- No edits to `main-product`, `buy-buttons`, `variant-picker`, cart items/footer, or checkout logic.

## Hero editorial word layer

- Added optional settings to `home-hero`:
  - `show_editorial_word_layer`: checkbox, default **false**
  - `editorial_word_line_1`: default "WEAR"
  - `editorial_word_line_2`: default "WHAT YOU FEEL"
  - `editorial_word_opacity`: range 0–40%, default 18
  - `editorial_word_position`: center/left/right, default center
- Markup renders only when enabled. `aria-hidden="true"`. Inline `opacity` style from setting.
- CSS: huge uppercase text (`clamp(4rem, 14vw, 16rem)`), `z-index: 5`, `pointer-events: none`, does not block clicks.
- Mobile: font scales down, left/right positions collapse to center for readability.
- **Not enabled by default.** Merchant must turn it on after testing.

## Taxonomy/content checklist

- Created `docs/shopify-taxonomy-content-population-checklist.md` covering:
  - Required metaobject definitions: `feeling`, `subfeeling`, `occasion`, `artist`
  - Collection metafields: `custom.feeling`, `custom.occasion`
  - Recommended MVP taxonomy (Mood, Zodiac, Attitude + subfeelings)
  - Required collections and product assignment rules
  - Image checklist and manual test flow

## Navigation guide

- Created `docs/shopify-navigation-final-guide.md` covering:
  - Recommended main menu: Home, Shop, Feelings, Gifts, About
  - Recommended footer menu: FAQ, Exchange, Size Guide, Contact
  - Testing menu vs final customer menu guidance
  - RTL considerations

## Safety notes

- No cart/checkout/product-form logic changed.
- `sections/main-product.liquid`, `snippets/buy-buttons.liquid`, `snippets/product-variant-picker.liquid`, `sections/main-cart-items.liquid`, `sections/main-cart-footer.liquid` untouched.
- `assets/gift-wrap.js` untouched.
- No JavaScript added to any new section.
- No external libraries added.
- No heavy animations added.
- Logical CSS properties preserved (`inline-size`, `block-size`, `padding-inline`, `padding-block`, `margin-inline`, `margin-block-start`, `margin-block-end`).
- Mobile-first behavior maintained.

## Theme check result

```
201 files inspected with 26 total offenses found across 11 files.
2 errors.
24 warnings.
```

- **0 new HORO errors.**
- **0 new HORO warnings.**
- All offenses are pre-existing Dawn baseline or existing HORO commerce files (gift-wrap snippets, cart-gift-wrap-upsell).
- New files (`horo-trust-ribbon`, `horo-story-plan`, `horo-testimonials`) produced zero offenses.

## Manual test checklist

- [ ] Homepage desktop — hero, trust ribbon, primary routes, grids render
- [ ] Homepage mobile 375px — trust ribbon wraps, story plan stacks, testimonials stack
- [ ] Product page — image-with-text and multicolumn show HORO copy, main-product untouched
- [ ] Cart — add/remove/qty still works, gift-wrap intact
- [ ] `/pages/feelings` — reachable from primary routes
- [ ] `/collections/feeling-zodiac` — loads
- [ ] `/collections/feeling-zodiac-cancer` — loads with products
- [ ] RTL Arabic quick check — logical CSS holds, text alignment correct

## Remaining gaps deferred

The following were intentionally deferred to Phase 1.7 or beyond:

- Cinematic sticky scroll sequence (full `HomeStickyVibeShowcase` React parity)
- Interactive vibe accordion
- Advanced search/filter UX
- Full React visual parity (gradients, motion, complex layouts)
- Live testimonial integration (currently sample-copy only)

---
*Phase 1.6c complete. Do not proceed to Phase 1.7 without explicit direction.*
