# 09 — Cart

**Route:** `/cart`  
**Implementation:** `shopify-headless/src/app/cart/page.tsx`, `shopify-headless/src/components/cart/cart-view.tsx`  
**Status:** Current live cart wireframe.

## Purpose

Show cart lines, allow quantity updates, and redirect users to Shopify-hosted checkout.

## Current structure

1. **Empty state**
- Card with heading `Your cart is empty`
- Supporting text: add products from shop page

2. **Filled cart**
- Heading `Your Cart`
- List of line items with image, product title, variant title, line total
- Quantity stepper (`-` and `+`) per line

3. **Summary block**
- Subtotal amount
- Primary CTA: `Proceed to secure checkout`

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
| Subtotal                                                                          |
| [Proceed to secure checkout]                                                      |
+----------------------------------------------------------------------------------+
| FOOTER                                                                            |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Cart is restored from `localStorage` cart ID when available.
- Quantity changes call `/api/cart/lines`.
- Checkout button redirects browser to `cart.checkoutUrl`.
