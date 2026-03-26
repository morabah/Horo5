# 01 — Homepage

**Route:** `/`  
**Implementation:** [`Home.tsx`](../web/src/pages/Home.tsx), [`HomeHeroExplosive.tsx`](../web/src/components/HomeHeroExplosive.tsx), [`HomeFeelingExplosion.tsx`](../web/src/components/HomeFeelingExplosion.tsx), [`HomeStickyVibeShowcase.tsx`](../web/src/components/HomeStickyVibeShowcase.tsx), [`MerchProductCard.tsx`](../web/src/components/MerchProductCard.tsx)  
**Status:** Current authoritative wireframe. Use this over older homepage sequencing notes.

[`HomeVibeGrid.tsx`](../web/src/components/HomeVibeGrid.tsx) is a separate component and is **not** mounted on `/`; the homepage vibe entry is the sticky/accordion showcase only.

## Purpose

Single-mode shopping story that gets the customer immersed fast, then moves them to `Shop by Vibe`.

## Current structure

1. **Hero** ([`HomeHeroExplosive`](../web/src/components/HomeHeroExplosive.tsx))
Full-viewport cinematic image with dark scrim. Semantic `h1` for split headline (“Wear” / “What you mean”). First-viewport subcopy states problem + action; price / COD / exchange ribbon; one primary CTA: `Shop by Vibe` → `/vibes`.

2. **The Feeling** ([`HomeFeelingExplosion`](../web/src/components/HomeFeelingExplosion.tsx))
Short text-led editorial block: eyebrow, one headline, one supporting sentence. No full-screen product art, no sticky scroll sequence. Target: roughly one viewport height or less on desktop.

3. **Find your vibe** ([`HomeStickyVibeShowcase`](../web/src/components/HomeStickyVibeShowcase.tsx))
Section intro (“Find your vibe”) plus five image-led cards (`Emotions`, `Zodiac`, `Fiction`, `Career`, `Trends`). **Mobile:** stacked column; each card is a single link to `/vibes/:slug` with visible name, one-line tagline, and Explore affordance. **Desktop (`md+`):** horizontal accordion-style row; hover/focus expands a column; every card shows a visible action at rest. Whole card is keyboard-focusable.

4. **Latest Drop**
Four shared merch cards using the same browse hierarchy as collection and search surfaces: image, small proof/vibe line, product name, price, quick view. No artist line.

5. **Trust Row**
Four trust points: cotton weight, licensed design, free exchange, COD.

6. **Stories**
Three quote cards with real-name / city formatting; neutral eyebrow (“What People Say”); attribution chips link to real product or vibe routes where applicable.

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
| h1 split headline / problem + action subcopy                                     |
| trust ribbon                                                                     |
| [Shop by Vibe]                                                                   |
+----------------------------------------------------------------------------------+
| THE FEELING                                                                      |
| short text: headline + one support line (no sticky frames)                     |
+----------------------------------------------------------------------------------+
| FIND YOUR VIBE                                                                   |
| [stacked cards mobile | accordion row desktop]                                   |
| each: name, tagline, [Explore] -> /vibes/:slug                                   |
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
- Optional deep link `/?vibe=:slug` scrolls to the matching vibe card in the showcase (see `Home.tsx`).

## Current rules

- Keep the current section order. Do not move trust or stories ahead of `Latest Drop`.
- Do not reintroduce public artist surfacing on homepage cards.
- Do not reintroduce a long sticky / full-screen image “feeling” sequence; the feeling block stays compact and text-led.
- Homepage is English-first. No public language toggle is present.
