# 03 — Vibe Collection

**Route:** `/vibes/:slug`  
**Implementation:** `web-next/src/app/vibes/[slug]/page.tsx`, `web/src/data/legacy-slugs.ts`  
**Status:** Implemented as legacy slug mapping redirect.

## Current behavior

- Incoming legacy vibe slugs map to feeling slugs using `LEGACY_VIBE_SLUG_TO_FEELING_SLUG`.
- Then route redirects to `/feelings/:slug`.
- Unknown slugs still redirect to `/feelings/{same-slug}`.

## Visual wireframe

```text
+--------------------------------------------+
| GET /vibes/:slug                           |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| map legacy slug (if configured)            |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| redirect -> /feelings/:mappedSlug          |
+--------------------------------------------+
```
