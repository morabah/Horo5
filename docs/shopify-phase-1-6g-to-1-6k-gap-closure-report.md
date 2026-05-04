# HORO Shopify Phase 1.6g–1.6k — Remaining Gap Closure Report

**Date:** 2026-05-04
**Branch:** medusa

---

## Objective

Close the remaining high-value gaps between the custom Medusa/web implementation and the Shopify Dawn-based HORO theme, without risking Shopify commerce functionality.

## Audit summary

| Status | Count |
|--------|-------|
| Closed | 22 |
| Partially closed | 5 |
| Open → Now closed | 5 |

All 5 previously open gaps are now closed. The 5 partially closed gaps are either completed (3) or accepted as-is with documentation (2: delivery estimate static-only, free shipping manual sync).

Full audit: [`docs/shopify-remaining-gap-closure-audit.md`](shopify-remaining-gap-closure-audit.md)

## Files created

### Sections (new)
| File | Purpose |
|------|---------|
| `shopify-theme/sections/horo-final-cta.liquid` | Final homepage CTA section |
| `shopify-theme/sections/collection-editorial-proof.liquid` | Collection editorial/proof section |
| `shopify-theme/sections/collection-related-routes.liquid` | Collection related-routes navigation |
| `shopify-theme/sections/occasions-editorial-guide.liquid` | Occasions hub editorial guide |
| `shopify-theme/sections/gifts-editorial-guide.liquid` | Gifts hub editorial guide |

### CSS (new)
| File | Purpose |
|------|---------|
| `shopify-theme/assets/component-horo-final-cta.css` | Final CTA styles |
| `shopify-theme/assets/component-collection-editorial-proof.css` | Collection editorial proof styles |
| `shopify-theme/assets/component-collection-related-routes.css` | Collection related routes styles |
| `shopify-theme/assets/component-occasions-editorial-guide.css` | Occasions editorial guide styles |
| `shopify-theme/assets/component-gifts-editorial-guide.css` | Gifts editorial guide styles |

### Documentation (new)
| File | Purpose |
|------|---------|
| `docs/shopify-remaining-gap-closure-audit.md` | Full gap audit across 10 areas |
| `docs/shopify-data-readiness-launch-checklist.md` | Data readiness + launch checklist |

## Files changed

### Sections (modified)
| File | Change |
|------|--------|
| `shopify-theme/sections/search-support-links.liquid` | Added `popular_searches` and `popular_searches_label` settings; added popular searches display block; added "Shop all" link to presets |

### CSS (modified)
| File | Change |
|------|--------|
| `shopify-theme/assets/component-search-support-links.css` | Added `.search-support-links__popular*` styles |

### Template JSON (modified)
| File | Change |
|------|--------|
| `shopify-theme/templates/index.json` | Added `story_plan`, `testimonials`, `final_cta` sections and order entries |
| `shopify-theme/templates/collection.json` | Added `editorial_proof` and `related_routes` sections and order entries |
| `shopify-theme/templates/page.occasions-hub.json` | Added `editorial_guide` (occasions-editorial-guide) section |
| `shopify-theme/templates/page.gifts-hub.json` | Added `editorial_guide` (gifts-editorial-guide) section |
| `shopify-theme/templates/search.json` | Added `popular_searches*` settings and 4 link blocks to search_support_links |

## Gaps closed

1. **Delivery estimate display** — `horo-delivery-estimate.liquid` already existed and is in `product.json`; static range display is safe for Phase 1
2. **Free-shipping threshold display** — `cart-free-shipping-progress.liquid` already existed and is in `cart.json`; disabled by default, merchant-enabled
3. **Gift-wrap live price fallback** — `snippets/gift-wrap-upsell.liquid` already has `_variant.price | money` fallback when `price_hint` is blank
4. **Story plan on homepage** — `horo-story-plan.liquid` existed but was not in `index.json`; now added
5. **Testimonials on homepage** — `horo-testimonials.liquid` existed but was not in `index.json`; now added
6. **Final homepage CTA** — New `horo-final-cta.liquid` section created and added to `index.json`
7. **Collection editorial proof** — New `collection-editorial-proof.liquid` created and added to `collection.json`
8. **Collection related routes** — New `collection-related-routes.liquid` created and added to `collection.json`
9. **Occasions editorial guide** — New `occasions-editorial-guide.liquid` created and added to `page.occasions-hub.json`
10. **Gifts editorial guide** — New `gifts-editorial-guide.liquid` created and added to `page.gifts-hub.json`
11. **Search popular searches** — `search-support-links.liquid` updated with popular searches text and "Shop all" link

## Gaps partially closed (accepted as-is)

1. **Delivery estimate — static only** — No JS date calculation. Static "3–7 / 2–4 business days" range is displayed. The Medusa/web implementation calculates exact date ranges with Egypt timezone, business-day math, and cutoff logic. This is intentionally deferred — exact date promises in Liquid are risky and the static range is safe.
2. **Free shipping threshold — manual sync** — The Medusa/web implementation reads the threshold from the Promotion API automatically. The Shopify section requires the merchant to set the threshold manually in section settings and keep it in sync with their Shopify shipping rate/discount configuration. This is documented in the section's `info` field.

## Gaps intentionally deferred

- Exact delivery date calculation (requires JS, timezone logic, holiday awareness)
- Dynamic free-shipping threshold from Shopify API (not available in Liquid)
- Predictive/fuzzy search
- Arabic fuzzy search
- Quick view
- Sticky mobile add-to-cart
- Cinematic sticky scroll
- Interactive vibe accordion
- Recently viewed
- Loyalty/second-order credit
- Live stock counters
- Restock waitlist
- Fake review ratings
- Custom checkout
- Payment-method discount
- Automatic discount calculations in Liquid

## Template JSON changes

### `templates/index.json`
- **Added sections:** `story_plan` (horo-story-plan), `testimonials` (horo-testimonials), `final_cta` (horo-final-cta)
- **Order:** `home_hero → horo_trust_ribbon → primary_routes → featured_collection → feeling_grid → occasion_grid → gift_block → story_plan → testimonials → final_cta`
- **Risk:** Medium — Template JSON changes overwrite Theme Editor customizations for this template. If the merchant has reordered or customized the homepage in the editor, those changes will be reset to this JSON on next deploy. **Recommendation:** Deploy during a low-traffic window and verify homepage layout immediately after.

### `templates/collection.json`
- **Added sections:** `editorial_proof` (collection-editorial-proof), `related_routes` (collection-related-routes)
- **Order:** `banner → feeling_hero → occasion_hero → subfeeling_nav → editorial_proof → product-grid → related_routes`
- **Risk:** Medium — Same Theme Editor overwrite risk as above.

### `templates/page.occasions-hub.json`
- **Added section:** `editorial_guide` (occasions-editorial-guide)
- **Order:** `occasions_hub → editorial_guide`
- **Risk:** Low — This is a custom page template unlikely to have editor customizations.

### `templates/page.gifts-hub.json`
- **Added section:** `editorial_guide` (gifts-editorial-guide)
- **Order:** `gifts_hub → editorial_guide`
- **Risk:** Low — Same as above.

### `templates/search.json`
- **Modified:** Added `popular_searches*` settings and 4 link blocks to existing `search_support_links` section
- **Risk:** Low — Only settings added to existing section; no structural change.

## Admin setup required

### Free shipping rule (if enabling free-shipping progress)
1. Go to Settings → Shipping and delivery
2. Create a shipping rate for Egypt with "Free shipping" condition (e.g. orders over 1500 EGP)
3. Enable the "Free shipping progress" section in the cart template
4. Set the `threshold_egp` value to match the shipping rate threshold

### Discounts
- No automatic discounts should be created in Shopify Admin unless they match what the theme displays
- The free-shipping progress bar is **disabled by default** — only enable after creating the matching shipping rate

### Product metafields
Create namespace `custom` with these definitions:
- `feeling` (metaobject_reference → feeling)
- `subfeeling` (metaobject_reference → subfeeling)
- `story` (rich_text)
- `story_description` (single_line_text)
- `design_story` (rich_text)
- `fit_note` (single_line_text)
- `materials` (single_line_text)
- `care_instructions` (single_line_text)
- `features` (single_line_text)
- `trust_chips` (single_line_text)
- `whatsapp_help_url` (url)
- `artist` (metaobject_reference → artist)
- `size_fit_note` (single_line_text)
- `size_table` (metaobject_reference → size_table)

### Collection metafields
- `editorial_heading` (single_line_text)
- `editorial_text` (single_line_text)
- `editorial_image` (file_reference)

### Metaobjects
- `artist` — fields: name, bio, avatar, instagram_url
- `feeling` — fields: name, slug, description, image, active, collection
- `subfeeling` — fields: name, slug, feeling (reference), description, image, active, collection
- `occasion` — fields: name, slug, description, image, active, is_gift_occasion, collection
- `size_table` — fields: name, rows

### Navigation
- Main menu: Home, Shop, Feelings, Gifts, About
- Footer: FAQ, Exchange, Size Guide, Contact, Privacy, Terms, Shipping Policy

Full checklist: [`docs/shopify-data-readiness-launch-checklist.md`](shopify-data-readiness-launch-checklist.md)

## Safety notes

- ✅ No checkout logic changed
- ✅ No payment or shipping settings changed
- ✅ No `main-product.liquid` modified
- ✅ No `buy-buttons.liquid` modified
- ✅ No `product-variant-picker.liquid` modified
- ✅ No `main-cart-items.liquid` modified
- ✅ No `main-cart-footer.liquid` modified
- ✅ No cart quantity/remove logic changed
- ✅ No `gift-wrap.js` modified
- ✅ No checkout totals calculated in theme code
- ✅ No automatic discounts implemented in Liquid
- ✅ No discount promises shown unless disabled by default or merchant-controlled
- ✅ No fake reviews added
- ✅ No fake stock counters added
- ✅ No heavy JavaScript added — all new sections are Liquid + CSS only
- ✅ RTL-safe logical CSS preserved (inline-size, block-size, margin-inline, margin-block)
- ✅ Mobile-first behavior preserved
- ✅ Sample testimonials show "Sample copy — replace before launch" only in Theme Editor
- ✅ Free shipping progress disabled by default
- ✅ Bundle nudge disabled by default
- ✅ Gift wrap price fallback uses `_variant.price | money` only when `price_hint` is blank

## Theme check result

```
shopify theme check --path shopify-theme
214 files inspected with 26 total offenses found across 11 files.
2 errors (pre-existing Dawn baseline: ValidSchemaTranslations in featured-product.liquid)
24 warnings (pre-existing: RemoteAsset, UndefinedObject, VariableName, OrphanedSnippet)
0 new HORO errors
0 new HORO warnings
```

## Manual test checklist

### Homepage
- [ ] Homepage desktop — all sections render in order: hero → trust ribbon → primary routes → featured → feeling grid → occasion grid → gift block → story plan → testimonials → final CTA
- [ ] Homepage mobile 375px — stacked layout, no overflow
- [ ] Story plan section shows 3 steps with icons
- [ ] Testimonials section shows 3 sample quotes with "Sample copy" notice in editor only
- [ ] Final CTA section shows "Shop by Feeling" button linking to `/pages/feelings`

### Product page
- [ ] Product page loads without errors
- [ ] Product metafield-rich page (with feeling, story, artist metafields) renders all sections
- [ ] Delivery estimate shows "3–7 business days" / "2–4 business days where available"
- [ ] Gift wrap upsell shows variant price when price_hint is blank
- [ ] Gift wrap add/remove works without JS errors
- [ ] Size guide renders from metafield

### Collection page
- [ ] Collection page shows editorial proof section between subfeeling nav and product grid
- [ ] Collection with `custom.editorial_heading` metafield shows metafield content
- [ ] Collection without metafield shows fallback heading/text
- [ ] Related routes section shows 3 route cards after product grid

### Feelings hub
- [ ] Feelings hub page renders feeling cards + editorial guide

### Occasions hub
- [ ] Occasions hub page renders occasion cards + editorial guide section

### Gifts hub
- [ ] Gifts hub page renders gift occasion cards + editorial guide section

### Search
- [ ] Search page shows support links (Shop by Feeling, Gifts, Size Guide, Shop all)
- [ ] Popular searches text displays ("Zodiac, Cancer, I care, Gift")

### Cart
- [ ] Cart below free-shipping threshold — progress bar hidden (disabled by default)
- [ ] Cart above free-shipping threshold — same (disabled by default; enable in section settings to test)
- [ ] Gift wrap add/remove works
- [ ] Bundle nudge hidden (disabled by default)

### Checkout
- [ ] Checkout COD — completes successfully
- [ ] Checkout Instapay/manual — completes successfully

### RTL quick check
- [ ] No broken layout when Arabic content is present in metafields
