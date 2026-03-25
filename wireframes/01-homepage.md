# 01 — Homepage

**Route:** `/`  
**Implementation:** [`Home.tsx`](../web/src/pages/Home.tsx), [`HomeVibeGrid.tsx`](../web/src/components/HomeVibeGrid.tsx), [`MerchProductCard.tsx`](../web/src/components/MerchProductCard.tsx)  
**Status:** Current authoritative wireframe. Use this over older homepage sequencing notes.

## Purpose

Single-mode shopping story that gets the customer immersed fast, then moves them to `Shop by Vibe`.

## Current structure

1. **Hero**
Hero image dominates the first viewport with dark scrim, headline, subline, price/trust ribbon, and one primary CTA: `Shop by Vibe`.

2. **The Feeling**
Framed editorial problem block. The copy stays text-led, then lands in a large glass-focus `Find your vibe` panel with five live vibe chips and one handoff CTA into the vibe grid.

3. **HomeVibeGrid**
Five image-led commerce cards for `Emotions`, `Zodiac`, `Fiction`, `Career`, and `Trends`. Each card routes to `/vibes/:slug`. The grid now begins immediately after the framing rail, without repeating a second intro header.

4. **Latest Drop**
Four shared merch cards using the same browse hierarchy as collection and search surfaces: image, small proof/vibe line, product name, price, quick view. No artist line.

5. **Trust Row**
Four trust points: cotton weight, licensed design, free exchange, COD.

6. **Stories**
Three quote cards with real-name / city formatting.

7. **Simple Plan**
`Find your vibe → Pick your design → It arrives`

8. **Invite**
Closing headline plus `Shop by Vibe` CTA.

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV: [Menu] [HORO] [Shop by Vibe] [Shop by Occasion] [About] [Search]    |
|                                                                    [Cart]        |
+----------------------------------------------------------------------------------+
| HERO IMAGE                                                                       |
| headline / subline                                                               |
| trust ribbon                                                                     |
| [Shop by Vibe]                                                                   |
+----------------------------------------------------------------------------------+
| THE FEELING                                                                      |
| problem copy                                                                     |
| glass focus panel: Find your vibe / five vibe chips / [Shop by Vibe]            |
+----------------------------------------------------------------------------------+
| VIBE GRID                                                                        |
| [Emotions] [Zodiac] [Fiction]                                                    |
|           [Career]  [Trends]                                                     |
+----------------------------------------------------------------------------------+
| LATEST DROP                                                                      |
| [Merch Card] [Merch Card] [Merch Card] [Merch Card]                              |
+----------------------------------------------------------------------------------+
| TRUST ROW                                                                        |
| [220 GSM] [Licensed Design] [Free Exchange] [COD]                                |
+----------------------------------------------------------------------------------+
| STORIES                                                                          |
| [Quote Card] [Quote Card] [Quote Card]                                           |
+----------------------------------------------------------------------------------+
| SIMPLE PLAN                                                                      |
| Find your vibe  ->  Pick your design  ->  It arrives                             |
+----------------------------------------------------------------------------------+
| FINAL CTA                                                                        |
| [Shop by Vibe]                                                                   |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Global nav stays in the shared app shell. On desktop it exposes a visible search field. On mobile it exposes menu, logo, cart, and a visible full-width search field under the top row.
- Hero CTA and closing CTA both route to `/vibes`.
- Latest-drop cards open quick view from the shared merch-card system.
- Homepage cards do not surface artist metadata.
- Footer is not part of `Home.tsx`; it comes from [`Layout.tsx`](../web/src/components/Layout.tsx).

## Current rules

- Keep the current section order. Do not move trust or stories ahead of `Latest Drop`.
- Do not reintroduce public artist surfacing on homepage cards.
- Do not reintroduce a secondary image into `The Feeling`.
- Keep the glass focus panel attached to the problem block so the section frames the next action instead of ending in dead space.
- `Find your vibe` should read as the dominant line inside that panel, not as a minor eyebrow above the grid.
- Homepage is English-first. No public language toggle is present.
