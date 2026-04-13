# 06 — Browse by Artist

**Route:** `/artists`  
**Implementation:** `web-next/src/app/artists/page.tsx`  
**Status:** Implemented as redirect.

## Current behavior

- `/artists` redirects to `/feelings`.
- No standalone artist directory page is rendered.
- Artist discovery currently happens inside product/search surfaces.

## Visual wireframe

```text
+--------------------------------------------+
| GET /artists                               |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| redirect -> /feelings                      |
+--------------------------------------------+
```
