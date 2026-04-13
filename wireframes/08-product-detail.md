# 08 — Product Detail

**Route:** `/products/:slug`  
**Implementation:** `web-next/src/app/products/[slug]/page.tsx`, `web-next/src/components/product-detail-page.tsx`, `web/src/pages/ProductDetail.tsx`  
**Status:** Current live PDP wireframe.

## Purpose

Display full product story, media, sizing, and add-to-cart flow for HORO merch.

## Current structure

1. **Server + client composition**
- Server fetches product + catalog (`Promise.all`)
- Client page mounted via `ProductDetailPage`

2. **PDP content**
- Product gallery/story blocks
- Price + merchandising info
- Size selection and add-to-cart CTA

3. **SEO + structured data**
- `generateMetadata` builds page OG/canonical data
- Product JSON-LD is injected

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| [MEDIA / PRODUCT STORY]                           | PRODUCT TITLE                  |
|                                                   | PRICE + BADGES                 |
|                                                   | SIZE SELECTOR                  |
|                                                   | [ADD TO CART]                  |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Unknown slugs return `notFound()`.
- Metadata + JSON-LD are generated server-side.
- PDP uses shared `web/src/pages/ProductDetail` implementation (same UX as main storefront).
