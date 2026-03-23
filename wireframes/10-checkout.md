# 10 — Checkout

**Route:** `/checkout` | **Purpose:** Collect shipping + payment with maximum trust and minimum friction — 3 steps  
**Source:** Brand Guidelines v2.3, Section 8.4 (non-negotiable rules)

---

## Three-Part Screen Structure

| Part           | What Happens                                                 |
|----------------|--------------------------------------------------------------|
| Setup          | "Almost done" — momentum, clear progress                     |
| Confrontation  | Payment trust, delivery clarity, size doubt                  |
| Resolution     | Place Order                                                  |

---

## Checkout Flow (3 Steps)

```
  Step 1                    Step 2                    Step 3
  INFORMATION        →      SHIPPING          →       PAYMENT
  (Contact + Address)       (Method + Cost)           (COD / Card)
```

---

## Desktop Wireframe (1440px)

### Progress Indicator (persistent across all 3 steps)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (simplified — no search, no categories)                     │
│  [HORO]                              [← Back to Cart]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   PROGRESS INDICATOR (Papyrus bg)                                    ║
║                                                                      ║
║        ●─────────────────○─────────────────○                         ║
║     Step 1             Step 2             Step 3                     ║
║   Information          Shipping           Payment                    ║
║                                                                      ║
║   ● = current (Ember #E8593C)                                        ║
║   ● filled = completed (Obsidian #1A1A1A)                           ║
║   ○ = upcoming (Stone #D4CFC5)                                       ║
║   Line = Stone default, Obsidian when completed                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 1: Information

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   MAIN AREA (2-column: 60% form / 40% order summary)                ║
║   Clean White #FFFFFF bg for form area                               ║
║                                                                      ║
║   ┌──────────────────────────────────┐  ┌────────────────────────┐  ║
║   │                                  │  │                        │  ║
║   │  H2: "Contact Information"       │  │  ORDER SUMMARY         │  ║
║   │  Space Grotesk 500 / 22px       │  │  (persistent sidebar)  │  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────────────────┐        │  │  ┌────────┐            │  ║
║   │  │ Email *              │        │  │  │ [img]  │ The Weight│  ║
║   │  │ label above field    │        │  │  │ 64px   │ of Light  │  ║
║   │  │ [________________]   │        │  │  └────────┘ Size M    │  ║
║   │  └──────────────────────┘        │  │             Qty 1     │  ║
║   │                                  │  │             799 EGP   │  ║
║   │  ┌──────────────────────┐        │  │                        │  ║
║   │  │ Phone * (for WhatsApp│        │  │  ┌────────┐            │  ║
║   │  │ confirmation)        │        │  │  │ [img]  │ Midnight  │  ║
║   │  │ [________________]   │        │  │  │ 64px   │ Compass   │  ║
║   │  └──────────────────────┘        │  │  └────────┘ Size L    │  ║
║   │                                  │  │             Qty 1     │  ║
║   │  [  ] Subscribe for new drops    │  │             799 EGP   │  ║
║   │  (opt-in, unchecked default)     │  │                        │  ║
║   │                                  │  │  ────────────────────  │  ║
║   │  ──────────────────────────────  │  │                        │  ║
║   │                                  │  │  Subtotal    1,598 EGP│  ║
║   │  H2: "Shipping Address"         │  │  Shipping        — EGP│  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────────────────┐        │  │  ────────────────────  │  ║
║   │  │ Full Name *          │        │  │                        │  ║
║   │  │ [________________]   │        │  │  Total       1,598 EGP│  ║
║   │  └──────────────────────┘        │  │  + shipping            │  ║
║   │                                  │  │  SG 600 / 22px        │  ║
║   │  ┌──────────────────────┐        │  │                        │  ║
║   │  │ Address Line 1 *     │        │  │                        │  ║
║   │  │ [________________]   │        │  │  ┌──────────────────┐  │  ║
║   │  └──────────────────────┘        │  │  │ Free Exchange    │  │  ║
║   │                                  │  │  │ within 14 days   │  │  ║
║   │  ┌──────────────────────┐        │  │  │ Caption / Clay   │  │  ║
║   │  │ Address Line 2       │        │  │  └──────────────────┘  │  ║
║   │  │ [________________]   │        │  │                        │  ║
║   │  └──────────────────────┘        │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────┐ ┌──────────┐       │  │                        │  ║
║   │  │ City *   │ │ Area/    │       │  │                        │  ║
║   │  │ [_____]  │ │ District │       │  │                        │  ║
║   │  └──────────┘ │ [_____]  │       │  │                        │  ║
║   │               └──────────┘       │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  [  ] Guest checkout (no account │  │                        │  ║
║   │       needed)                    │  │                        │  ║
║   │  Caption / Clay Earth            │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │  Continue to Shipping    │    │  │                        │  ║
║   │  │  Ember bg / Obsidian txt │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │                                  │  │                        │  ║
║   └──────────────────────────────────┘  └────────────────────────┘  ║
║                                                                      ║
║   FORM RULES:                                                        ║
║   - No glassmorphism on form fields (max clarity)                    ║
║   - Labels ALWAYS visible above fields (never placeholder-only)      ║
║   - Clean White bg for all input fields                              ║
║   - Single column form on mobile, 48px field heights                 ║
║   - Guest checkout available (no forced registration)                ║
║   - Required fields marked with *                                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 2: Shipping

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ┌──────────────────────────────────┐  ┌────────────────────────┐  ║
║   │                                  │  │  ORDER SUMMARY         │  ║
║   │  SHIPPING SUMMARY                │  │  (with product images) │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │ Ahmed Mohamed            │    │  │  (same as Step 1)      │  ║
║   │  │ 25 El-Tahrir St, Dokki  │    │  │                        │  ║
║   │  │ Cairo                    │    │  │  NOW SHOWS:            │  ║
║   │  │ [Edit]  Deep Teal link  │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │  Subtotal    1,598 EGP│  ║
║   │                                  │  │  Shipping       60 EGP│  ║
║   │  H2: "Shipping Method"          │  │  ────────────────────  │  ║
║   │                                  │  │  Total       1,658 EGP│  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │ ◉ Standard Delivery      │    │  │                        │  ║
║   │  │   3-5 business days      │    │  │                        │  ║
║   │  │   60 EGP                 │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │ ○ Express Delivery       │    │  │                        │  ║
║   │  │   1-2 business days      │    │  │                        │  ║
║   │  │   120 EGP                │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  Expected delivery:              │  │                        │  ║
║   │  "March 25 – March 27"          │  │                        │  ║
║   │  Body / Obsidian                  │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  Shipping cost now reflected     │  │                        │  ║
║   │  in order summary →              │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │  Continue to Payment     │    │  │                        │  ║
║   │  │  Ember bg / Obsidian txt │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  [← Back to Information]        │  │                        │  ║
║   │  text link / Deep Teal          │  │                        │  ║
║   │                                  │  │                        │  ║
║   └──────────────────────────────────┘  └────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### Step 3: Payment

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ┌──────────────────────────────────┐  ┌────────────────────────┐  ║
║   │                                  │  │  ORDER SUMMARY         │  ║
║   │  SHIPPING SUMMARY (collapsed)    │  │  (with product images) │  ║
║   │  Ahmed Mohamed, Dokki, Cairo     │  │                        │  ║
║   │  Standard (3-5 days) [Edit]      │  │  (same sidebar)        │  ║
║   │                                  │  │                        │  ║
║   │  ──────────────────────────────  │  │  Subtotal    1,598 EGP│  ║
║   │                                  │  │  Shipping       60 EGP│  ║
║   │  H2: "Payment Method"           │  │  ────────────────────  │  ║
║   │                                  │  │  Total       1,658 EGP│  ║
║   │  ┌──────────────────────────┐    │  │  SG 600 / 22px        │  ║
║   │  │ ◉ Cash on Delivery (COD)│    │  │                        │  ║
║   │  │                          │    │  │  ┌──────────────────┐  │  ║
║   │  │  Pay when your order     │    │  │  │ Free Exchange    │  │  ║
║   │  │  arrives at your door.   │    │  │  │ within 14 days   │  │  ║
║   │  │                          │    │  │  │ if size doesn't  │  │  ║
║   │  │  Total: 1,658 EGP       │    │  │  │ fit              │  │  ║
║   │  │                          │    │  │  └──────────────────┘  │  ║
║   │  └──────────────────────────┘    │  │  Exchange policy link  │  ║
║   │                                  │  │  Deep Teal              │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │ ○ Pay with Card          │    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  │  ┌──────────────────┐    │    │  │                        │  ║
║   │  │  │ Save 30 EGP with │    │    │  │                        │  ║
║   │  │  │ card payment     │    │    │  │                        │  ║
║   │  │  │ Kohl Gold Dark   │    │    │  │                        │  ║
║   │  │  │ #896832 text     │    │    │  │                        │  ║
║   │  │  └──────────────────┘    │    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  │  (Card fields appear     │    │  │                        │  ║
║   │  │   when selected:         │    │  │                        │  ║
║   │  │   Card Number            │    │  │                        │  ║
║   │  │   Expiry / CVV           │    │  │                        │  ║
║   │  │   Name on Card)          │    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  ──────────────────────────────  │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  "بياناتك آمنة معنا"            │  │                        │  ║
║   │  ("Your data is safe with us")   │  │                        │  ║
║   │  Arabic trust copy               │  │                        │  ║
║   │  Caption / 14px / Clay Earth     │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  ┌──────────────────────────┐    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  │  Place Order — 1,658 EGP │    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  │  Ember bg / Obsidian txt │    │  │                        │  ║
║   │  │  full-width              │    │  │                        │  ║
║   │  │                          │    │  │                        │  ║
║   │  └──────────────────────────┘    │  │                        │  ║
║   │                                  │  │                        │  ║
║   │  [← Back to Shipping]           │  │                        │  ║
║   │  Deep Teal link                  │  │                        │  ║
║   │                                  │  │                        │  ║
║   └──────────────────────────────────┘  └────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│ FOOTER (minimal — no distracting nav links)                          │
│  [HORO]     © 2026 HORO Egypt     Exchange Policy     Privacy       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Wireframe (375px)

```
┌─────────────────────────┐
│ NAV (simplified)        │
│ [HORO]   [← Back]      │
└─────────────────────────┘

╔═════════════════════════╗
║ PROGRESS INDICATOR      ║
║                         ║
║   ●────○────○           ║
║   1    2    3           ║
║   Info Ship  Pay        ║
║                         ║
╚═════════════════════════╝

=== STEP 1: INFORMATION ===

╔═════════════════════════╗
║ ORDER PREVIEW           ║
║ (collapsible on mobile) ║
║                         ║
║ [▾ Order (2 items)]     ║
║                         ║
║ ┌──────┐ The Weight...  ║
║ │[img] │ Size M / 799   ║
║ └──────┘                ║
║ ┌──────┐ Midnight...    ║
║ │[img] │ Size L / 799   ║
║ └──────┘                ║
║                         ║
║ Total: 1,598 EGP       ║
║ + shipping              ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ CONTACT                 ║
║                         ║
║ Email *                 ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │ h:48px              │ ║
║ └─────────────────────┘ ║
║                         ║
║ Phone *                 ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SHIPPING ADDRESS        ║
║ (single column)         ║
║                         ║
║ Full Name *             ║
║ [___________________]   ║
║                         ║
║ Address Line 1 *        ║
║ [___________________]   ║
║                         ║
║ Address Line 2          ║
║ [___________________]   ║
║                         ║
║ City *                  ║
║ [___________________]   ║
║                         ║
║ Area / District         ║
║ [___________________]   ║
║                         ║
║ All fields: 48px height ║
║ Labels above fields     ║
║ No placeholder-only     ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Continue to Shipping│ ║
║ │ Ember / Obsidian    │ ║
║ │ h:48px              │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

=== STEP 3: PAYMENT ===

╔═════════════════════════╗
║ PAYMENT METHOD          ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ ◉ Cash on Delivery  │ ║
║ │   (COD)             │ ║
║ │                     │ ║
║ │   Pay when it       │ ║
║ │   arrives.          │ ║
║ │   Total: 1,658 EGP  │ ║
║ └─────────────────────┘ ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ ○ Pay with Card     │ ║
║ │                     │ ║
║ │ ┌─────────────────┐ │ ║
║ │ │Save 30 EGP with │ │ ║
║ │ │card payment     │ │ ║
║ │ │Kohl Gold Dark   │ │ ║
║ │ └─────────────────┘ │ ║
║ │                     │ ║
║ │ (Card fields when   │ ║
║ │  selected)          │ ║
║ └─────────────────────┘ ║
║                         ║
║ ────────────────────── ║
║                         ║
║ "بياناتك آمنة معنا"    ║
║ 13px / Clay Earth       ║
║                         ║
║ Free Exchange 14d       ║
║ [Exchange Policy →]     ║
║ Deep Teal link          ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Place Order —       │ ║
║ │ 1,658 EGP           │ ║
║ │ Ember / Obsidian    │ ║
║ │ h:48px              │ ║
║ └─────────────────────┘ ║
║                         ║
║ [← Back to Shipping]   ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER (minimal)        │
│ Exchange · Privacy      │
└─────────────────────────┘
```

---

## Component Annotations

### Progress Indicator
- **Desktop:** Horizontal stepper with labels: "Information" / "Shipping" / "Payment"
- **Mobile:** Compact dots + abbreviated labels: "Info" / "Ship" / "Pay"
- **Current step:** Ember `#E8593C` filled circle
- **Completed steps:** Obsidian `#1A1A1A` filled circle + solid connecting line
- **Upcoming:** Stone `#D4CFC5` hollow circle + dashed/light connecting line

### Order Summary Sidebar (Desktop)
- **Persistent** across all 3 steps — always visible in right column (40% width)
- **Contains:** Product images (64px square) + name + size + qty + price for each item
- **Shows:** Subtotal, shipping (updates at Step 2), total
- **Exchange policy:** Visible on payment screen (Section 8.4)

### Order Preview (Mobile)
- **Collapsible** — defaults to collapsed showing item count + total, expands to show images
- **Purpose:** Visual reassurance without taking full viewport

### Form Fields
- **Background:** Clean White `#FFFFFF` — NO glassmorphism on form fields (Section 8.4)
- **Height:** 48px minimum on mobile (touch target)
- **Labels:** Always visible above fields, never placeholder-only (Section 9.1)
- **Required indicator:** Asterisk (*) after label text
- **Error state:** Ember `#E8593C` border + error message below field in Ember text

### Payment Options
- **COD is default** (pre-selected) — 98.4% of Egyptian online purchasers prefer cash (Section 8.4)
- **Prepaid incentive:** "Save 30 EGP with card" — nudges card without blocking COD
- **Card fields:** Appear below when card option is selected (Number, Expiry/CVV, Name)
- **Arabic trust copy:** "بياناتك آمنة معنا" visible near payment fields (Section 8.4)

### Trust Signals on Payment Screen
- Exchange policy link visible (not hidden)
- "Free Exchange within 14 days if size doesn't fit"
- Arabic data safety message
- Order summary with product images at every step

### Navigation
- **Simplified nav:** Logo + "Back to Cart" only (no search, no categories)
- **Back links:** Each step has "← Back to [Previous Step]" in Deep Teal
- **Footer:** Minimal — only essential policy links

---

## Non-Negotiable Checkout Rules (Section 8.4)

| Rule | Implementation |
|------|---------------|
| Guest checkout available | No forced registration — checkbox, not gate |
| Shipping cost visible before checkout | Shown in cart + updated at Step 2 |
| Progress indicator (Step 1 of 3) | Horizontal stepper, always visible |
| COD as default payment option | Pre-selected radio button |
| Prepaid incentive: "Save 30 EGP with card" | Badge within card option, Kohl Gold Dark text |
| WhatsApp order confirmation | Triggered post-order (see confirmation page) |
| Order summary with product image at every step | Persistent sidebar desktop, collapsible mobile |
| Exchange policy visible on payment screen | Link + summary text on Step 3 |
| Mobile: single column, 48px touch targets | All fields and buttons meet minimum |
| No glassmorphism on form fields | Clean White bg, solid borders |
| "Your data is safe" in Arabic near payment | "بياناتك آمنة معنا" — Caption / Clay Earth |
