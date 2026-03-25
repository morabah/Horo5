# 08 — Product Detail Page

**Route:** `/products/:slug`  
**Implementation:** [`ProductDetail.tsx`](../web/src/pages/ProductDetail.tsx), [`ProductQuickView.tsx`](../web/src/components/ProductQuickView.tsx)  
**Status:** Current authoritative PDP wireframe.

## Purpose

Turn product confidence into purchase action with clear story, clear proof, and minimal distraction.

## Current structure

1. **Breadcrumb**
`Home / {vibe} / {product}`

2. **Primary Product Layout**
- left: main image with optional thumbnail rail
- right: sticky purchase rail on desktop

3. **Purchase Rail**
- vibe pill
- large product title
- violet story card
- price
- size selector
- size guide modal trigger
- primary CTA `Add to Bag — {price}` or `Choose Size`
- out-of-stock path: `Notify Me` restock form
- optional WhatsApp support button when configured
- trust chips
- artist attribution with avatar

4. **Accordion Section**
- product details and fit
- design story
- shipping and returns

5. **Related Products**
`More from {vibe}` grid with quick view support.

6. **Mobile CTA Dock**
Fixed `Add to Bag` bar at the bottom of the viewport.

## Key behaviors

- Gallery opens a lightbox.
- Thumbnail rail appears only when multiple images exist.
- Current asset layer does not guarantee five distinct PDP images for every product; the wireframe must reflect the real gallery contract, not the earlier aspirational one.
- Artist remains visible here as legitimacy proof.
- If support URLs are unset, the WhatsApp button hides instead of falling back.

## Current rules

- Keep artist attribution on PDP.
- Keep browse surfaces artist-light, but PDP may show artist in trust chips and attribution.
- Keep the sticky mobile CTA and the related-products quick view.
