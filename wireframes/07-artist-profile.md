# 07 — Artist Profile

**Route:** `/artists/:slug`  
**Implementation:** [`App.tsx`](../web/src/App.tsx)  
**Status:** Deprecated public wireframe.

## Current behavior

- `/artists/:slug` is not a live public profile page.
- The route redirects to `/vibes` using `<Navigate to="/vibes" replace />`.
- No public portfolio page, artist bio page, or artist-specific product listing exists in the shipped storefront.

## Product rule

Artist information currently lives in:
- PDP trust and attribution surfaces
- internal product metadata
- internal search relevance logic

It does not live as a public destination page.

## Documentation rule

If artist storytelling expands later, create a new spec from current product direction instead of reviving the old browse-by-artist model.
