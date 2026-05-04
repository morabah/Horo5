# HORO Shopify vs Web-next Visual Parity Audit

## Objective
Compare the Shopify Dawn-based theme against the custom Medusa/web-next storefront to identify visual gaps and safe adaptation paths.

## 1. Homepage Hero

- **Web-next behavior:** Full-viewport cinematic hero (`min-h-dvh`), dark obsidian background, full-bleed image with heavy scrim, grain overlay, vignette, huge editorial text at bottom-left, single CTA "Explore the Collection" with uppercase label styling and border.
- **Shopify current:** `home-hero` section with 60rem min-height, multi-stop gradient scrim, grain overlay, vignette, editorial word layer, centered content by default, standard Dawn button.
- **Gap:** Partial — strong foundation exists but needs cinematic mode toggle, hero ribbon, split typography option, and bottom-left CTA positioning.
- **Safe adaptation:** Add settings for cinematic mode, grain toggle, split typography, hero ribbon text, and CTA position. Keep existing settings backward-compatible.
- **Files:** `sections/home-hero.liquid`, `assets/component-home-hero.css`
- **Risk:** Low — additive settings only.

## 2. Homepage Feeling/Expression Section

- **Web-next behavior:** `HomeFeelingCards` — warm papyrus background with top border, eyebrow label typography, grid of 2-col feeling tiles with image, gradient overlay, count label, large headline text. No animation required.
- **Shopify current:** `home-feeling-grid` exists with similar structure but less visual weight. No dedicated "feeling expression" editorial section.
- **Gap:** Open — missing a dedicated editorial expression section (like `HomeFeelingExplosion` or the sticky vibe showcase).
- **Safe adaptation:** Create `sections/horo-feeling-expression.liquid` with large editorial text, short copy, and optional image cards. No JS. Add after hero or after primary_routes.
- **Files:** New `sections/horo-feeling-expression.liquid`, `assets/component-horo-feeling-expression.css`
- **Risk:** Low — new section, no existing behavior changed.

## 3. Homepage Route Cards

- **Web-next behavior:** `HomePrimaryRoutes` — clean cards with image, label, short text, editorial feel.
- **Shopify current:** `home-primary-routes` — similar structure but could use stronger hover effects and warmer card styling.
- **Gap:** Partial — functional but visually lighter than web-next.
- **Safe adaptation:** Enhance CSS with hover lift, stronger image presence, editorial label treatment. No schema changes needed.
- **Files:** `assets/component-home-primary-routes.css`
- **Risk:** Low — CSS-only.

## 4. Featured Products / Latest Drop

- **Web-next behavior:** "Just Dropped" / "Founding Drop" with eyebrow "Proof in the product", product cards with fit badge, artist credit, price, promo countdown, hover actions (quick add, quick view), warm card surfaces.
- **Shopify current:** `featured-collection` using Dawn product cards. Cards are generic Dawn style.
- **Gap:** Open — product cards need HORO styling (see Product Cards below). Section heading can be more editorial.
- **Safe adaptation:** Update `templates/index.json` heading to "Just Dropped" with eyebrow. Product card styling handles the rest.
- **Files:** `templates/index.json`
- **Risk:** Low — copy change only.

## 5. Trust Cards / Ribbon

- **Web-next behavior:** `HomeTrustRibbon` — compact horizontal strip on linen background with border-y, small dot separators, uppercase label text, 12-13px font.
- **Shopify current:** `horo-trust-ribbon` exists with badges/icons but is block-based and more spaced out.
- **Gap:** Partial — works well but could be more compact and editorial.
- **Safe adaptation:** Minor CSS refinement to match label typography. Keep blocks.
- **Files:** `assets/component-horo-trust-ribbon.css` (if exists, else inline)
- **Risk:** Low.

## 6. Testimonials / Proof

- **Web-next behavior:** No explicit testimonials section in default homepage. Trust is handled by ribbon and PDP proof cards.
- **Shopify current:** `horo-testimonials` with sample quotes, editor-only safety notice.
- **Gap:** Partial — already has safety measures. Could use warmer card styling.
- **Safe adaptation:** Enhance CSS for editorial card feel. Keep sample copy warning.
- **Files:** `assets/component-horo-testimonials.css`
- **Risk:** Low.

## 7. Final CTA

- **Web-next behavior:** Warm background, large whitespace, strong short headline, single button.
- **Shopify current:** `horo-final-cta` with similar structure.
- **Gap:** Closed — already close to web-next.
- **Safe adaptation:** Minor copy refinement (already done in Phase 1.7b).
- **Files:** None needed.
- **Risk:** None.

## 8. Product Cards

- **Web-next behavior:** `MerchProductCard` — 4:5 aspect ratio image, fit badge overlay (top-left), wishlist heart (top-right), hover reveals quick-add size picker + quick view, artist credit, eyebrow, price with promo/savings, countdown chip. Mobile has compact "View piece" CTA.
- **Shopify current:** Dawn `card-product` with standard aspect ratio, badge for sale/sold out, quick view button, standard price. No fit badge, no artist credit, no promo countdown.
- **Gap:** Open — significant visual gap.
- **Safe adaptation:** Add optional metafield display (subfeeling, fit_note), custom CSS for card styling (shadow, hover lift, rounded corners), keep quick view. Do NOT add quick-add modal or wishlist (too complex for this phase). Add fallback chip "220 GSM cotton".
- **Files:** `snippets/card-product.liquid`, new `assets/component-horo-product-card.css`
- **Risk:** Medium — touching core product card, must not break quick add or links.

## 9. Collection Hero

- **Web-next behavior:** Collection pages are vibe-based with strong hero, breadcrumb, design count, tagline.
- **Shopify current:** `collection-feeling-hero` / `collection-occasion-hero` exist with basic hero treatment.
- **Gap:** Partial — needs stronger visual weight, design count, breadcrumb feel.
- **Safe adaptation:** Add product count display, enhance overlay styling, improve typography.
- **Files:** `sections/collection-feeling-hero.liquid`, `sections/collection-occasion-hero.liquid`
- **Risk:** Low.

## 10. Collection Editorial Proof

- **Web-next behavior:** Editorial image + text layout, compact on mobile.
- **Shopify current:** `collection-editorial-proof` exists with image + text, already supports metafields.
- **Gap:** Partial — layout is good but could use warmer styling.
- **Safe adaptation:** CSS refinements for editorial card feel.
- **Files:** `assets/component-collection-editorial-proof.css`
- **Risk:** Low.

## 11. Collection Filters/Sort/Search Route

- **Web-next behavior:** No custom filters — simple collection browsing.
- **Shopify current:** Dawn filters/sort UI.
- **Gap:** Partial — Dawn filters are functional but generic.
- **Safe adaptation:** Minor CSS styling to make filter container feel more editorial. Do NOT rebuild.
- **Files:** `assets/component-collection-*.css` or inline in theme
- **Risk:** Low.

## 12. Product Page Visual Hierarchy

- **Web-next behavior:** Rich PDP with gallery rail, sticky buy box, trust strip, proof cards, artist card, story card, size guide modal, delivery card, gift-ready card, related products. Warm editorial surfaces.
- **Shopify current:** Multiple PDP sections exist but spacing and visual rhythm are Dawn-generic.
- **Gap:** Open — needs warmer section backgrounds, better spacing rhythm, editorial typography.
- **Safe adaptation:** CSS refinements for each PDP section. Add visual cohesion between sections.
- **Files:** Multiple `sections/product-*.liquid` and their CSS files
- **Risk:** Low — CSS-only.

## 13. Cart Visual Trust

- **Web-next behavior:** Glass/card surfaces, trust strip, gift wrap upsell, free-shipping progress, pair-with strip, bundle nudge, clear summary.
- **Shopify current:** Cart has gift wrap, trust explainer, bundle nudge, free-shipping progress sections but styling is Dawn-basic.
- **Gap:** Partial — functionality exists, visual styling needs warmth.
- **Safe adaptation:** CSS refinements for cart items and summary card.
- **Files:** `assets/component-cart-items.css`, `assets/component-cart.css`
- **Risk:** Low.

## 14. Search Recovery

- **Web-next behavior:** Search results with support links and popular searches.
- **Shopify current:** `search-support-links` exists with heading, text, popular searches, link blocks.
- **Gap:** Closed — already functional.
- **Safe adaptation:** Minor visual alignment. Already enhanced in Phase 1.7b.
- **Files:** None needed.
- **Risk:** None.

## 15. Mobile 375px Experience

- **Web-next behavior:** Responsive design, mobile-first, 2-col grids, compact cards, tappable CTAs, safe areas respected.
- **Shopify current:** Dawn is mobile-first but some HORO sections need mobile refinement.
- **Gap:** Partial — hero needs mobile composition attention, cards need readable mobile sizing.
- **Safe adaptation:** Ensure all new CSS has strong mobile breakpoints. Test 375px width.
- **Files:** All CSS files
- **Risk:** Low if tested.

## Summary

| Area | Gap | Priority | Risk |
|------|-----|----------|------|
| Homepage hero | Partial | High | Low |
| Feeling expression | Open | High | Low |
| Route cards | Partial | Medium | Low |
| Featured products | Partial | Medium | Low |
| Trust ribbon | Partial | Low | Low |
| Testimonials | Partial | Low | Low |
| Final CTA | Closed | — | — |
| Product cards | Open | High | Medium |
| Collection hero | Partial | Medium | Low |
| Editorial proof | Partial | Medium | Low |
| Filters/sort | Partial | Low | Low |
| Product page | Open | Medium | Low |
| Cart | Partial | Medium | Low |
| Search | Closed | — | — |
| Mobile | Partial | High | Low |
