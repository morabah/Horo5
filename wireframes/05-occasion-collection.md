# 05 — Occasion Collection

**Route:** `/occasions/[slug]` (e.g. `/occasions/gift-something-real`) | **Purpose:** Designs curated for a specific occasion with gift bundle CTAs  
**Source:** Brand Guidelines v2.3, Section 6.2 + Section 7.1 + Section 8.5

---

## Three-Part Screen Structure

| Part           | What Happens                                           |
|----------------|--------------------------------------------------------|
| Setup          | "Gift Something Real" — occasion context framing       |
| Confrontation  | Curated designs — which one fits the moment?           |
| Resolution     | Add to Cart / Gift Bundle upgrade                      |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass)                                             │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   OCCASION HERO BANNER (Warm Glow tint #FFF5E6 @ 10% on Papyrus)   ║
║                                                                      ║
║   Breadcrumb: Home > Shop by Occasion > Gift Something Real         ║
║   Caption / 14px / Clay Earth #816A4F                                ║
║                                                                      ║
║   H1: "Gift Something Real"                                         ║
║   Space Grotesk 600 / 32px / Obsidian #1A1A1A                       ║
║                                                                      ║
║   "Curated designs with bundle option — tee + story card +          ║
║    gift wrap. For the people who deserve more than generic."         ║
║   Inter 400 / 17px / Warm Charcoal #2C2A26                          ║
║                                                                      ║
║   Design count: "18 designs"                                         ║
║   Caption / 14px / Clay Earth                                        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   GIFT BUNDLE BANNER (Warm Glow glass #FFF5E6 @ 25%, blur 16px)    ║
║   (Only on gift-oriented occasions)                                  ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │                                                              │  ║
║   │  ┌──────────┐   "Make it a gift"                             │  ║
║   │  │ [Gift    │   H3 / 17px / Obsidian                        │  ║
║   │  │  wrap    │                                                │  ║
║   │  │  preview │   "Add a story card + gift wrap for +200 EGP" │  ║
║   │  │  image]  │   Inter 400 / 17px / Warm Charcoal            │  ║
║   │  └──────────┘                                                │  ║
║   │                  Includes: printed story card, branded wrap, │  ║
║   │                  handwritten-style note option                │  ║
║   │                  Caption / 14px / Clay Earth                 │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   FILTER + SORT BAR (sticky below nav)                               ║
║                                                                      ║
║   ┌────────────────────────────────────────────────────────────┐    ║
║   │                                                            │    ║
║   │  [All Sizes ▾]  [Price Range ▾]  [Vibe ▾]  [Artist ▾]    │    ║
║   │                                                            │    ║
║   │                                      Sort: [Most Gifted ▾]│    ║
║   │                                                            │    ║
║   └────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   PRODUCT GRID (Papyrus bg, 4 columns, 24px gap)                    ║
║                                                                      ║
║   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          ║
║   │          │  │          │  │          │  │          │          ║
║   │  [img]   │  │  [img]   │  │  [img]   │  │  [img]   │          ║
║   │ 1:1      │  │ 1:1      │  │ 1:1      │  │ 1:1      │          ║
║   │          │  │          │  │          │  │          │          ║
║   ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤          ║
║   │ Artist   │  │ Artist   │  │ Artist   │  │ Artist   │          ║
║   │ 14px     │  │ 14px     │  │ 14px     │  │ 14px     │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ Design   │  │ Design   │  │ Design   │  │ Design   │          ║
║   │ Name     │  │ Name     │  │ Name     │  │ Name     │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ 799 EGP  │  │ 799 EGP  │  │ 899 EGP  │  │ 799 EGP  │          ║
║   │          │  │          │  │          │  │          │          ║
║   │ [🎁 Add  │  │ [🎁 Add  │  │ [🎁 Add  │  │ [🎁 Add  │          ║
║   │  Gift    │  │  Gift    │  │  Gift    │  │  Gift    │          ║
║   │  Wrap]   │  │  Wrap]   │  │  Wrap]   │  │  Wrap]   │          ║
║   │ +200 EGP │  │ +200 EGP │  │ +200 EGP │  │ +200 EGP │  ║
║   └──────────┘  └──────────┘  └──────────┘  └──────────┘          ║
║                                                                      ║
║   ... (rows continue)                                                ║
║                                                                      ║
║   ┌───────────────────────────────────────┐                         ║
║   │        Load More Designs              │                         ║
║   │        Ghost btn                      │                         ║
║   └───────────────────────────────────────┘                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   OTHER OCCASIONS (Papyrus bg)                                       ║
║                                                                      ║
║   "More occasions"                                                   ║
║   H3 / 17px / Obsidian                                               ║
║                                                                      ║
║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐║
║   │ Graduation   │ │ Eid &        │ │ Birthday     │ │ Just       │║
║   │ Season       │ │ Ramadan      │ │ Pick         │ │ Because    │║
║   │ [mini img]   │ │ [mini img]   │ │ [mini img]   │ │ [mini img] │║
║   └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘║
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
║ OCCASION HERO           ║
║                         ║
║ Home > Occasions > Gift ║
║ 13px / Clay Earth       ║
║                         ║
║ H1: "Gift Something     ║
║  Real"                  ║
║ 26px / Obsidian         ║
║                         ║
║ "Curated designs with   ║
║  bundle option."        ║
║ 16px / Warm Charcoal    ║
║                         ║
║ 18 designs              ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ GIFT BUNDLE BANNER      ║
║ (Warm Glow glass)       ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ [Gift wrap preview] │ ║
║ │                     │ ║
║ │ "Make it a gift"    │ ║
║ │ 16px / Obsidian     │ ║
║ │                     │ ║
║ │ Story card + wrap   │ ║
║ │ +200 EGP            │ ║
║ │ 13px / Clay Earth   │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ FILTER BAR (sticky)     ║
║                         ║
║ [Filter ▾]  [Sort ▾]   ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ PRODUCT GRID            ║
║ (2 columns, 12px gap)   ║
║                         ║
║ ┌──────────┐┌──────────┐║
║ │ [img]    ││ [img]    │║
║ │          ││          │║
║ │ Artist   ││ Artist   │║
║ │ Design   ││ Design   │║
║ │ 799 EGP  ││ 799 EGP  │║
║ │          ││          │║
║ │ [Gift    ││ [Gift    │║
║ │  Wrap    ││  Wrap    │║
║ │  +200]   ││  +200]   │║
║ └──────────┘└──────────┘║
║                         ║
║ (rows continue)         ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Load More Designs   │ ║
║ │ h:48px / Ghost      │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ OTHER OCCASIONS         ║
║ (horizontal scroll)     ║
║                         ║
║ "More occasions"        ║
║                         ║
║ ┌──────────┐┌──────────┐║
║ │Graduation││Eid &     │──►
║ │Season    ││Ramadan   │║
║ └──────────┘└──────────┘║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER                  │
└─────────────────────────┘
```

---

## Component Annotations

### Gift Bundle Banner
- **Visibility:** Only appears on gift-oriented occasions (Gift Something Real, Eid & Ramadan, Birthday Pick)
- **Does NOT appear** on: Graduation Season, Just Because
- **Surface:** Warm Glow `#FFF5E6` @ 25%, blur 16px, border-radius 16px
- **Content:** Gift wrap preview image, "Make it a gift" heading, price increment (+200 EGP), what's included
- **Purpose:** Educates about bundle option before browsing — not a blocking upsell

### Product Card (Occasion Variant)
- Same base structure as vibe collection cards (see 03-vibe-collection.md)
- **Addition:** "Add Gift Wrap +200 EGP" secondary action below price on gift occasions
- **Gift wrap toggle:** Small text link / chip — not a full button, prevents CTA competition
- **Non-gift occasions:** Card is identical to standard vibe collection card (no gift wrap option)

### Sort Options (Occasion-Specific)
- **Most Gifted** (default for gift occasions) — based on gift bundle purchase data
- **Newest** — by date added
- **Price: Low to High / High to Low**
- **Artist Name A-Z**

### Filter Options
- **Size:** S, M, L, XL, XXL
- **Price Range:** Under 800, 800-900, 900+
- **Vibe:** Cross-filter by vibe axis (e.g. Emotions, Zodiac, Fictious, Career, Trends — see `site.ts`)
- **Artist:** Filter by specific artist

### Other Occasions Section
- Horizontal cards linking to sibling occasions (excludes current)
- Scroll on mobile, 4-across on desktop

---

## Key Brand Rules

> Cart with 1 tee: offer gift bundle upgrade (+200 EGP for story card + gift wrap). — Section 8.5

> Gift bundle: 999-1,199 EGP — Tee + story card + gift wrap. — Section 7.1

> Gift buyer: "I want to give something meaningful", willingness to pay 700-1,300 EGP. — Section 1.6

> Never show more than one upsell module on the cart page. — Section 8.5
