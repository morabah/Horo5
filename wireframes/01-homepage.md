# 01 — Homepage

**Route:** `/`  
**Implementation:** `web-next/src/app/page.tsx`, `web-next/src/components/home-page.tsx`, `web/src/pages/Home.tsx`  
**Status:** Current implementation (web-next mount of shared web storefront UI).

## Purpose

Give a fast shopping entry: featured products first, then feeling-based discovery.

## Current structure

1. **Hero section**
- Rendered by `HomeHeroWearMean`
- Brand-first visual + primary navigation intent

2. **Latest drop section**
- Uses first 6 catalog products with real imagery
- `MerchProductCard` grid with quick view
- Primary CTA to `/products`

3. **Feelings section**
- Featured feelings cards linking to `/feelings/:slug`
- Secondary CTAs: `/products`, `/feelings`, `/occasions`

4. **Proof/editorial section**
- Rendered by `HomeProofSplit`
- Followed by shared footer chrome

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER (Nav + Search + Cart)                                              |
+----------------------------------------------------------------------------------+
| HERO (HomeHeroWearMean)                                                          |
+----------------------------------------------------------------------------------+
| BUY FAST / FEATURED PRODUCTS                                                     |
| [Product] [Product] [Product]                                                    |
| [Product] [Product] [Product]          [Shop all]                                |
+----------------------------------------------------------------------------------+
| SHOP BY FEELING                                                                  |
| [Feeling Card] [Feeling Card] [Feeling Card]                                     |
| [Feeling Card] [Feeling Card] [Feeling Card]                                     |
+----------------------------------------------------------------------------------+
| PROOF / STORY SECTION (HomeProofSplit)                                           |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Home data is fetched on the server via `fetchStorefrontCatalogServer`.
- `Home` hydrates shared runtime catalog through `setRuntimeCatalog`.
- Quick view opens inline modal without leaving home.
