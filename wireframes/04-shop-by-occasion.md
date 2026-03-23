# 04 — Shop by Occasion

**Route:** `/occasions` | **Purpose:** Secondary navigation axis — browse designs organized by gifting and life moments  
**Source:** Brand Guidelines v2.3, Section 6.2 + Section 7.1

---

## Three-Part Screen Structure

| Part           | What Happens                                         |
|----------------|------------------------------------------------------|
| Setup          | "What's the moment?" — occasion-first framing        |
| Confrontation  | 5 occasion cards — which moment matches?             |
| Resolution     | Tap an occasion → enter its curated collection       |

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
║   LABEL: "SHOP BY OCCASION"                                         ║
║   Space Grotesk 500 / 12px / uppercase / Label Brown #876749        ║
║                                                                      ║
║   H1: "Give something that means something"                         ║
║   Space Grotesk 600 / 32px / Obsidian #1A1A1A                       ║
║                                                                      ║
║   Sub: "Find the design that fits the moment."                       ║
║   Inter 400 / 17px / Warm Charcoal #2C2A26                          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   OCCASION CARDS (Papyrus bg)                                        ║
║                                                                      ║
║   Row 1 — Featured occasion (wide card):                             ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │                                                              │  ║
║   │  ┌────────────────────────┐  GIFT SOMETHING REAL             │  ║
║   │  │                        │                                  │  ║
║   │  │   [Gift-wrapped tee    │  H2: "Gift Something Real"      │  ║
║   │  │    with story card,    │  Space Grotesk 500 / 22px       │  ║
║   │  │    warm photography]   │  Obsidian                        │  ║
║   │  │                        │                                  │  ║
║   │  └────────────────────────┘  "Curated designs with bundle   │  ║
║   │                              option — tee + story card +     │  ║
║   │                              gift wrap."                     │  ║
║   │                              Inter 400 / 17px               │  ║
║   │                              Warm Charcoal                   │  ║
║   │                                                              │  ║
║   │                              Target: Gift buyer              │  ║
║   │                              from 999 EGP (bundle)           │  ║
║   │                              Caption / Clay Earth            │  ║
║   │                                                              │  ║
║   │                              ┌──────────────────────┐       │  ║
║   │                              │  Explore Gifts →     │       │  ║
║   │                              │  Ghost btn           │       │  ║
║   │                              └──────────────────────┘       │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
║   Row 2 — 2 cards:                                                   ║
║                                                                      ║
║   ┌───────────────────────────────┐  ┌─────────────────────────────┐║
║   │                               │  │                             │║
║   │  ┌─────────────────┐          │  │  ┌─────────────────┐       │║
║   │  │ [Graduation cap │          │  │  │ [Ramadan lantern│       │║
║   │  │  + tee flat lay]│          │  │  │  + tee styling] │       │║
║   │  └─────────────────┘          │  │  └─────────────────┘       │║
║   │                               │  │                             │║
║   │  H2: "Graduation Season"     │  │  H2: "Eid & Ramadan"       │║
║   │  22px / Obsidian              │  │  22px / Obsidian            │║
║   │                               │  │                             │║
║   │  "Career pride, ambition,    │  │  "Seasonal capsule for     │║
║   │   achievement themes."       │  │   the moments that matter."│║
║   │  Inter 400 / Warm Charcoal   │  │  Inter 400 / Warm Charcoal │║
║   │                               │  │                             │║
║   │  [Explore →] Ghost btn       │  │  [Explore →] Ghost btn     │║
║   │                               │  │                             │║
║   └───────────────────────────────┘  └─────────────────────────────┘║
║                                                                      ║
║   Row 3 — 2 cards:                                                   ║
║                                                                      ║
║   ┌───────────────────────────────┐  ┌─────────────────────────────┐║
║   │                               │  │                             │║
║   │  ┌─────────────────┐          │  │  ┌─────────────────┐       │║
║   │  │ [Birthday cake  │          │  │  │ [Casual street  │       │║
║   │  │  + tee context] │          │  │  │  self-treat]    │       │║
║   │  └─────────────────┘          │  │  └─────────────────┘       │║
║   │                               │  │                             │║
║   │  H2: "Birthday Pick"         │  │  H2: "Just Because"        │║
║   │  22px / Obsidian              │  │  22px / Obsidian            │║
║   │                               │  │                             │║
║   │  "Personality-matched         │  │  "Self-expression,          │║
║   │   collections for every      │  │   everyday self-treat.     │║
║   │   kind of person."           │  │   No reason needed."       │║
║   │  Inter 400 / Warm Charcoal   │  │  Inter 400 / Warm Charcoal │║
║   │                               │  │                             │║
║   │  [Explore →] Ghost btn       │  │  [Explore →] Ghost btn     │║
║   │                               │  │                             │║
║   └───────────────────────────────┘  └─────────────────────────────┘║
║                                                                      ║
║   Notes:                                                             ║
║   - Cards: Glass White overlay, border-radius 16px                   ║
║   - Entire card is clickable                                         ║
║   - Hover: card lifts, image subtle zoom                             ║
║   - Gift Something Real is featured (wider, first position)          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   SECONDARY NAV (Papyrus bg)                                         ║
║                                                                      ║
║   "Or explore by feeling:"                                           ║
║   Inter 400 / 14px / Clay Earth                                      ║
║                                                                      ║
║   [Shop by Vibe]   [Browse by Artist]                                ║
║   Ghost buttons / Label Brown text / Stone border                    ║
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
║ (Papyrus bg)            ║
║                         ║
║ LABEL: "SHOP BY         ║
║  OCCASION"              ║
║ 12px / Label Brown      ║
║                         ║
║ H1: "Give something     ║
║  that means something"  ║
║ 26px / Obsidian         ║
║                         ║
║ Sub: "Find the design   ║
║  that fits the moment." ║
║ 16px / Warm Charcoal    ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ OCCASION CARDS          ║
║ (full-width stack)      ║
║                         ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │  [Gift-wrapped tee  │ ║
║ │   photography]      │ ║
║ │                     │ ║
║ │  H2: "Gift          │ ║
║ │   Something Real"   │ ║
║ │  19px / Obsidian    │ ║
║ │                     │ ║
║ │  "Curated designs   │ ║
║ │   with bundle       │ ║
║ │   option."          │ ║
║ │  16px / W. Charcoal │ ║
║ │                     │ ║
║ │  from 999 EGP       │ ║
║ │  13px / Clay Earth  │ ║
║ │                     │ ║
║ │  ┌───────────────┐  │ ║
║ │  │ Explore Gifts │  │ ║
║ │  │ h:48px        │  │ ║
║ │  └───────────────┘  │ ║
║ └─────────────────────┘ ║
║         16px gap        ║
║ ┌─────────────────────┐ ║
║ │                     │ ║
║ │  [Graduation image] │ ║
║ │                     │ ║
║ │  "Graduation Season"│ ║
║ │  19px / Obsidian    │ ║
║ │                     │ ║
║ │  "Career pride,     │ ║
║ │   achievement."     │ ║
║ │  16px / W. Charcoal │ ║
║ │                     │ ║
║ │  ┌───────────────┐  │ ║
║ │  │ Explore →     │  │ ║
║ │  │ h:48px        │  │ ║
║ │  └───────────────┘  │ ║
║ └─────────────────────┘ ║
║         16px gap        ║
║ ┌─────────────────────┐ ║
║ │  "Eid & Ramadan"    │ ║
║ │  [image + desc]     │ ║
║ │  [Explore →]        │ ║
║ └─────────────────────┘ ║
║         16px gap        ║
║ ┌─────────────────────┐ ║
║ │  "Birthday Pick"    │ ║
║ │  [image + desc]     │ ║
║ │  [Explore →]        │ ║
║ └─────────────────────┘ ║
║         16px gap        ║
║ ┌─────────────────────┐ ║
║ │  "Just Because"     │ ║
║ │  [image + desc]     │ ║
║ │  [Explore →]        │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECONDARY NAV           ║
║                         ║
║ "Or explore by feeling:"║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Shop by Vibe        │ ║
║ │ h:48px / Ghost      │ ║
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ Browse by Artist    │ ║
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

### Occasion Cards

| Occasion            | Target Persona           | Price Signal         |
|---------------------|--------------------------|----------------------|
| Gift Something Real | Gift buyer               | from 999 EGP (bundle)|
| Graduation Season   | Career pride buyer       | from 799 EGP        |
| Eid & Ramadan       | Gift + cultural buyer    | Seasonal capsule     |
| Birthday Pick       | Gift buyer               | from 799 EGP        |
| Just Because        | Self-expression buyer    | from 799 EGP        |

- **Surface:** Glass White `#F8F6F2` @ 20%, border-radius 16px
- **Image:** Warm lifestyle photography matching occasion mood (golden hour feel, real locations)
- **Layout desktop:** Featured card (Gift Something Real) spans full width with image-left / text-right. Remaining 4 cards in 2x2 grid
- **Layout mobile:** All cards full-width vertical stack
- **Occasion name:** Space Grotesk 500 / 22px desktop, 19px mobile / Obsidian
- **Description:** Inter 400 / 17px desktop, 16px mobile / Warm Charcoal
- **Price hint:** Caption / 14px / Clay Earth — anchors expectation
- **CTA:** Ghost button — transparent bg, Stone border, Obsidian text, min-height 48px mobile
- **Hover (desktop):** Card lifts, image subtle zoom 1.03x
- **Click:** Entire card is a link

### Featured Card (Gift Something Real)
- Larger than other cards — full-width on desktop row 1
- Image on left (~45%), text content on right (~55%)
- Emphasizes bundle value proposition (tee + story card + gift wrap)
- Bundle price visible: "from 999 EGP"

### Secondary Navigation
- Cross-links to other browsing axes (vibes, artists)
- Prevents dead-end, always offers alternative paths

---

## Key Brand Rules

> Products are organized along three navigation axes. Every design is cross-tagged across all three. — Section 6

> Gift buyer persona: trigger = "I want to give something meaningful", willingness to pay 700-1,300 EGP incl. bundles, entry point = Shop by Occasion. — Section 1.6

> "Give Something That Means Something" — gifting narrative for Ramadan, Eid, birthdays, graduation. — Section 4.4
