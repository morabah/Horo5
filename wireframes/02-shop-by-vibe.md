# 02 — Shop by Vibe

**Route:** `/vibes`  
**Implementation:** [`ShopByVibe.tsx`](../web/src/pages/ShopByVibe.tsx), [`VibeCommerceCard.tsx`](../web/src/components/VibeCommerceCard.tsx)  
**Status:** Current authoritative hub wireframe.

## Purpose

Primary browse hub for the live HORO taxonomy.

## Current structure

1. **Hero Montage**
Five-tile collage using the live vibe visuals, with one overlaid copy block:
- eyebrow: `Shop by vibe`
- title: `Which vibe is yours?`
- subtitle: `Every design starts with a feeling. Start with yours.`

2. **Vibe Grid**
Five `VibeCommerceCard` entries:
- `Emotions`
- `Zodiac`
- `Fiction`
- `Career`
- `Trends`

Desktop uses a six-column grid where each card spans two columns and the final row is centered visually. Mobile collapses to one column, then two columns on small tablets.

3. **Secondary Navigation**
Single secondary action: `Shop by Occasion` → `/occasions`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV                                                                       |
+----------------------------------------------------------------------------------+
| HERO MONTAGE                                                                     |
| [Tile] [Tile] [Copy Block: Which vibe is yours?]                                 |
| [Tile] [Tile] [Tile]                                                             |
+----------------------------------------------------------------------------------+
| VIBE GRID                                                                        |
| [Emotions] [Zodiac] [Fiction]                                                    |
|           [Career]  [Trends]                                                     |
+----------------------------------------------------------------------------------+
| SECONDARY NAV                                                                    |
| [Shop by Occasion]                                                               |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- The full card links to `/vibes/:slug`.
- Cards are image-first with frosted footer treatment and hover lift.
- There is no public `Browse by Artist` action.
- Search is available from the global nav, not inside the page body.

## Current rules

- Use the live taxonomy labels only.
- Keep the current product-direction rule: artist is not a browse axis.
- Keep this page as the default shopping hub after homepage CTAs.
