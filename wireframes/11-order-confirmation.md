# 11 — Checkout Return

**Route:** `/checkout/return?status={success|failed|cancelled}`  
**Implementation:** `shopify-headless/src/app/checkout/return/page.tsx`, `shopify-headless/src/components/checkout/return-tracker.tsx`  
**Status:** Current live return-status page wireframe.

## Purpose

Show informational status after redirecting back from Shopify checkout and reinforce webhook truth source.

## Current structure

1. **Status heading**
- `Checkout returned` for success
- `Payment failed` for failed
- `Checkout cancelled` for cancelled

2. **Explanatory copy**
- Success: payment is unverified until signed `orders/paid` webhook is recorded
- Failed: retry payment and verify gateway + webhook logs
- Cancelled: user can return to cart and continue later

3. **Trust note**
- Explicit note that webhook is authoritative, not browser redirect

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| CHECKOUT RETURN CARD                                                              |
| [Heading based on status]                                                         |
| [Status-specific explanation]                                                     |
| [Authoritative source note: signed webhook]                                       |
+----------------------------------------------------------------------------------+
| FOOTER                                                                            |
+----------------------------------------------------------------------------------+
```
