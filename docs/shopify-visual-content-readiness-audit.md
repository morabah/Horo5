# HORO Shopify — Visual & Content Readiness Audit

## 1. Homepage

**Current sections (in order):**
1. home_hero
2. horo_trust_ribbon
3. primary_routes
4. featured_collection
5. feeling_grid
6. occasion_grid
7. gift_block
8. story_plan
9. testimonials
10. final_cta

**Visual hierarchy issue:**
- Story plan is buried deep (section 8), after gift_block. It explains the HORO concept and should appear earlier to set context before product browsing.
- Gift block is positioned before story_plan, which feels sales-heavy before explaining the brand logic.
- Featured collection appears before the explanation of how HORO works.

**Repetition issue:**
- "Shop by" appears in primary_routes heading, feeling_grid heading, and occasion_grid heading. Three consecutive "Shop by" headings create fatigue.
- The word "meaning" appears in hero subheading, story_plan heading, and gift_block heading.

**Placeholder/content issue:**
- Hero uses placeholder SVG if no image is uploaded.
- primary_routes cards use placeholder SVGs if no images.
- feeling_grid and occasion_grid depend on metaobjects; without them, they show editor-only placeholders.
- Testimonials have sample copy with `show_sample_copy: true` and an editor-only warning. The eyebrow says "What people say" which is a common fake-review pattern.

**Missing image issue:**
- Hero image is critical and currently empty in template.
- primary_routes card images are empty in template.
- feeling_grid and occasion_grid depend on metaobject images.

**Missing data/admin issue:**
- feeling_grid requires `feeling` metaobjects with images.
- occasion_grid requires `occasion` metaobjects with images.
- featured_collection uses collection "all" — needs products.
- testimonials need to be replaced with real quotes or hidden.

**Mobile risk:**
- 10 sections on mobile may feel very long.
- hero → trust_ribbon → primary_routes → story_plan is a strong start, but feeling_grid + occasion_grid + gift_block + testimonials + final_cta at the bottom creates length.

**Trust risk:**
- Testimonials with sample copy and eyebrow "What people say" could be mistaken for fake reviews if not replaced before launch.
- No star ratings or review counts (good).

**Recommendation:**
- **Fix now:** Reorder sections (story_plan before featured_collection), refine copy, make testimonial eyebrow safer.
- **Fix in Shopify Admin:** Upload hero image, primary_routes card images, populate metaobjects, replace testimonials.
- **Defer:** No major new sections needed.

---

## 2. Collection Page

**Current sections:**
1. banner
2. feeling_hero
3. occasion_hero
4. subfeeling_nav
5. editorial_proof
6. product-grid
7. related_routes

**Visual hierarchy issue:**
- Both feeling_hero and occasion_hero appear. Only one is typically relevant per collection. This creates redundancy.
- subfeeling_nav may show empty if the collection has no subfeelings.

**Repetition issue:**
- Two hero sections on one page is excessive.

**Placeholder/content issue:**
- editorial_proof uses fallback copy: "Choose by meaning, not only by product" / "Each collection groups designs around a feeling, sign, attitude, or moment." This is acceptable but slightly verbose.

**Missing image issue:**
- editorial_proof has optional image via metafield. Without it, it renders as text-only (acceptable).

**Missing data/admin issue:**
- Collection metafields (`custom.editorial_heading`, `custom.editorial_text`, `custom.editorial_image`) are not set by default.
- feeling_hero and occasion_hero may show empty if the collection has no matching feeling/occasion.

**Mobile risk:**
- Sections before product grid: banner + 2 heroes + nav + editorial = potentially 5 sections before products. On mobile this could feel like a long scroll.

**Trust risk:**
- None.

**Recommendation:**
- **Fix now:** Make editorial_proof fallback more compact. Consider if both feeling_hero and occasion_hero are needed.
- **Fix in Shopify Admin:** Set collection metafields for editorial content.
- **Defer:** Hero redundancy is a template architecture question, not a bug.

---

## 3. Feelings Hub

**Current sections:**
1. feelings_hub
2. editorial_guide

**Visual hierarchy:**
- Clean and focused.
- heading is empty (falls back to `page.title`).

**Placeholder/content:**
- editorial_guide has good fallback copy: "Start with what you feel" / "HORO organizes designs by feeling, sign, attitude, and moment..."

**Missing data:**
- feelings_hub depends on `feeling` metaobjects. Without them, it shows an editor-only placeholder.

**Mobile risk:**
- Low. Only two sections.

**Recommendation:**
- **Fix in Shopify Admin:** Populate `feeling` metaobjects.
- **Defer:** No code changes needed.

---

## 4. Occasions Hub

**Current sections:**
1. occasions_hub
2. editorial_guide

**Visual hierarchy:**
- Clean and focused.
- heading is empty (falls back to `page.title`).

**Placeholder/content:**
- editorial_guide has good fallback copy: "Choose for the moment" / "Some designs work better for a specific day, person, or memory."

**Missing data:**
- occasions_hub depends on `occasion` metaobjects. Without them, it shows an editor-only placeholder.

**Recommendation:**
- **Fix in Shopify Admin:** Populate `occasion` metaobjects.
- **Defer:** No code changes needed.

---

## 5. Gifts Hub

**Current sections:**
1. gifts_hub
2. editorial_guide

**Visual hierarchy:**
- Clean but potentially empty if no gift occasions exist.

**Placeholder/content:**
- editorial_guide says "HORO designs work as gifts because they start with a feeling."

**Missing data:**
- gifts_hub filters `occasion` metaobjects by `is_gift_occasion == true`. If none exist, the grid is empty.

**Trust risk:**
- If the Gifts page is linked from the main menu but has no content, it looks broken.

**Recommendation:**
- **Fix now:** Document that Gifts should be hidden from main menu until `occasion` metaobjects with `is_gift_occasion: true` are populated.
- **Fix in Shopify Admin:** Create gift occasion metaobjects before linking this page in navigation.

---

## 6. Product Page

**Current sections (in order):**
1. main (with Dawn product form, empty collapsible tabs)
2. product_purchase_context
3. product_story
4. product_artist_card
5. product_details_accordions
6. product_delivery_payment
7. horo_delivery_estimate
8. product_size_guide
9. product_gift_wrap_upsell
10. product_trust_strip
11. image-with-text
12. multicolumn
13. related-products

**Visual hierarchy issue:**
- Product page is long. After the product form, there are 12 more sections.
- Empty Dawn collapsible tabs (Materials, Shipping & Returns, Dimensions, Care Instructions) inside main-product create visual duplication because product_details_accordions and product_delivery_payment already handle this.

**Placeholder/content issue:**
- Dawn collapsible-row-0 through collapsible-row-3 have empty `content` and `page`. They will render as empty accordions in the product form.
- product_story and product_artist_card depend on product metafields; without them they may be empty.
- image-with-text and multicolumn are generic Dawn sections.

**Missing data/admin issue:**
- Product metafields needed: `custom.feeling`, `custom.story`, `custom.artist`, `custom.size_fit_note`, etc.
- hero media: product images are critical.

**Mobile risk:**
- Very long page on mobile. product_trust_strip → image-with-text → multicolumn → related-products is a lot of scrolling after the product form.
- Empty accordions in the product form will look broken.

**Trust risk:**
- delivery_estimate is disabled (`show_exact_date_range: false`).
- Gift wrap upsell may show even if no gift wrap product is configured.

**Recommendation:**
- **Fix now:** Document that empty Dawn collapsible tabs should be hidden in Theme Editor.
- **Fix in Shopify Admin:** Populate product metafields, upload images, configure gift wrap product, enable delivery estimate if desired.
- **Defer:** Do not remove Dawn collapsible tabs in code (may break Theme Editor).

---

## 7. Cart Page

**Current sections:**
1. cart-items
2. cart_gift_wrap_upsell
3. cart_trust_explainer
4. cart_bundle_nudge
5. cart_free_shipping_progress
6. cart-footer
7. featured-collection

**Visual hierarchy:**
- Good. Cart items first, then trust/explainer, then checkout.
- featured-collection at the bottom is standard.

**Placeholder/content:**
- cart_bundle_nudge says "Bundle offers may be announced separately." This is cautious and acceptable.
- cart_free_shipping_progress is disabled (`enable_free_shipping_progress: false`).

**Missing data:**
- Needs products in featured collection.

**Recommendation:**
- **Fix in Shopify Admin:** Enable free shipping progress and set threshold once shipping rates are configured.
- **Defer:** No code changes needed.

---

## 8. Search Page

**Current sections:**
1. main-search
2. search_support_links

**Visual hierarchy:**
- Clean. Search results first, then recovery links.

**Placeholder/content:**
- Fallback heading: "Not sure what to search?"
- Popular searches: "Zodiac, Cancer, I care, Gift" — good, but missing "Size guide".
- Support links: Shop by Feeling, Gifts, Size Guide, Shop all.

**Missing data:**
- Needs products/pages for search to return results.

**Recommendation:**
- **Fix now:** Add "Size guide" to popular searches.
- **Fix in Shopify Admin:** Populate products so search returns results.

---

## 9. About Page

**Current sections:**
1. about_horo

**Content:**
- Good fallback copy about HORO being wearable art based in Egypt.

**Recommendation:**
- **Fix in Shopify Admin:** Verify copy matches final brand voice.

---

## 10. FAQ / Exchange / Size Guide

**FAQ:**
- 6 well-written FAQ items covering what HORO is, sizing, COD, exchange, delivery, gift wrap.
- Cautious language: "terms apply", "depends on your area".

**Exchange policy:**
- 6 policy items covering window, condition, size exchange, defective items, how to request, notes.
- Good cautious language.

**Size guide:**
- Concrete measurements for XS–XXL.
- Disclaimer about fabric variation.

**Recommendation:**
- **Fix in Shopify Admin:** Verify measurements match actual products.
- **Defer:** No code changes needed.

---

## 11. Footer / Navigation

**Current state (unknown from templates):**
- Footer menu and main menu are configured in Shopify Admin, not in theme files.
- No footer section template was reviewed.

**Recommendation:**
- **Fix now:** Create navigation/footer checklist.
- **Fix in Shopify Admin:** Configure menus, move support/policy pages to footer for launch.

---

## Summary Table

| Page | Fix Now | Fix in Admin | Defer |
|------|---------|--------------|-------|
| Homepage | Reorder sections, refine copy, testimonial eyebrow | Hero image, route images, metaobjects, testimonials | — |
| Collection | Editorial copy refinement | Collection metafields | Hero redundancy |
| Feelings Hub | — | Feeling metaobjects | — |
| Occasions Hub | — | Occasion metaobjects | — |
| Gifts Hub | Document: hide from nav until ready | Gift occasion metaobjects | — |
| Product | Document: hide empty Dawn tabs | Product metafields, images, gift wrap config | — |
| Cart | — | Enable free shipping, configure threshold | — |
| Search | Add "Size guide" to popular searches | Populate products | — |
| About | — | Verify brand voice copy | — |
| FAQ/Exchange/Size | — | Verify measurements | — |
| Footer/Nav | Create checklist | Configure menus | — |
