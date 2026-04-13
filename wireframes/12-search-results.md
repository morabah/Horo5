# 12 — Search Results

**Route:** `/search`  
**Implementation:** `web-next/src/app/search/page.tsx`, `web-next/src/components/search-page.tsx`, `web/src/pages/Search.tsx`  
**Status:** Fully implemented.

## Purpose

Unified discovery across products, feelings, and occasions with query + faceted filters.

## Current behavior

- Search query is URL-driven (`q`) with debounce.
- Includes suggestions panel (keyboard accessible).
- Results grouped into designs, feelings, and occasions.
- Supports scope (`feeling` / `occasion`) and multiple filters (price, size, artist, occasion, color, sort).
- Mobile uses filter sheet; desktop uses sticky filter bar.

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| SEARCH HERO                                                                          |
| [search input + suggestions] [visual panel]                                          |
+----------------------------------------------------------------------------------+
| FILTERS (sticky desktop / modal mobile)                                               |
| sort | price | feeling | size | artist | occasion | color                            |
+----------------------------------------------------------------------------------+
| RESULTS GROUPS                                                                        |
| Designs grid                                                                          |
| Related feelings                                                                       |
| Related occasions                                                                      |
+----------------------------------------------------------------------------------+
| Zero-state with recovery CTAs when no matches                                         |
+----------------------------------------------------------------------------------+
```
