# 01 — Homepage

**Route:** `/`  
**Implementation:** `shopify-headless/src/app/page.tsx`, `shopify-headless/src/components/collection-card.tsx`, `shopify-headless/src/components/product-card.tsx`  
**Status:** Current live homepage wireframe for the Next.js storefront.

## Purpose

Landing page that introduces the headless storefront, then drives users to collections and products.

## Current structure

1. **Hero panel**
- Eyebrow: `HORO Storefront`
- Large headline about custom design + Shopify headless setup
- Supporting copy describing AI-assisted iteration

2. **Collections section**
- Title: `Collections`
- Grid of 3 `CollectionCard` tiles
- Each card links to `/products?collection={handle}`

3. **Latest Products section**
- Title: `Latest Products`
- Grid of up to 8 `ProductCard` tiles (2 columns mobile, 4 desktop)
- Each card links to `/products/{handle}`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER: [HORO] [Home] [Shop] [Cart]                                      |
+----------------------------------------------------------------------------------+
| HERO PANEL                                                                       |
| HORO Storefront                                                                  |
| Inject your custom design and keep Shopify...                                    |
| supporting copy                                                                  |
+----------------------------------------------------------------------------------+
| COLLECTIONS                                                                      |
| [Collection Card] [Collection Card] [Collection Card]                            |
+----------------------------------------------------------------------------------+
| LATEST PRODUCTS                                                                  |
| [Product] [Product] [Product] [Product]                                          |
| [Product] [Product] [Product] [Product]                                          |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Data is fetched server-side using `getCollections(3)` and `getProducts(8)`.
- Page uses the shared layout shell (`StoreHeader` and `StoreFooter`).
- Collection links currently include a `collection` query param, but filtering is not yet applied on the products page.
