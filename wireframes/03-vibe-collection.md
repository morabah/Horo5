# 03 — Vibe Collection

**Route:** `/vibes/:slug`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Legacy wireframe; dynamic vibe collection pages do not exist in the current design.

## Current behavior

- There is no vibe taxonomy route in the live app.
- Product browsing currently happens through `/products` and `/products/:handle`.
- Requests to `/vibes/:slug` are unresolved by app routes.

## Visual wireframe

```text
+--------------------------------------------+
| /vibes/:slug                               |
| no dynamic route implemented               |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Next.js not-found behavior                 |
+--------------------------------------------+
```
