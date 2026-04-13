# 09 — Cart

**Route:** `/cart`  
**Implementation:** `web-next/src/app/cart/page.tsx`, `web/src/pages/Cart.tsx`  
**Status:** Current live cart wireframe.

## Purpose

Show cart lines, allow quantity updates/removal, and continue to in-app Medusa checkout.

## Current structure

1. **Empty state**
- Editorial empty card + breadcrumb
- CTA back to `/feelings`

2. **Filled cart**
- Cart line cards with image, size, qty stepper, remove
- Undo-remove toast behavior
- Optional upsell block (gift wrap or bundle upsell)

3. **Summary block**
- Subtotal + shipping estimate + total
- Trust strip items
- Primary CTA to `/checkout`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| EMPTY STATE                                                                       |
| Your cart is empty                                                                |
| Add products from the shop page to continue.                                      |
+----------------------------------------------------------------------------------+
| OR, WHEN FILLED                                                                   |
+----------------------------------------------------------------------------------+
| [Line] image / title / variant / qty stepper / line total                         |
| [Line] image / title / variant / qty stepper / line total                         |
|----------------------------------------------------------------------------------|
| Subtotal / shipping est / total                                                   |
| [Continue to checkout]                                                            |
+----------------------------------------------------------------------------------+
| FOOTER                                                                            |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Cart state comes from shared `CartContext`.
- Supports gift wrap add/remove and line-level undo.
- Checkout continues to local `/checkout` page (not hosted external checkout).
