# 05 — Occasion Collection

**Route:** `/occasions/:slug`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Legacy wireframe; dynamic occasion collections are not part of the current build.

## Current behavior

- No `occasions` route group exists in the current app.
- Product discovery remains centralized under `/products`.
- `/:slug` occasion detail paths are unresolved by route files.

## Visual wireframe

```text
+--------------------------------------------+
| /occasions/:slug                           |
| no dynamic route implemented               |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Next.js not-found behavior                 |
+--------------------------------------------+
```
