# 10 — Checkout

**Route:** `/checkout`  
**Implementation:** [`Checkout.tsx`](../web/src/pages/Checkout.tsx), [`CommerceContinuityPanel.tsx`](../web/src/components/CommerceContinuityPanel.tsx)  
**Status:** Current authoritative checkout wireframe.

## Purpose

Collect shipping and payment information with maximum clarity and truthful reassurance.

## Current structure

1. **Shared Shell + Local Back Link**
The global app shell remains visible. Inside the page body there is also a `Back to cart` link.

2. **Progress Indicator**
Three-step indicator:
- `Information`
- `Shipping`
- `Payment`

3. **Continuity Panel**
Brand reassurance strip above the active step.

4. **Step 1 — Information**
- email
- phone
- WhatsApp opt-in
- guest-checkout reassurance
- shipping address fields
- submit-first validation

5. **Step 2 — Shipping**
- standard and express radio options
- delivery window
- exchange link

6. **Step 3 — Payment**
- COD default
- card option with 30 EGP incentive
- Arabic security reassurance
- exchange link
- final `Place order`

7. **Order Summary Sidebar**
Visible on every step with product images and live total math.

## Key behaviors

- Step 1 CTA is always clickable; invalid submit reveals inline errors and focuses the first invalid field.
- Guest checkout is supported by default.
- Shipping price is visible before payment.
- Order summary includes product images throughout the flow.
- No glass form fields are used in checkout.

## Current rules

- Keep the current three-step flow.
- Keep COD as default.
- Keep Arabic reassurance in the payment step, but do not add a public language toggle here.
