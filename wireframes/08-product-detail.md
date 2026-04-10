# 08 — Product Detail

**Route:** `/products/:handle`  
**Implementation:** `shopify-headless/src/app/products/[handle]/page.tsx`, `shopify-headless/src/components/cart/add-to-cart-button.tsx`  
**Status:** Current live PDP wireframe.

## Purpose

Display core product information and allow direct cart addition using the default variant.

## Current structure

1. **Main two-column layout**
- Left: single hero image (`featuredImage` fallback to first product image)
- Right: title, price, description, and add-to-cart action

2. **Product meta**
- Page metadata generated per product handle
- Canonical URL and Open Graph image when available

3. **Purchase action**
- `Add to cart` button adds quantity `1`
- Uses first available variant as default
- If no variant exists, page shows a non-purchasable warning

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| [HERO IMAGE]                                     | PRODUCT TITLE                  |
|                                                  | PRICE                          |
|                                                  | DESCRIPTION                    |
|                                                  | [Add to cart]                  |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Unknown handles return not-found via `notFound()`.
- Product view analytics are tracked with `ProductViewTracker`.
- No breadcrumbs, accordions, related products, quick view, or sticky mobile dock in current implementation.
