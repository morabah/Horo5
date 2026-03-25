# 09 — Cart

**Route:** `/cart`  
**Implementation:** [`Cart.tsx`](../web/src/pages/Cart.tsx)  
**Status:** Current authoritative cart wireframe.

## Purpose

Review selections, keep one clear path to checkout, and show only one upsell module at a time.

## Current structure

1. **Empty State**
- editorial image
- heading `Your cart`
- explanatory copy
- CTA `Find Your Design` → `/vibes`

2. **Filled Cart Layout**
- left column: cart items
- right column: sticky order summary
- upsell module appears between items and summary flow

3. **Cart Item Row**
- image linking to PDP
- product name
- artist line when available
- size
- quantity stepper
- line price
- remove action

4. **Single Upsell Rule**
- 1 tee: gift wrap + story card upsell
- 2+ tees: bundle savings upsell
- never both

5. **Order Summary**
- subtotal
- gift-wrap fee when selected
- shipping estimate
- estimated total
- `Proceed to checkout`
- `Continue shopping`
- trust pills

## Key behaviors

- Shipping estimate is visible before checkout.
- No recommendation grid competes with the checkout CTA.
- Summary uses the shared cart trust copy and stays sticky on desktop.

## Current rules

- Keep only one upsell module visible.
- Keep `Proceed to checkout` as the dominant action.
- Do not add unrelated discovery modules here.
