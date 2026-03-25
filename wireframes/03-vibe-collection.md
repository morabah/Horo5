# 03 — Vibe Collection

**Route:** `/vibes/:slug`  
**Implementation:** [`VibeCollection.tsx`](../web/src/pages/VibeCollection.tsx), [`MerchProductCard.tsx`](../web/src/components/MerchProductCard.tsx)  
**Status:** Current authoritative collection wireframe.

## Purpose

Turn one vibe into a complete browse-and-buy page: image-led hero, proof before utility, then product grid.

## Current structure

1. **Hero**
- full-bleed editorial image
- breadcrumb: `Home / Shop by Vibe / {vibe}`
- design count label
- vibe title, tagline, optional manifesto line
- CTA `Shop the designs`
- secondary anchor `Read the story`

2. **Proof Section**
- large proof image
- editorial kicker and body copy when available
- design count plus `220 GSM cotton`
- CTA `Shop the designs`

3. **Product Controls**
- desktop: sticky sort and price controls, plus `Search this vibe`
- mobile: bottom-sheet filter and sort dialog

4. **Product Grid**
Shared `MerchProductCard` grid with:
- image
- vibe eyebrow
- product name
- price
- proof chip such as fit label or `220 GSM cotton`
- optional merchandising badge
- quick view

5. **Explore Other Vibes**
Four sibling vibe cards below the grid.

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV                                                                       |
+----------------------------------------------------------------------------------+
| HERO                                                                             |
| breadcrumb                                                                       |
| full-bleed editorial image                                                       |
| vibe title / manifesto / count                                                   |
| [Shop the designs]   [Read the story]                                            |
+----------------------------------------------------------------------------------+
| PROOF SECTION                                                                    |
| [Large Proof Image] | kicker / body copy / 220 GSM / count / [Shop the designs] |
+----------------------------------------------------------------------------------+
| PRODUCT CONTROLS                                                                 |
| [Sort] [Price] [Search this vibe]                                                |
+----------------------------------------------------------------------------------+
| PRODUCT GRID                                                                     |
| [Merch] [Merch] [Merch]                                                          |
| [Merch] [Merch] [Merch]                                                          |
+----------------------------------------------------------------------------------+
| EXPLORE OTHER VIBES                                                              |
| [Vibe] [Vibe] [Vibe] [Vibe]                                                      |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- `Search this vibe` routes to `/search?vibe={slug}&focus=1`.
- No artist line appears on collection cards.
- Empty state supports reset when filters are active.
- Quick view is available from the grid.

## Current rules

- Keep proof above filters and products.
- Keep only sort and price filtering on this page.
- Do not reintroduce artist browsing or artist metadata into the card face.
