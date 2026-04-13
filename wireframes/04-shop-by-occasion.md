# 04 — Shop by Occasion

**Route:** `/occasions`  
**Implementation:** `web-next/src/app/occasions/page.tsx`, `web-next/src/components/shop-by-occasion-page.tsx`, `web/src/pages/ShopByOccasion.tsx`  
**Status:** Fully implemented.

## Purpose

Browse curated products by shopping moment (gift, events, everyday use-case).

## Current structure

1. **Hero/header context**
- Occasion-specific title and explanatory copy
- SEO metadata generated server-side

2. **Occasion cards grid**
- Card list based on runtime catalog occasions
- Each card links to `/occasions/:slug`

3. **Shared storefront chrome**
- Uses global nav/footer and common spacing shell

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| SHOP BY MOMENT HERO                                                               |
| Title + supporting copy                                                           |
+----------------------------------------------------------------------------------+
| OCCASION GRID                                                                      |
| [Occasion] [Occasion] [Occasion]                                                  |
| [Occasion] [Occasion] [Occasion]                                                  |
+----------------------------------------------------------------------------------+
| FOOTER                                                                            |
+----------------------------------------------------------------------------------+
```
