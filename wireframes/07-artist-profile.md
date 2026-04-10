# 07 — Artist Profile

**Route:** `/artists/:slug`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Not part of current storefront design.

## Current behavior

- Dynamic artist profile routes are not defined.
- The current product detail page focuses on product data only.
- Requests to `/artists/:slug` resolve to not-found.

## Visual wireframe

```text
+------------------------------------------------+
| /artists/:slug                                 |
| no dynamic route implemented                   |
+------------------------------------------------+
                      |
                      v
+------------------------------------------------+
| Next.js not-found behavior                     |
+------------------------------------------------+
```
