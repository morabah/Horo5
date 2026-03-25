# 06 — Browse by Artist

**Route:** `/artists`  
**Implementation:** [`App.tsx`](../web/src/App.tsx)  
**Status:** Deprecated public wireframe.

## Current behavior

- `/artists` is not a live browse hub.
- The route redirects to `/vibes` using `<Navigate to="/vibes" replace />`.
- No public artist cards, artist listing grid, or artist-first discovery UI exists in the shipped storefront.

## Product rule

Artist remains behind the scenes for browsing and search. Public artist visibility is limited to product-page legitimacy and supporting metadata where already implemented.

## Documentation rule

Do not create new public artist-hub designs from this file. If legacy links exist, they should continue redirecting to `/vibes`.
