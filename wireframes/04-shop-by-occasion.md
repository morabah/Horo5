# 04 — Shop by Occasion

**Route:** `/occasions`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Legacy wireframe; this route is not in the current storefront design.

## Current behavior

- No `/occasions` route exists in the app router.
- Current browsing model uses `/products` as the single listing surface.
- Direct hits to `/occasions` resolve to not-found.

## Visual wireframe

```text
+--------------------------------------------+
| /occasions                                 |
| no route in current storefront             |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Next.js not-found behavior                 |
+--------------------------------------------+
```
