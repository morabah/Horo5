# 05 — Occasion Collection

**Route:** `/occasions/:slug`  
**Implementation:** [`OccasionCollection.tsx`](../web/src/pages/OccasionCollection.tsx), [`MerchProductCard.tsx`](../web/src/components/MerchProductCard.tsx)  
**Status:** Current authoritative occasion-collection wireframe.

## Purpose

Present one occasion as a curated edit, then let shoppers refine by price or vibe only after the proof layer.

## Current structure

1. **Hero**
- full-bleed image
- breadcrumb: `Home / Shop by Occasion / {occasion}`
- title, blurb, design count
- CTA `Shop the designs`
- scoped search link `Search this occasion`

2. **Proof Section**
- large proof image
- `Start with the edit` heading
- short proof copy
- optional price hint plus `220 GSM cotton`

3. **Gift Banner**
Only for `isGiftOccasion` pages:
- gift-wrap/story-card image
- explanatory copy
- gift-ready chip

4. **Product Controls**
- desktop: sticky sort, price, optional vibe filter, plus scoped search link
- mobile: bottom-sheet filter and sort dialog

5. **Product Grid**
Shared `MerchProductCard` grid. For gift occasions the proof chip switches to the gift message; otherwise it uses fit label or `220 GSM cotton`.

6. **More Occasions**
Horizontal carousel on mobile, four-column grid on desktop.

## Key behaviors

- `Search this occasion` routes to `/search?occasion={slug}&focus=1`.
- Quick view is available from product cards.
- Empty states support `Reset filters`.
- More-occasions cards stay image-first.

## Current rules

- Keep proof ahead of filters and product utility.
- Keep artist hidden on browse cards.
- Keep gift messaging contextual rather than as a sitewide layer.
