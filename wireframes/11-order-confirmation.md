# 11 — Order Confirmation

**Route:** `/checkout/success?order_id={id}`  
**Implementation:** `web-next/src/app/checkout/success/page.tsx`, `web/src/pages/OrderConfirmation.tsx`  
**Status:** Current live order confirmation page.

## Purpose

Confirm successful order placement and show user-facing order summary/tracking actions.

## Current structure

1. **Confirmation hero**
- Success mark, order id, delivery window, and celebratory heading

2. **Actions**
- Copy order number
- WhatsApp follow-up CTA (when available) or exchange CTA fallback

3. **Order summary**
- Ordered items, size/qty/price, payment/shipping labels
- Hydrates from `lastOrder` snapshot and optionally refreshes from Medusa `getOrder`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL HEADER                                                                     |
+----------------------------------------------------------------------------------+
| ORDER CONFIRMED CARD                                                               |
| [Order #] [Delivery window] [Copy order number]                                   |
| [WhatsApp help / Exchange CTA]                                                    |
+----------------------------------------------------------------------------------+
| ORDER SUMMARY                                                                      |
| [Line item] [Line item]                                                           |
+----------------------------------------------------------------------------------+
| CONTINUE SHOPPING ACTIONS + FOOTER                                                |
+----------------------------------------------------------------------------------+
```
