# 12 — Search Results

**Route:** `/search`  
**Implementation:** [`Search.tsx`](../web/src/pages/Search.tsx), [`Nav.tsx`](../web/src/components/Nav.tsx), [`SearchSuggestionPanel.tsx`](../web/src/components/SearchSuggestionPanel.tsx), [`search/view.ts`](../web/src/search/view.ts)  
**Status:** Current authoritative search wireframe.

## Purpose

Provide one blended discovery surface for designs first, then related vibes and occasions.

## Current structure

1. **Lead Split**
- left: search panel
- right: large editorial image tied to current query or scope

2. **Search Panel**
- visible search field
- autosuggest dropdown
- scoped chips when inside vibe or occasion search
- summary text
- popular searches when input is empty

3. **Result Controls**
- desktop: sticky sort / price / optional vibe filter row
- mobile: bottom-sheet filter and sort dialog

4. **Blended Results**
- primary section: designs grid
- secondary section: vibes
- tertiary section: occasions

5. **No-Results State**
- clear message
- `Shop by Vibe`
- `Browse All Designs`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV WITH VISIBLE SEARCH                                                   |
+----------------------------------------------------------------------------------+
| SEARCH LEAD SPLIT                                                                |
| [Search Field + Autosuggest + Summary + Chips] | [Large Editorial Query Image]   |
+----------------------------------------------------------------------------------+
| RESULT CONTROLS                                                                  |
| [Sort] [Price] [Optional Vibe Filter]                                            |
+----------------------------------------------------------------------------------+
| DESIGNS                                                                          |
| [Merch Card] [Merch Card] [Merch Card]                                           |
| [Merch Card] [Merch Card] [Merch Card]                                           |
+----------------------------------------------------------------------------------+
| VIBES                                                                            |
| [Vibe Card] [Vibe Card] [Vibe Card]                                              |
+----------------------------------------------------------------------------------+
| OCCASIONS                                                                        |
| [Occasion Card] [Occasion Card] [Occasion Card]                                  |
+----------------------------------------------------------------------------------+
| NO-RESULTS VARIANT                                                               |
| message                                                                          |
| [Shop by Vibe]   [Browse All Designs]                                            |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Search supports English input, typo tolerance, Arabic aliases, and hidden legacy vibe labels.
- There are no public tabs.
- There are no public artist results or artist suggestions.
- Design cards use the shared merch-card model with quick view.
- Vibe and occasion results use image-first cards.
- Scoped search is supported through `?vibe=` and `?occasion=` query params.

## Current rules

- Keep designs as the primary result group.
- Keep search visible in the global nav on desktop and mobile.
- Do not restore artist result groups.
