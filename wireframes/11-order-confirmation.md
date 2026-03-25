# 11 — Order Confirmation

**Route:** `/checkout/success`  
**Implementation:** [`OrderConfirmation.tsx`](../web/src/pages/OrderConfirmation.tsx), [`CommerceContinuityPanel.tsx`](../web/src/components/CommerceContinuityPanel.tsx)  
**Status:** Current authoritative confirmation wireframe.

## Purpose

Provide a truthful post-purchase state instead of a generic success screen.

## Current structure

1. **Success Hero**
- checkmark
- `You completed this design`
- real order confirmation state
- truthful WhatsApp/help line

2. **Continuity Panel**
Bridges checkout into post-purchase.

3. **Status Cards**
- order received
- payment chosen
- delivery window
- WhatsApp status

4. **Two-Column Detail Area**
- left: order summary
- right: `What's next`

5. **Help CTA**
- WhatsApp order help only when configured and relevant
- otherwise exchange-policy CTA

6. **Community / Explore**
- Instagram follow/tag block only when configured
- `Shop by Vibe`
- `New arrivals`

## Visual wireframe

```text
+----------------------------------------------------------------------------------+
| GLOBAL NAV                                                                       |
+----------------------------------------------------------------------------------+
| SUCCESS HERO                                                                     |
| checkmark / completed-design headline                                            |
| truthful order state / truthful WhatsApp-help line                               |
+----------------------------------------------------------------------------------+
| CONTINUITY PANEL                                                                 |
+----------------------------------------------------------------------------------+
| STATUS CARDS                                                                     |
| [Order received] [Payment chosen] [Delivery window] [WhatsApp status]            |
+----------------------------------------------------------------------------------+
| ORDER SUMMARY                                       | WHAT'S NEXT                |
| items / totals / shipping summary                   | next step text             |
|                                                     | help explanation           |
+----------------------------------------------------------------------------------+
| HELP CTA                                                                        |
| [WhatsApp order help when configured] OR [Exchange policy]                       |
+----------------------------------------------------------------------------------+
| COMMUNITY / EXPLORE                                                             |
| [Instagram block when configured] [Shop by Vibe] [New arrivals]                 |
+----------------------------------------------------------------------------------+
| FOOTER                                                                           |
+----------------------------------------------------------------------------------+
```

## Key behaviors

- Confirmation is driven from the stored last-order snapshot.
- No fake order ID or fake tracking promise is shown.
- Support/help CTAs hide when channels are not configured.
- If order details are missing from the current session, the page falls back to a truthful summary message.

## Current rules

- Keep post-purchase claims conditional on real config and real order state.
- Keep this page in the shared app shell.
