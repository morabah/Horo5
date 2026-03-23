# 09 — Cart

**Route:** `/cart` | **Purpose:** Review selections, confirm totals, and proceed to checkout — with one strategic upsell  
**Source:** Brand Guidelines v2.3, Section 5.2 + Section 8.5

---

## Three-Part Screen Structure

| Part           | What Happens                                      |
|----------------|---------------------------------------------------|
| Setup          | "You chose well" — affirm the selection           |
| Confrontation  | Is the total right? Sizes correct?                |
| Resolution     | Proceed to Checkout                               |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass)                                             │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   PAGE HEADER (Papyrus #F5F0E8 bg)                                   ║
║                                                                      ║
║   H1: "Your Cart"                                                    ║
║   Space Grotesk 600 / 32px / Obsidian #1A1A1A                       ║
║                                                                      ║
║   "2 items"                                                          ║
║   Caption / 14px / Clay Earth #816A4F                                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   MAIN CART AREA (2-column: 65% items / 35% summary)                 ║
║   Papyrus bg                                                         ║
║                                                                      ║
║   ┌──────────────────────────────────┐  ┌────────────────────────┐  ║
║   │                                  │  │                        │  ║
║   │  CART ITEMS                      │  │  ORDER SUMMARY         │  ║
║   │                                  │  │  (sticky on scroll)    │  ║
║   │  ┌─────────────────────────────┐ │  │                        │  ║
║   │  │                             │ │  │  ────────────────────  │  ║
║   │  │  ┌────────┐                 │ │  │                        │  ║
║   │  │  │        │  Design Name    │ │  │  Subtotal    1,598 EGP│  ║
║   │  │  │ [img]  │  "The Weight    │ │  │  Shipping      TBD    │  ║
║   │  │  │ 100px  │   of Light"     │ │  │  (calculated at       │  ║
║   │  │  │ square │  SG 500/17px    │ │  │   checkout)           │  ║
║   │  │  │        │  Obsidian       │ │  │  Caption / Clay Earth │  ║
║   │  │  └────────┘                 │ │  │                        │  ║
║   │  │             "Illustrated by │ │  │  ────────────────────  │  ║
║   │  │              Nada Ibrahim"  │ │  │                        │  ║
║   │  │             Caption / Clay  │ │  │  Total       1,598 EGP│  ║
║   │  │                             │ │  │  SG 600 / 22px        │  ║
║   │  │             Size: M         │ │  │  Obsidian              │  ║
║   │  │             Body / Obsidian │ │  │                        │  ║
║   │  │                             │ │  │  ┌──────────────────┐  │  ║
║   │  │             ┌──┐            │ │  │  │                  │  │  ║
║   │  │  Qty:  [-]  │1 │  [+]      │ │  │  │  Proceed to      │  │  ║
║   │  │             └──┘            │ │  │  │  Checkout         │  │  ║
║   │  │                             │ │  │  │                  │  │  ║
║   │  │             799 EGP         │ │  │  │  Ember bg        │  │  ║
║   │  │             SG 600 / 17px   │ │  │  │  Obsidian text   │  │  ║
║   │  │                             │ │  │  │  full-width      │  │  ║
║   │  │  [Remove]                   │ │  │  │                  │  │  ║
║   │  │  text link / Deep Teal      │ │  │  └──────────────────┘  │  ║
║   │  │                             │ │  │                        │  ║
║   │  └─────────────────────────────┘ │  │  [Continue Shopping]   │  ║
║   │                                  │  │  Ghost btn             │  ║
║   │  ────────── Stone divider ─────  │  │  Stone border          │  ║
║   │                                  │  │  Obsidian text         │  ║
║   │  ┌─────────────────────────────┐ │  │                        │  ║
║   │  │                             │ │  │  ────────────────────  │  ║
║   │  │  ┌────────┐                 │ │  │                        │  ║
║   │  │  │        │  Design Name    │ │  │  TRUST SIGNALS         │  ║
║   │  │  │ [img]  │  "Midnight      │ │  │                        │  ║
║   │  │  │ 100px  │   Compass"      │ │  │  Free Exchange 14d    │  ║
║   │  │  │        │                 │ │  │  COD Available         │  ║
║   │  │  └────────┘  Size: L        │ │  │  220 GSM Cotton       │  ║
║   │  │                             │ │  │                        │  ║
║   │  │              Qty: 1         │ │  │  Caption / Clay Earth  │  ║
║   │  │              799 EGP        │ │  │                        │  ║
║   │  │                             │ │  │                        │  ║
║   │  │  [Remove]                   │ │  │                        │  ║
║   │  │                             │ │  │                        │  ║
║   │  └─────────────────────────────┘ │  │                        │  ║
║   │                                  │  │                        │  ║
║   └──────────────────────────────────┘  └────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   UPSELL MODULE (ONE ONLY — rule from Section 8.5)                   ║
║                                                                      ║
║   === IF CART HAS 1 TEE → GIFT BUNDLE UPGRADE ===                   ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │  Warm Glow glass (#FFF5E6 @ 25%, blur 16px, r:16px)         │  ║
║   │                                                              │  ║
║   │  ┌──────────┐  "Make it a gift"                              │  ║
║   │  │ [Gift    │  H3 / 17px / Obsidian                         │  ║
║   │  │  wrap +  │                                                │  ║
║   │  │  card    │  "Add a story card + gift wrap for +200 EGP"  │  ║
║   │  │  preview]│  Body / 17px / Warm Charcoal                  │  ║
║   │  └──────────┘                                                │  ║
║   │                                                              │  ║
║   │  ┌────────────────────────┐   ┌────────────────┐            │  ║
║   │  │  Add Gift Wrap +200   │   │  No thanks     │            │  ║
║   │  │  Ember bg / Obsidian  │   │  Ghost btn     │            │  ║
║   │  └────────────────────────┘   └────────────────┘            │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   === IF CART HAS 2+ TEES → BUNDLE DISCOUNT ===                     ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │  Warm Glow glass (#FFF5E6 @ 25%, blur 16px, r:16px)         │  ║
║   │                                                              │  ║
║   │  "Add a 3rd, save 100 EGP"                                  │  ║
║   │  H3 / 17px / Obsidian                                       │  ║
║   │                                                              │  ║
║   │  "Pick one more design and get 100 EGP off your order."     │  ║
║   │  Body / 17px / Warm Charcoal                                │  ║
║   │                                                              │  ║
║   │  ┌────────────────────────────┐                              │  ║
║   │  │  Browse Designs →         │                              │  ║
║   │  │  Ghost btn / Stone border │                              │  ║
║   │  └────────────────────────────┘                              │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   NEVER both. Only one upsell module appears.                        ║
║   NEVER "You might also like" grids competing with checkout CTA.     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   EMPTY CART STATE (shown when cart has 0 items)                     ║
║                                                                      ║
║              "Your cart is empty"                                    ║
║              H2 / 22px / Obsidian                                   ║
║                                                                      ║
║              "Find something that says what                         ║
║               you're thinking."                                     ║
║              Body / 17px / Warm Charcoal                            ║
║                                                                      ║
║              ┌────────────────────────┐                             ║
║              │  Find Your Design      │                             ║
║              │  → /vibes              │                             ║
║              │  Ember bg / Obsidian   │                             ║
║              └────────────────────────┘                             ║
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
║ PAGE HEADER             ║
║                         ║
║ H1: "Your Cart"         ║
║ 26px / Obsidian         ║
║ "2 items"               ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ CART ITEMS              ║
║ (single column)         ║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │ ┌──────┐ Name       │ ║
║ │ │[img] │ "The Weight│ ║
║ │ │ 80px │  of Light" │ ║
║ │ └──────┘ 16px       │ ║
║ │                     │ ║
║ │ "Illustrated by     │ ║
║ │  Nada Ibrahim"      │ ║
║ │ 13px / Clay Earth   │ ║
║ │                     │ ║
║ │ Size: M             │ ║
║ │                     │ ║
║ │ ┌──┐                │ ║
║ │ [-] 1 [+]  799 EGP  │ ║
║ │ └──┘                │ ║
║ │        48px targets  │ ║
║ │                     │ ║
║ │ [Remove]            │ ║
║ │ Deep Teal link      │ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
║ ──── Stone divider ──── ║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │ ┌──────┐ "Midnight  │ ║
║ │ │[img] │  Compass"  │ ║
║ │ └──────┘            │ ║
║ │ Size: L   799 EGP   │ ║
║ │ [-] 1 [+]          │ ║
║ │ [Remove]            │ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ UPSELL (one only)       ║
║ (Warm Glow glass)       ║
║                         ║
║ === 1 tee: ===          ║
║ ┌─────────────────────┐ ║
║ │ "Make it a gift"    │ ║
║ │                     │ ║
║ │ Story card + wrap   │ ║
║ │ +200 EGP            │ ║
║ │                     │ ║
║ │ ┌───────────────┐   │ ║
║ │ │Add Gift Wrap  │   │ ║
║ │ │+200  h:48px   │   │ ║
║ │ └───────────────┘   │ ║
║ │ [No thanks]         │ ║
║ └─────────────────────┘ ║
║                         ║
║ === OR 2+ tees: ===     ║
║ ┌─────────────────────┐ ║
║ │ "Add a 3rd,         │ ║
║ │  save 100 EGP"      │ ║
║ │                     │ ║
║ │ ┌───────────────┐   │ ║
║ │ │Browse Designs │   │ ║
║ │ │h:48px / Ghost │   │ ║
║ │ └───────────────┘   │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ ORDER SUMMARY           ║
║                         ║
║ Subtotal     1,598 EGP  ║
║ Shipping       TBD      ║
║ ────────────────────── ║
║ Total        1,598 EGP  ║
║ 19px / Obsidian         ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Proceed to Checkout │ ║
║ │ Ember bg / Obsidian │ ║
║ │ h:48px              │ ║
║ └─────────────────────┘ ║
║                         ║
║ [Continue Shopping]     ║
║ Ghost btn / h:48px      ║
║                         ║
║ ────────────────────── ║
║                         ║
║ Free Exchange 14d       ║
║ COD Available           ║
║ 220 GSM Cotton          ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER                  │
└─────────────────────────┘
```

---

## Component Annotations

### Cart Line Item
- **Image:** 100px square (desktop), 80px (mobile), links to PDP
- **Design name:** Space Grotesk 500 / 17px desktop, 16px mobile / Obsidian — links to PDP
- **Artist credit:** Caption / 14px / Clay Earth `#816A4F`
- **Size:** Body text / Obsidian
- **Quantity:** Stepper control with [-] and [+] buttons, min 48px touch targets on mobile
- **Price:** Space Grotesk 600 / 17px / Obsidian (per-item price, updates with quantity)
- **Remove:** Text link / Deep Teal `#2B7596`
- **Divider:** 1px Stone `#D4CFC5` between items

### Order Summary (Desktop Sidebar)
- **Position:** Sticky on scroll, right column (35% width)
- **Subtotal:** Sum of all items
- **Shipping:** "Calculated at checkout" or estimated amount — visible before checkout (Section 8.4)
- **Total:** Space Grotesk 600 / 22px / Obsidian
- **Primary CTA:** "Proceed to Checkout" — Ember `#E8593C` bg, Obsidian text, full-width
- **Secondary CTA:** "Continue Shopping" — Ghost button, Stone border, Obsidian text

### Upsell Rules (Section 8.5)

| Cart State | Upsell Shown                          | CTA                       |
|------------|---------------------------------------|---------------------------|
| 1 tee      | Gift bundle upgrade (+200 EGP)        | "Add Gift Wrap +200"      |
| 2+ tees    | Bundle discount ("Add a 3rd, save 100")| "Browse Designs →"        |

- **Surface:** Warm Glow glass `#FFF5E6` @ 25%, blur 16px, border-radius 16px
- **Only ONE upsell module ever appears** — never both, never "You might also like"
- **Gift wrap upsell:** Shows preview image of gift packaging (story card + wrap)
- **Bundle discount:** Links back to collection to add another design

### Trust Signals
- Listed below order summary on both desktop and mobile
- Free Exchange 14d / COD Available / 220 GSM Cotton
- Caption / Clay Earth `#816A4F`

### Empty Cart State
- Centered message with emotional copy ("Find something that says what you're thinking")
- Single CTA: **“Find Your Design”** → `/vibes` — primary button (align with homepage / invite)

---

## Key Brand Rules

> Cart with 1 tee: offer gift bundle upgrade (+200 EGP for story card + gift wrap). — Section 8.5

> Cart with 2+ tees: offer bundle discount ("Add a 3rd, save 100 EGP"). — Section 8.5

> Never show more than one upsell module on the cart page. No "You might also like" grids competing with checkout CTA. — Section 8.5

> Shipping cost visible before checkout — surprise costs are the #1 abandonment driver. — Section 8.4

> Setup: "You chose well" / Confrontation: "Is the total right?" / Resolution: Proceed to Checkout. — Section 5.2
