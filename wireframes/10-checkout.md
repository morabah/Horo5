# 10 — Checkout

**Route:** `/checkout`  
**Implementation:** Not implemented as a local page; checkout is hosted by Shopify via `cart.checkoutUrl`  
**Status:** Current behavior documented.

## Current behavior

- There is no `shopify-headless/src/app/checkout/page.tsx`.
- Clicking `Proceed to secure checkout` on `/cart` navigates to Shopify-hosted checkout URL.
- The local app only handles return status via `/checkout/return`.

## Visual wireframe

```text
+--------------------------------------------+
| /cart                                      |
| [Proceed to secure checkout]               |
+--------------------------------------------+
                    |
                    v
+--------------------------------------------+
| Shopify-hosted checkout                    |
| (outside local Next.js app)                |
+--------------------------------------------+
```
