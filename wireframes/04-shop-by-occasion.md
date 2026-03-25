# 04 — Shop by Occasion

**Route:** `/occasions`  
**Implementation:** [`ShopByOccasion.tsx`](../web/src/pages/ShopByOccasion.tsx)  
**Status:** Current authoritative occasion-hub wireframe.

## Purpose

Secondary browse hub for gifting and moment-based shopping.

## Current structure

1. **Featured Hero**
The first occasion (`Gift Something Real`) is treated as the hero:
- full-bleed image
- eyebrow `Shop by occasion`
- title `Give something that means something`
- subtitle `Find the design that fits the moment.`
- optional price hint
- primary CTA to the featured occasion
- secondary link `Shop by Vibe`

2. **Occasion Grid**
Remaining occasions render as image-first editorial cards with:
- image
- occasion name
- blurb
- secondary CTA text

3. **Secondary Navigation**
Bottom section linking back to `/vibes`.

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV                                                                       |
+----------------------------------------------------------------------------------+
| FEATURED HERO OCCASION                                                           |
| full-bleed image                                                                 |
| eyebrow / title / subtitle / optional price hint                                 |
| [Featured Occasion CTA]   [Shop by Vibe]                                         |
+----------------------------------------------------------------------------------+
| OCCASION GRID                                                                    |
| [Occasion Card] [Occasion Card]                                                  |
| [Occasion Card] [Occasion Card]                                                  |
+----------------------------------------------------------------------------------+
| SECONDARY NAV                                                                    |
| [Shop by Vibe]                                                                   |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- The page is not a utilitarian list of equal cards anymore; it opens with one dominant featured occasion.
- Cards link to `/occasions/:slug`.
- There is no public artist path from this page.

## Current rules

- Keep the featured-hero model.
- Keep `Shop by Vibe` as the only secondary route from this hub.
