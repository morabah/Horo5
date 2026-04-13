# 05 — Occasion Collection

**Route:** `/occasions/:slug`  
**Implementation:** `web-next/src/app/occasions/[slug]/page.tsx`, `web-next/src/components/occasion-collection-page.tsx`, `web/src/pages/OccasionCollection.tsx`  
**Status:** Fully implemented dynamic collection page.

## Purpose

Display a single occasion landing page with occasion-specific products.

## Current structure

1. **Occasion hero**
- Occasion name, intro copy, visual framing
- Breadcrumb/nav context

2. **Product listing**
- Grid of products belonging to the occasion
- Product cards with quick-view and PDP links

3. **Fallback behavior**
- Unknown slug uses `notFound()`
- Metadata generated from fetched occasion

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| OCCASION HERO                                                                     |
| [Occasion title] [Occasion blurb]                                                 |
+----------------------------------------------------------------------------------+
| OCCASION PRODUCTS                                                                  |
| [Product] [Product] [Product]                                                     |
| [Product] [Product] [Product]                                                     |
+----------------------------------------------------------------------------------+
| FOOTER                                                                            |
+----------------------------------------------------------------------------------+
```
