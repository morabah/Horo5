# 07 — Artist Profile

**Route:** `/artists/:slug`  
**Implementation:** `web-next/src/app/artists/[slug]/page.tsx`  
**Status:** Implemented as redirect.

## Current behavior

- Dynamic artist slugs redirect to `/feelings`.
- No dedicated artist profile detail page exists in `web-next`.
- Artist attribution is shown in product/search cards where available.

## Visual wireframe

```text
+------------------------------------------------+
| GET /artists/:slug                             |
+------------------------------------------------+
                      |
                      v
+------------------------------------------------+
| redirect -> /feelings                          |
+------------------------------------------------+
```
