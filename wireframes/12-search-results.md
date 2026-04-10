# 12 — Search Results

**Route:** `/search`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Legacy wireframe; no dedicated search page in current design.

## Current behavior

- No `/search` route exists in the current app router.
- Global header includes only `Home`, `Shop`, and `Cart` links.
- Product discovery is currently done through `/products` and collection links.

## Visual wireframe

```text
+--------------------------------------------+
| /search                                    |
| no route in current storefront             |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Next.js not-found behavior                 |
+--------------------------------------------+
```
