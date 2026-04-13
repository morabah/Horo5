# 02 — Shop by Vibe

**Route:** `/vibes`  
**Implementation:** `web-next/src/app/vibes/page.tsx`  
**Status:** Implemented as a legacy redirect.

## Current behavior

- Visiting `/vibes` redirects immediately to `/feelings`.
- No standalone content renders on `/vibes`.
- The canonical browse hub is `/feelings`.

## Visual wireframe

```text
+--------------------------------------------+
| GET /vibes                                 |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| 307/308 redirect -> /feelings              |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Shop by Feeling page                       |
+--------------------------------------------+
```
