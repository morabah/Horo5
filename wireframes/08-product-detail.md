# 08 — Product Detail Page (PDP)

**Route:** `/products/[slug]` | **Purpose:** Where trust is built — the design story, quality proof, and purchase decision happen here  
**Source:** Brand Guidelines v2.3, Section 8.3 + Section 5.2 + Section 8.6

---

## Three-Part Screen Structure

| Part           | What Happens                                      |
|----------------|---------------------------------------------------|
| Setup          | "For the one who..." — recognition moment         |
| Confrontation  | Can I trust this? Size, quality, artist, returns  |
| Resolution     | Select size → Add to Cart                         |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass)                                             │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   Breadcrumb: Home > Fictious > The Weight of Light                  ║
║   Caption / 14px / Clay Earth #816A4F                                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   MAIN PRODUCT AREA (2-column layout: 55% images / 45% info)        ║
║   Papyrus #F5F0E8 bg                                                 ║
║                                                                      ║
║   ┌─────────────────────────┐   ┌──────────────────────────────┐   ║
║   │                         │   │                              │   ║
║   │   IMAGE GALLERY         │   │  PRODUCT INFO                │   ║
║   │                         │   │                              │   ║
║   │   ┌───────────────────┐ │   │  LABEL: "FICTIOUS"         │   ║
║   │   │                   │ │   │  12px / uppercase            │   ║
║   │   │                   │ │   │  Label Brown #876749         │   ║
║   │   │   [MAIN IMAGE]    │ │   │                              │   ║
║   │   │                   │ │   │  H1: "The Weight of Light"  │   ║
║   │   │   Current: flat   │ │   │  Space Grotesk 600 / 32px   │   ║
║   │   │   lay on warm     │ │   │  Obsidian #1A1A1A           │   ║
║   │   │   textured surface│ │   │                              │   ║
║   │   │                   │ │   │  ┌────┐                      │   ║
║   │   │   (zoomable on    │ │   │  │ 🎨 │ "Illustrated by     │   ║
║   │   │    click)         │ │   │  │    │  Nada Ibrahim"      │   ║
║   │   │                   │ │   │  └────┘  avatar 32px        │   ║
║   │   │                   │ │   │  Caption / Clay Earth        │   ║
║   │   └───────────────────┘ │   │  (links to artist profile)  │   ║
║   │                         │   │                              │   ║
║   │   Thumbnails (5 req'd): │   │  ┌────────────────────────┐  │   ║
║   │                         │   │  │                        │  │   ║
║   │   ┌────┐ ┌────┐ ┌────┐ │   │  │  DESIGN STORY CARD     │  │   ║
║   │   │flat│ │body│ │life│ │   │  │  (Soft Violet glass)   │  │   ║
║   │   │lay │ │shot│ │styl│ │   │  │  #EDE5F5 @ 20%        │  │   ║
║   │   └────┘ └────┘ └────┘ │   │  │  blur 16px, r:16px    │  │   ║
║   │   ┌────┐ ┌────┐        │   │  │                        │  │   ║
║   │   │clos│ │size│        │   │  │  "For the one who      │  │   ║
║   │   │e-up│ │ref │        │   │  │   carries the weight   │  │   ║
║   │   └────┘ └────┘        │   │  │   of every feeling     │  │   ║
║   │                         │   │  │   and still walks      │  │   ║
║   │   5 mandatory images:   │   │  │   toward the light."   │  │   ║
║   │   1. Flat lay           │   │  │                        │  │   ║
║   │   2. On-body            │   │  │  Inter 400 / 17px      │  │   ║
║   │   3. Lifestyle          │   │  │  Dusk Violet #6B4C8A   │  │   ║
║   │   4. Print close-up     │   │  │                        │  │   ║
║   │   5. Size reference     │   │  └────────────────────────┘  │   ║
║   │      (model with        │   │                              │   ║
║   │       measurements)     │   │  ─────────────────────────── │   ║
║   │                         │   │                              │   ║
║   └─────────────────────────┘   │  PRICE                       │   ║
║                                 │  H2: "799 EGP"              │   ║
║                                 │  Space Grotesk 600 / 22px    │   ║
║                                 │  Obsidian #1A1A1A            │   ║
║                                 │                              │   ║
║                                 │  SIZE SELECTOR               │   ║
║                                 │                              │   ║
║                                 │  LABEL: "SIZE"               │   ║
║                                 │  12px / Label Brown          │   ║
║                                 │                              │   ║
║                                 │  ┌────┐┌────┐┌────┐┌────┐   │   ║
║                                 │  │ S  ││ M  ││ L  ││ XL │   │   ║
║                                 │  │    ││████││    ││    │   │   ║
║                                 │  └────┘└────┘└────┘└────┘   │   ║
║                                 │  ┌────┐                      │   ║
║                                 │  │XXL │                      │   ║
║                                 │  │    │                      │   ║
║                                 │  └────┘                      │   ║
║                                 │                              │   ║
║                                 │  ████ = selected (Ember bg   │   ║
║                                 │         #E8593C, Obsidian    │   ║
║                                 │         text)                │   ║
║                                 │  ░░░░ = out of stock         │   ║
║                                 │         (struck-through,     │   ║
║                                 │          Stone border,       │   ║
║                                 │          Clay Earth text)    │   ║
║                                 │  Default = Stone border,     │   ║
║                                 │           Obsidian text      │   ║
║                                 │                              │   ║
║                                 │  [Size Guide]                │   ║
║                                 │  text link / Deep Teal       │   ║
║                                 │  (opens Frost Blue glass     │   ║
║                                 │   overlay modal)             │   ║
║                                 │                              │   ║
║                                 │  ┌──────────────────────┐    │   ║
║                                 │  │                      │    │   ║
║                                 │  │   Add to Cart        │    │   ║
║                                 │  │                      │    │   ║
║                                 │  │   Ember #E8593C bg   │    │   ║
║                                 │  │   Obsidian text      │    │   ║
║                                 │  │   full-width         │    │   ║
║                                 │  │                      │    │   ║
║                                 │  └──────────────────────┘    │   ║
║                                 │                              │   ║
║                                 │  TRUST STRIP (below CTA)     │   ║
║                                 │  ┌──────────────────────┐    │   ║
║                                 │  │ 220 GSM · Nada       │    │   ║
║                                 │  │ Ibrahim · Free       │    │   ║
║                                 │  │ Exchange 14d · COD   │    │   ║
║                                 │  └──────────────────────┘    │   ║
║                                 │  Caption / 14px / Clay Earth │   ║
║                                 │  dot-separated               │   ║
║                                 │                              │   ║
║                                 └──────────────────────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   PRODUCT DETAILS (Papyrus bg)                                       ║
║                                                                      ║
║   ┌──────────────────────┐  ┌──────────────────────────────────┐   ║
║   │                      │  │                                  │   ║
║   │  SPECS               │  │  DESIGN STORY                    │   ║
║   │                      │  │                                  │   ║
║   │  Fabric: 220 GSM     │  │  "This design was born from     │   ║
║   │  premium cotton      │  │   the idea that sensitivity     │   ║
║   │                      │  │   isn't weakness — it's the     │   ║
║   │  Print: DTG digital  │  │   thing that makes you notice   │   ║
║   │  direct-to-garment   │  │   what others miss."            │   ║
║   │                      │  │                                  │   ║
║   │  Fit: Relaxed unisex │  │  Inter 400 / 17px               │   ║
║   │                      │  │  Warm Charcoal                   │   ║
║   │  Care: Machine wash  │  │                                  │   ║
║   │  cold, hang dry      │  │                                  │   ║
║   │                      │  │                                  │   ║
║   │  Inter 400 / 17px    │  │                                  │   ║
║   │  Warm Charcoal       │  │                                  │   ║
║   │                      │  │                                  │   ║
║   └──────────────────────┘  └──────────────────────────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   SIZE GUIDE MODAL (triggered by "Size Guide" link)                  ║
║   Frost Blue glass #E3EFF5 @ 20%, blur 16px, border-radius 16px     ║
║                                                                      ║
║   ┌──────────────────────────────────────────┐                      ║
║   │  [✕ close]                               │                      ║
║   │                                          │                      ║
║   │  H3: "Size Guide"                        │                      ║
║   │  17px / Obsidian                          │                      ║
║   │                                          │                      ║
║   │  ┌──────┬────────┬────────┬────────┐     │                      ║
║   │  │ Size │ Chest  │ Length │ Sleeve │     │                      ║
║   │  ├──────┼────────┼────────┼────────┤     │                      ║
║   │  │ S    │ 96 cm  │ 70 cm │ 20 cm  │     │                      ║
║   │  │ M    │ 102 cm │ 72 cm │ 21 cm  │     │                      ║
║   │  │ L    │ 108 cm │ 74 cm │ 22 cm  │     │                      ║
║   │  │ XL   │ 114 cm │ 76 cm │ 23 cm  │     │                      ║
║   │  │ XXL  │ 120 cm │ 78 cm │ 24 cm  │     │                      ║
║   │  └──────┴────────┴────────┴────────┘     │                      ║
║   │                                          │                      ║
║   │  "Model is 178 cm, wearing size M"       │                      ║
║   │  Caption / Clay Earth                     │                      ║
║   │                                          │                      ║
║   └──────────────────────────────────────────┘                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   YOU MIGHT ALSO LIKE (Papyrus bg)                                   ║
║   (only same-vibe recommendations, max 4)                            ║
║                                                                      ║
║   "More from Fictious" (dynamic: `More from {vibe.name}`)            ║
║   H3 / 17px / Obsidian                                               ║
║                                                                      ║
║   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          ║
║   │ [img]    │  │ [img]    │  │ [img]    │  │ [img]    │          ║
║   │ Artist   │  │ Artist   │  │ Artist   │  │ Artist   │          ║
║   │ Name     │  │ Name     │  │ Name     │  │ Name     │          ║
║   │ 799 EGP  │  │ 799 EGP  │  │ 899 EGP  │  │ 799 EGP  │          ║
║   └──────────┘  └──────────┘  └──────────┘  └──────────┘          ║
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
║ IMAGE GALLERY           ║
║ (full-width swiper)     ║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │                     │ ║
║ │   [MAIN IMAGE]      │ ║
║ │   swipe left/right  │ ║
║ │   for 5 images      │ ║
║ │                     │ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
║   ● ○ ○ ○ ○            ║
║   (dot indicators,      ║
║    5 dots for 5 imgs)   ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ PRODUCT INFO            ║
║ (Papyrus bg)            ║
║                         ║
║ LABEL: "FICTIOUS"      ║
║ 12px / Label Brown      ║
║                         ║
║ H1: "The Weight         ║
║  of Light"              ║
║ 26px / Obsidian         ║
║                         ║
║ ┌────┐ "Illustrated by  ║
║ │ 🎨 │  Nada Ibrahim"   ║
║ └────┘ 13px / Clay Earth║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │ DESIGN STORY CARD   │ ║
║ │ (Soft Violet glass) │ ║
║ │                     │ ║
║ │ "For the one who    │ ║
║ │  carries the weight │ ║
║ │  of every feeling   │ ║
║ │  and still walks    │ ║
║ │  toward the light." │ ║
║ │                     │ ║
║ │ Dusk Violet #6B4C8A │ ║
║ │ 16px                │ ║
║ │                     │ ║
║ └─────────────────────┘ ║
║                         ║
║ ──────────────────────  ║
║                         ║
║ PRICE                   ║
║ H2: "799 EGP"          ║
║ 19px / Obsidian         ║
║                         ║
║ SIZE                    ║
║ 12px / Label Brown      ║
║                         ║
║ ┌────┐┌────┐┌────┐     ║
║ │ S  ││ M  ││ L  │     ║
║ │    ││████││    │     ║
║ └────┘└────┘└────┘     ║
║ ┌────┐┌────┐           ║
║ │ XL ││XXL │           ║
║ └────┘└────┘           ║
║                         ║
║ [Size Guide]            ║
║ Deep Teal link          ║
║                         ║
║ ──────────────────────  ║
║                         ║
║ SPECS (collapsible)     ║
║ [▾ Fabric & Fit]        ║
║   220 GSM cotton        ║
║   Relaxed unisex fit    ║
║   DTG print             ║
║   Machine wash cold     ║
║                         ║
║ [▾ Design Story]        ║
║   "This design was..."  ║
║                         ║
║ ──────────────────────  ║
║                         ║
║ TRUST STRIP             ║
║ 220 GSM · Nada Ibrahim  ║
║ · Free Exchange 14d     ║
║ · COD Available         ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ RECOMMENDATIONS         ║
║                         ║
║ "More from Fictious"     ║
║                         ║
║ (horizontal scroll)     ║
║ ┌──────────┐┌──────────┐║
║ │ [img]    ││ [img]    │──►
║ │ Name     ││ Name     │║
║ │ 799 EGP  ││ 799 EGP  │║
║ └──────────┘└──────────┘║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│                         │
│ MOBILE STICKY CTA BAR   │
│ (fixed bottom, always   │
│  visible while scrolling)│
│                         │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │  Add to Cart —      │ │
│ │  799 EGP            │ │
│ │                     │ │
│ │  Ember bg #E8593C   │ │
│ │  Obsidian text      │ │
│ │  h:48px min         │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘

┌─────────────────────────┐
│ FOOTER                  │
│ (above sticky CTA bar)  │
└─────────────────────────┘
```

---

## Component Annotations

### Image Gallery
- **5 mandatory images** (Section 8.3):
  1. Flat lay on warm textured surface (concrete, linen, raw wood — never pure white)
  2. On-body street shot (real Cairo location, natural light, model 20-30)
  3. Lifestyle context shot (candid expression)
  4. Print close-up macro (quality proof — texture visible)
  5. Size reference with model measurements ("Model is 178 cm, wearing size M")
- **Desktop:** Large main image with 5 thumbnails below, click to swap, click main to zoom
- **Mobile:** Full-width swipe gallery with dot indicators
- **Alt text format:** "HORO 'The Weight of Light' t-shirt, flat lay on linen" (Section 9.1)

### Design Story Card
- **Surface:** Soft Violet glass `#EDE5F5` @ 20%, blur 16px, border-radius 16px
- **Content:** "For the one who..." identity phrase
- **Text:** Inter 400 / 17px / Dusk Violet `#6B4C8A`
- **Purpose:** Recognition moment — customer sees themselves in the description

### Artist Credit
- **Always visible** (not collapsible)
- **Avatar:** 32px circular
- **Format:** "Illustrated by [Name]"
- **Caption:** Clay Earth `#816A4F`
- **Links to:** Artist profile page

### Size Selector
- **Options:** S / M / L / XL / XXL
- **Default state:** Stone `#D4CFC5` border, Obsidian text
- **Selected state:** Ember `#E8593C` background, Obsidian `#1A1A1A` text + border + background (not color alone)
- **Out of stock:** Struck-through text, Stone border, Clay Earth text, not clickable
- **Focus indicator:** Visible keyboard focus ring (accessibility)

### Trust Strip
- **Position:** Immediately below Add to Cart CTA
- **Format:** Dot-separated inline: "220 GSM · [Artist Name] · Free Exchange 14d · COD Available"
- **Typography:** Caption / 14px / Clay Earth `#816A4F`

### Mobile Sticky CTA
- **Position:** Fixed at viewport bottom
- **Content:** "Add to Cart — 799 EGP"
- **Style:** Ember `#E8593C` background, Obsidian `#1A1A1A` text
- **Height:** 48px minimum (touch target)
- **Visibility:** Always visible when scrolling, disappears only when in-page CTA is in viewport

### Size Guide Modal
- **Surface:** Frost Blue `#E3EFF5` @ 20%, blur 16px, border-radius 16px
- **Content:** Table with dimensions per size + model reference
- **Table bg:** Clean White `#FFFFFF` (data table)
- **Trigger:** "Size Guide" text link in Deep Teal

### Recommendations
- Same-vibe products only, max 4
- 4 across (desktop), horizontal scroll (mobile)

---

## Key Brand Rules

> 5 mandatory images: Flat lay, on-body, lifestyle, print close-up macro, size reference with model measurements. — Section 8.3

> Design story card: "For the one who..." in Soft Violet frosted glass. — Section 8.3

> Artist credit: Avatar + name + "Illustrated by" always visible. — Section 8.3

> Size selector: S/M/L/XL/XXL. Selected state in Ember. Out-of-stock sizes visually struck through. — Section 8.3

> Trust strip below CTA: 220 GSM · Artist name · Free Exchange 14d · COD Available. — Section 8.3

> Mobile sticky CTA: Fixed bar at bottom with "Add to Cart — 799 EGP" in Obsidian text on Ember. — Section 8.3

> Color is never the only way to convey information. Selected states use border + background + text, not color alone. — Section 9.1

> Never photograph: Generic stock images. T-shirt on hanger against white wall. — Section 3.4
