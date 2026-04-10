# 02 — Shop by Vibe

**Route:** `/vibes`  
**Implementation:** Not implemented in `shopify-headless/src/app`  
**Status:** Legacy wireframe; this route is not part of the current storefront design.

## Current behavior

- There is no `/vibes` page in the live Next.js app.
- Primary browse entry is `/products` from the global header `Shop` link.
- If this route is visited directly, the app falls back to standard Next.js not-found behavior.

## Visual wireframe

```text
+--------------------------------------------+
| /vibes                                     |
| no route in current storefront             |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Next.js not-found behavior                 |
+--------------------------------------------+
```

## Product rule

Keep wireframes aligned to implemented routes only unless a new page is explicitly added to `src/app`.
