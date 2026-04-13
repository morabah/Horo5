# 10 — Checkout

**Route:** `/checkout`  
**Implementation:** `web-next/src/app/checkout/page.tsx`, `web/src/pages/Checkout.tsx`  
**Status:** Fully implemented in-app checkout (Medusa + Paymob/COD).

## Current behavior

- Checkout runs inside the storefront app.
- User fills contact + shipping address, then payment method.
- Payment providers are loaded from Medusa (COD and Paymob options).
- Card/wallet payments redirect to Paymob then return to `/checkout` for status handling.
- Successful completion navigates to `/checkout/success?order_id=...`.

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| CHECKOUT PAGE                                                                     |
| Contact -> Address -> Shipping -> Payment                                         |
| [Place order / Continue to Paymob]                                                |
+----------------------------------------------------------------------------------+
                    |
         +----------+-----------+
         |                      |
         v                      v
+-------------------------+   +--------------------------+
| COD completion in app   |   | Paymob redirect + return |
+-------------------------+   +--------------------------+
         |                      |
         +----------+-----------+
                    v
+--------------------------------------------+
| /checkout/success?order_id=...             |
+--------------------------------------------+
```
