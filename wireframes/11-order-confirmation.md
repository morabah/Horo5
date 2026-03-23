# 11 — Order Confirmation

**Route:** `/checkout/success` | **Purpose:** Pure resolution — affirm the purchase, provide tracking, invite community participation  
**Source:** Brand Guidelines v2.3, Section 5.2 + Section 8.6 + Section 4.3 (Stage 5: Ownership)

---

## Three-Part Screen Structure

| Part           | What Happens                                          |
|----------------|-------------------------------------------------------|
| Setup          | "You completed this design" — ownership moment        |
| Confrontation  | (No tension — pure resolution)                        |
| Resolution     | Track order + "Tag us in your first wear"             |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (standard, full navigation restored)                        │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (0)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   SUCCESS HERO (Mint Frost glass bg #E6F5EF @ 15% on Papyrus)      ║
║                                                                      ║
║                                                                      ║
║                    ┌─────┐                                           ║
║                    │  ✓  │  checkmark icon                          ║
║                    │     │  40px, Nile Dark #3A4A3F                  ║
║                    └─────┘                                           ║
║                                                                      ║
║             H1: "You completed this design"                          ║
║             Space Grotesk 600 / 32px / Obsidian                      ║
║                                                                      ║
║             "Order #HORO-2026-0847 confirmed."                       ║
║             Inter 400 / 17px / Warm Charcoal #2C2A26                ║
║                                                                      ║
║             "A WhatsApp confirmation is on its way."                 ║
║             Inter 400 / 17px / Clay Earth #816A4F                   ║
║                                                                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ORDER DETAILS (2-column: 60% summary / 40% next steps)            ║
║   Papyrus bg                                                         ║
║                                                                      ║
║   ┌──────────────────────────────────┐  ┌────────────────────────┐  ║
║   │                                  │  │                        │  ║
║   │  ORDER SUMMARY                   │  │  WHAT'S NEXT           │  ║
║   │                                  │  │                        │  ║
║   │  ┌────────┐                      │  │  ┌──────────────────┐  │  ║
║   │  │ [img]  │  The Weight of Light │  │  │                  │  │  ║
║   │  │ 80px   │  Size: M / Qty: 1   │  │  │  1. WhatsApp     │  │  ║
║   │  └────────┘  799 EGP             │  │  │  confirmation    │  │  ║
║   │              "Illustrated by     │  │  │  sent to your    │  │  ║
║   │               Nada Ibrahim"      │  │  │  phone           │  │  ║
║   │                                  │  │  │                  │  │  ║
║   │  ┌────────┐                      │  │  │  2. We prepare   │  │  ║
║   │  │ [img]  │  Midnight Compass    │  │  │  your order      │  │  ║
║   │  │ 80px   │  Size: L / Qty: 1   │  │  │  (1-2 days)      │  │  ║
║   │  └────────┘  799 EGP             │  │  │                  │  │  ║
║   │                                  │  │  │  3. Shipped with │  │  ║
║   │  ──────────────────────────────  │  │  │  tracking link   │  │  ║
║   │                                  │  │  │  via WhatsApp    │  │  ║
║   │  Subtotal           1,598 EGP    │  │  │                  │  │  ║
║   │  Shipping              60 EGP    │  │  │  4. Arrives at   │  │  ║
║   │  ──────────────────────────────  │  │  │  your door       │  │  ║
║   │  Total              1,658 EGP    │  │  │  (March 25-27)   │  │  ║
║   │  SG 600 / 22px / Obsidian        │  │  │                  │  │  ║
║   │                                  │  │  └──────────────────┘  │  ║
║   │  ──────────────────────────────  │  │                        │  ║
║   │                                  │  │  Body / 17px           │  ║
║   │  Payment: Cash on Delivery       │  │  Warm Charcoal         │  ║
║   │  Delivery: Standard (3-5 days)   │  │                        │  ║
║   │  Address: 25 El-Tahrir St,       │  │  ┌──────────────────┐  │  ║
║   │           Dokki, Cairo           │  │  │  Track Order     │  │  ║
║   │                                  │  │  │  Ember bg        │  │  ║
║   │  Caption / Clay Earth            │  │  │  Obsidian text   │  │  ║
║   │                                  │  │  └──────────────────┘  │  ║
║   │                                  │  │                        │  ║
║   └──────────────────────────────────┘  └────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   COMMUNITY INVITE (Warm Glow glass #FFF5E6 @ 25%, blur 16px)      ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │                                                              │  ║
║   │                  "Tag us in your first wear"                 │  ║
║   │                  H2 / 22px / Obsidian                        │  ║
║   │                                                              │  ║
║   │        "Snap a photo, tag @horoegypt on Instagram,           │  ║
║   │         and become part of the story."                       │  ║
║   │        Body / 17px / Warm Charcoal                           │  ║
║   │                                                              │  ║
║   │              ┌────────────────────────┐                      │  ║
║   │              │  Follow @horoegypt →   │                      │  ║
║   │              │  Ghost btn             │                      │  ║
║   │              │  Stone border          │                      │  ║
║   │              └────────────────────────┘                      │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   CONTINUE BROWSING (Papyrus bg)                                     ║
║                                                                      ║
║   "Keep exploring"                                                   ║
║   H3 / 17px / Obsidian                                               ║
║                                                                      ║
║   ┌──────────────────┐ ┌──────────────────┐                         ║
║   │                  │ │                  │                         ║
║   │  [Shop by Vibe]  │ │  [New Arrivals]  │                         ║
║   │  Ghost btn       │ │  Ghost btn       │                         ║
║   │                  │ │                  │                         ║
║   └──────────────────┘ └──────────────────┘                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│ FOOTER                                                               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Wireframe (375px)

```
┌─────────────────────────┐
│ NAV (glass, sticky)     │
│ [≡] [HORO]  [🔍][Cart] │
└─────────────────────────┘

╔═════════════════════════╗
║ SUCCESS HERO            ║
║ (Mint Frost glass)      ║
║                         ║
║         ┌───┐           ║
║         │ ✓ │           ║
║         └───┘           ║
║                         ║
║  "You completed         ║
║   this design"          ║
║  26px / Obsidian        ║
║  (centered)             ║
║                         ║
║  "Order #HORO-2026-0847 ║
║   confirmed."           ║
║  16px / Warm Charcoal   ║
║                         ║
║  "WhatsApp confirmation ║
║   is on its way."       ║
║  16px / Clay Earth      ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ ORDER SUMMARY           ║
║                         ║
║ ┌──────┐ The Weight     ║
║ │[img] │ of Light       ║
║ │ 64px │ Size M / Qty 1 ║
║ └──────┘ 799 EGP        ║
║                         ║
║ ┌──────┐ Midnight       ║
║ │[img] │ Compass        ║
║ │ 64px │ Size L / Qty 1 ║
║ └──────┘ 799 EGP        ║
║                         ║
║ ────────────────────── ║
║ Subtotal     1,598 EGP  ║
║ Shipping        60 EGP  ║
║ ────────────────────── ║
║ Total        1,658 EGP  ║
║ 19px / Obsidian         ║
║                         ║
║ Payment: COD            ║
║ Delivery: Standard      ║
║ Address: Dokki, Cairo   ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ WHAT'S NEXT             ║
║                         ║
║ 1. WhatsApp confirm     ║
║    sent to your phone   ║
║                         ║
║ 2. We prepare your      ║
║    order (1-2 days)     ║
║                         ║
║ 3. Tracking link via    ║
║    WhatsApp             ║
║                         ║
║ 4. Arrives at your door ║
║    (March 25-27)        ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Track Order         │ ║
║ │ Ember / Obsidian    │ ║
║ │ h:48px              │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ COMMUNITY INVITE        ║
║ (Warm Glow glass)       ║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │ "Tag us in your     │ ║
║ │  first wear"        │ ║
║ │ 19px / Obsidian     │ ║
║ │                     │ ║
║ │ "Snap a photo, tag  │ ║
║ │  @horoegypt on      │ ║
║ │  Instagram."        │ ║
║ │ 16px / W. Charcoal  │ ║
║ │                     │ ║
║ │ ┌───────────────┐   │ ║
║ │ │Follow         │   │ ║
║ │ │@horoegypt →   │   │ ║
║ │ │h:48px / Ghost │   │ ║
║ │ └───────────────┘   │ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ CONTINUE BROWSING       ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Shop by Vibe        │ ║
║ │ h:48px / Ghost      │ ║
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ New Arrivals        │ ║
║ │ h:48px / Ghost      │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER                  │
└─────────────────────────┘
```

---

## Component Annotations

### Success Hero
- **Background:** Mint Frost glass `#E6F5EF` @ 15% on Papyrus — success state color
- **Checkmark icon:** 40px, Nile Dark `#3A4A3F`, simple outlined circle + check
- **Headline:** "You completed this design" — ties to brand narrative (the wearer completes the art)
- **Order number:** Visible, formatted as HORO-YYYY-XXXX
- **WhatsApp mention:** Reduces COD cancellation by making order feel real (Section 8.4)

### Order Summary
- **Same format as checkout** — continuity with product images
- **Shows:** All items with images, subtotal, shipping, total, payment method, delivery method, address
- **Not editable** — confirmation only

### What's Next Timeline
- **4 steps:** WhatsApp confirmation → order preparation → shipping with tracking → delivery
- **Expected delivery date:** Specific date range based on shipping method
- **Track Order CTA:** Primary button (Ember bg, Obsidian text)

### Community Invite
- **Surface:** Warm Glow glass `#FFF5E6` @ 25%, blur 16px, border-radius 16px
- **Headline:** "Tag us in your first wear"
- **Body:** Invitation to share on Instagram, tag @horoegypt
- **CTA:** "Follow @horoegypt →" — Ghost button (not primary, this is post-purchase)
- **Maps to:** Customer Journey Stage 5 (Ownership) — "Where'd you get that?" moment

### Continue Browsing
- Soft secondary CTAs to keep the customer in the ecosystem
- Ghost buttons: "Shop by Vibe" and "New Arrivals"
- Low-key, not pushy

---

## Key Brand Rules

> "You completed this design" — confirmation narrative: pure resolution, no tension. — Section 5.2

> Customer Journey Stage 5 (Ownership): Pride. Gets asked "Where'd you get that?" Content role: "Tag us in your first wear." — Section 4.3

> WhatsApp order confirmation: Reduces COD cancellation by making order feel real. — Section 8.4

> Post-purchase trust signals: Tracking link / "Tag us in your first wear" / WhatsApp delivery updates. — Section 8.6
