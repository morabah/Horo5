# 07 — Artist Profile

**Route:** `/artists/[slug]` (e.g. `/artists/nada-ibrahim`) | **Purpose:** Individual artist page — bio, style, and full portfolio of their HORO designs  
**Source:** Brand Guidelines v2.3, Section 6.3 + Section 4.2 + Section 1.6

---

## Three-Part Screen Structure

| Part           | What Happens                                           |
|----------------|--------------------------------------------------------|
| Setup          | "Illustrated by [Name]" — meet the enabler             |
| Confrontation  | Which of their designs speaks to you?                  |
| Resolution     | Add to Cart / View design detail                       |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass)                                             │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ARTIST HERO (Soft Violet glass tint on Papyrus bg)                 ║
║                                                                      ║
║   Breadcrumb: Home > Browse by Artist > Nada Ibrahim                ║
║   Caption / 14px / Clay Earth #816A4F                                ║
║                                                                      ║
║   ┌────────┐                                                        ║
║   │        │  avatar                                                ║
║   │  🎨    │  96px round                                            ║
║   │        │  (photo or illustrated self-portrait)                  ║
║   └────────┘                                                        ║
║                                                                      ║
║   LABEL: "ILLUSTRATED BY"                                            ║
║   Space Grotesk 500 / 12px / uppercase / Label Brown #876749        ║
║                                                                      ║
║   H1: "Nada Ibrahim"                                                ║
║   Space Grotesk 600 / 32px / Obsidian #1A1A1A                       ║
║                                                                      ║
║   Style description:                                                 ║
║   "Bold linework with emotional depth. Ink-heavy, high contrast     ║
║    compositions that explore identity and inner conflict through     ║
║    stark visual metaphors."                                          ║
║   Inter 400 / 17px / Warm Charcoal #2C2A26                          ║
║                                                                      ║
║   "12 designs for HORO"                                              ║
║   Caption / 14px / Clay Earth                                        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   ARTIST STORY CARD (Soft Violet glass #EDE5F5 @ 20%, blur 16px)   ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────────┐  ║
║   │                                                              │  ║
║   │  "What drives my work is the tension between what we show   │  ║
║   │   the world and what we hold inside. HORO lets me put that  │  ║
║   │   tension on a t-shirt — and someone else gets to decide    │  ║
║   │   if it's theirs."                                          │  ║
║   │                                                              │  ║
║   │  — Nada Ibrahim                                              │  ║
║   │                                                              │  ║
║   │  Quote: Inter 400 / 17px / Warm Charcoal                    │  ║
║   │  Attribution: Space Grotesk 500 / 14px / Clay Earth         │  ║
║   │                                                              │  ║
║   └──────────────────────────────────────────────────────────────┘  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   FILTER + SORT BAR                                                  ║
║                                                                      ║
║   ┌────────────────────────────────────────────────────────────┐    ║
║   │  [All Sizes ▾]  [Vibe ▾]  [Occasion ▾]                    │    ║
║   │                                      Sort: [Newest ▾]     │    ║
║   └────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   DESIGNS GRID (Papyrus bg, 3 columns, 24px gap)                    ║
║                                                                      ║
║   LABEL: "DESIGNS BY NADA IBRAHIM"                                   ║
║   12px / uppercase / Label Brown                                     ║
║                                                                      ║
║   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐   ║
║   │                  │ │                  │ │                  │   ║
║   │  [img]           │ │  [img]           │ │  [img]           │   ║
║   │  1:1 ratio       │ │  1:1 ratio       │ │  1:1 ratio       │   ║
║   │                  │ │                  │ │                  │   ║
║   ├──────────────────┤ ├──────────────────┤ ├──────────────────┤   ║
║   │                  │ │                  │ │                  │   ║
║   │  Design Name     │ │  Design Name     │ │  Design Name     │   ║
║   │  SG 500 / 17px   │ │  SG 500 / 17px   │ │  SG 500 / 17px   │   ║
║   │  Obsidian         │ │  Obsidian         │ │  Obsidian         │   ║
║   │                  │ │                  │ │                  │   ║
║   │  "For the one    │ │  "For the one    │ │  "For the one    │   ║
║   │   who..."        │ │   who..."        │ │   who..."        │   ║
║   │  14px / Clay E.  │ │  14px / Clay E.  │ │  14px / Clay E.  │   ║
║   │                  │ │                  │ │                  │   ║
║   │  ● Emotions      │ │  ● Zodiac        │ │  ● Fictious      │   ║
║   │  vibe tag w/dot  │ │    Thoughtful    │ │  vibe tag w/dot  │   ║
║   │  12px / accent   │ │  vibe tag        │ │                  │   ║
║   │                  │ │                  │ │                  │   ║
║   │  799 EGP         │ │  899 EGP         │ │  799 EGP         │   ║
║   │  SG 600 / 17px   │ │  SG 600 / 17px   │ │  SG 600 / 17px   │   ║
║   │                  │ │                  │ │                  │   ║
║   └──────────────────┘ └──────────────────┘ └──────────────────┘   ║
║                                                                      ║
║   (rows continue for all designs by this artist)                     ║
║                                                                      ║
║   Notes:                                                             ║
║   - 3 columns (not 4) — gives each design more visual breathing room║
║   - No "artist name" on cards since the page IS the artist           ║
║   - Vibe tag with accent dot replaces artist attribution             ║
║   - "For the one who..." teaser adds storytelling depth              ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   MORE ARTISTS (Papyrus bg)                                         ║
║                                                                      ║
║   "More artists"                                                     ║
║   H3 / 17px / Obsidian                                               ║
║                                                                      ║
║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐║
║   │ ┌──┐         │ │ ┌──┐         │ │ ┌──┐         │ │ ┌──┐       │║
║   │ │🎨│ Name    │ │ │🎨│ Name    │ │ │🎨│ Name    │ │ │🎨│ Name  │║
║   │ └──┘         │ │ └──┘         │ │ └──┘         │ │ └──┘       │║
║   │ "8 designs"  │ │ "15 designs" │ │ "6 designs"  │ │ "10 des." │║
║   └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘║
║                                                                      ║
║   Compact cards — avatar, name, design count                         ║
║   Excludes current artist                                            ║
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
║ ARTIST HERO             ║
║ (Soft Violet tint)      ║
║                         ║
║ Home > Artists > Nada   ║
║ 13px / Clay Earth       ║
║                         ║
║       ┌────┐            ║
║       │ 🎨 │  avatar    ║
║       │    │  72px      ║
║       └────┘            ║
║     (centered)          ║
║                         ║
║ LABEL: "ILLUSTRATED BY" ║
║ 12px / Label Brown      ║
║ (centered)              ║
║                         ║
║ H1: "Nada Ibrahim"      ║
║ 26px / Obsidian          ║
║ (centered)              ║
║                         ║
║ "Bold linework with     ║
║  emotional depth.       ║
║  Ink-heavy, high        ║
║  contrast."             ║
║ 16px / Warm Charcoal    ║
║ (centered)              ║
║                         ║
║ "12 designs for HORO"   ║
║ 13px / Clay Earth       ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ ARTIST STORY CARD       ║
║ (Soft Violet glass)     ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ "What drives my     │ ║
║ │  work is the tension│ ║
║ │  between what we    │ ║
║ │  show the world..." │ ║
║ │                     │ ║
║ │ — Nada Ibrahim      │ ║
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
║ DESIGNS GRID            ║
║ (2 columns, 12px gap)   ║
║                         ║
║ LABEL: "DESIGNS BY      ║
║  NADA IBRAHIM"          ║
║                         ║
║ ┌──────────┐┌──────────┐║
║ │ [img]    ││ [img]    │║
║ │          ││          │║
║ │ Design   ││ Design   │║
║ │ Name     ││ Name     │║
║ │ 16px     ││ 16px     │║
║ │          ││          │║
║ │ "For the ││ "For the │║
║ │  one..." ││  one..." │║
║ │ 13px     ││ 13px     │║
║ │          ││          │║
║ │ ● Emotions││ ● Zodiac│║
║ │          ││          │║
║ │ 799 EGP  ││ 899 EGP  │║
║ └──────────┘└──────────┘║
║                         ║
║ (rows continue)         ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ MORE ARTISTS            ║
║ (horizontal scroll)     ║
║                         ║
║ "More artists"          ║
║                         ║
║ ┌────────┐ ┌────────┐  ║
║ │🎨 Name │ │🎨 Name │──►
║ │8 des.  │ │15 des. │  ║
║ └────────┘ └────────┘  ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER                  │
└─────────────────────────┘
```

---

## Component Annotations

### Artist Hero Section
- **Layout:** Centered on mobile, left-aligned on desktop
- **Avatar:** 96px desktop / 72px mobile, circular, artist photo or illustrated self-portrait
- **Background tint:** Soft Violet `#EDE5F5` @ 10% on Papyrus
- **Style description:** Max 2 sentences, focus on visual style characteristics, not personal biography

### Artist Story Card
- **Surface:** Soft Violet glass `#EDE5F5` @ 20%, blur 16px, border-radius 16px
- **Content:** Artist quote about their creative process / relationship to HORO
- **Tone:** Artist speaks about craft, not about themselves as a brand
- **Quote format:** Italic body text + em-dash attribution

### Design Cards (Artist Variant)
- **Columns:** 3 on desktop (wider cards), 2 on mobile
- **Differs from standard cards:** No artist name (redundant), adds vibe tag with accent dot, includes "For the one who..." teaser
- **Vibe tag:** Accent dot color + vibe name, Label / 12px / vibe accent color
- **Design name:** Space Grotesk 500 / 17px / Obsidian
- **Story teaser:** "For the one who..." — Inter 400 / 14px / Clay Earth
- **Price:** Space Grotesk 600 / 17px / Obsidian

### More Artists Section
- Compact horizontal cards linking to other artist profiles
- Avatar (small, 32px) + name + design count
- Excludes current artist

---

## Key Brand Rules

> The artist creates, the wearer completes. — Value 2

> Digital illustrators bring their craft and vision. But the art isn't finished until someone chooses it as theirs. We celebrate the talent behind the scenes while keeping the spotlight on the person who wears the final piece. — Section 1.3

> Art Lover persona: trigger = "I appreciate real illustration", willingness to pay 900-1,550+ EGP, key objection = "Artist must feel real". — Section 1.6

> Artist credit: Avatar + name + "Illustrated by" always visible. — Section 8.3
