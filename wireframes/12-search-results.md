# 12 — Search Results

**Route:** `/search?q=...` | **Purpose:** Find designs by keyword across **designs, vibes, and artists**  
**Implementation:** `web/src/pages/Search.tsx` — tabs: **Designs**, **Vibes**, **Artists** only (no separate Occasions tab in current build).  
**Source:** Brand Guidelines v2.3, Section 6.4 + Section 7.2

---

## Three-Part Screen Structure

| Part           | What Happens                                        |
|----------------|-----------------------------------------------------|
| Setup          | "What are you looking for?" — open search           |
| Confrontation  | Results matching query — filter to narrow down       |
| Resolution     | Tap a result → PDP / collection / artist             |

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass)                                             │
│  [HORO]          [Search ___________]    [EN|AR]  [♡]  [Cart (2)]  │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   SEARCH HEADER (Papyrus #F5F0E8 bg)                                ║
║                                                                      ║
║   ┌──────────────────────────────────────────────────────────┐      ║
║   │                                                          │      ║
║   │  🔍  [bold                                       ] [✕]  │      ║
║   │                                                          │      ║
║   │  Large search input, auto-focused                        │      ║
║   │  Supports English + Arabic input                         │      ║
║   │  Placeholder: "Search designs, vibes, artists..."        │      ║
║   │  h:56px desktop, border-radius 16px                      │      ║
║   │  Clean White bg, Stone border, Obsidian text             │      ║
║   │                                                          │      ║
║   └──────────────────────────────────────────────────────────┘      ║
║                                                                      ║
║   "12 results for 'bold'"                                            ║
║   Inter 400 / 17px / Warm Charcoal #2C2A26                          ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   RESULT TABS (Papyrus bg, bottom border Stone)                      ║
║                                                                      ║
║   [ Designs (8) ]  [ Vibes (2) ]  [ Artists (1) ]                    ║
║     ─── active ───                                                   ║
║                                                                      ║
║   Active tab: Obsidian text, Ember underline                         ║
║   Inactive: Clay Earth text, no underline                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   === TAB: DESIGNS (default) ===                                     ║
║                                                                      ║
║   FILTER + SORT BAR                                                  ║
║   ┌────────────────────────────────────────────────────────────┐    ║
║   │  [All Sizes ▾]  [Vibe ▾]  [Price Range ▾]  [Artist ▾]    │    ║
║   │                                      Sort: [Relevance ▾]  │    ║
║   └────────────────────────────────────────────────────────────┘    ║
║                                                                      ║
║   PRODUCT GRID (4 columns, 24px gap)                                 ║
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
║   │ ● Emotions│  │ ● Zodiac │  │ ● Fictious│  │ ● Trends │          ║
║   │          │  │          │  │          │  │          │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ 799 EGP  │  │ 899 EGP  │  │ 799 EGP  │  │ 799 EGP  │          ║
║   └──────────┘  └──────────┘  └──────────┘  └──────────┘          ║
║                                                                      ║
║   (rows continue)                                                    ║
║                                                                      ║
║   ┌───────────────────────────────────────┐                         ║
║   │        Load More Results              │                         ║
║   │        Ghost btn                      │                         ║
║   └───────────────────────────────────────┘                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   === TAB: VIBES (when selected) ===                                 ║
║                                                                      ║
║   ┌──────────────────────────────────┐ ┌─────────────────────────┐  ║
║   │                                  │ │                         │  ║
║   │  ● Emotions                      │ │  ● Zodiac              │  ║
║   │  Dusk Violet #6B4C8A            │ │  Kohl Gold #D4A24E     │  ║
║   │                                  │ │                         │  ║
║   │  "Wear the mood you can't…"      │ │  "Your sign. Your line…"│  ║
║   │                                  │ │                         │  ║
║   │  (design count from catalog)     │ │                         │  ║
║   │                                  │ │                         │  ║
║   │  [Explore →]                     │ │  [Explore →]           │  ║
║   │                                  │ │                         │  ║
║   └──────────────────────────────────┘ └─────────────────────────┘  ║
║                                                                      ║
║   Matching vibes shown as cards linking to /vibes/[slug]             ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   === TAB: ARTISTS (when selected) ===                               ║
║                                                                      ║
║   ┌──────────────────────────────────────────┐                      ║
║   │                                          │                      ║
║   │  ┌────┐  "Illustrated by"                │                      ║
║   │  │ 🎨 │  Artist Name                     │                      ║
║   │  │    │  "Bold linework with emotional   │                      ║
║   │  └────┘   depth."                        │                      ║
║   │           12 designs                     │                      ║
║   │           [View Portfolio →]             │                      ║
║   │                                          │                      ║
║   └──────────────────────────────────────────┘                      ║
║                                                                      ║
║   Artist cards linking to /artists/[slug]                            ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║   EMPTY STATE (when 0 results)                                       ║
║                                                                      ║
║              "No results for 'xyz'"                                  ║
║              H2 / 22px / Obsidian                                   ║
║                                                                      ║
║              "Try a different word, or explore                       ║
║               by vibe instead."                                     ║
║              Body / 17px / Warm Charcoal                            ║
║                                                                      ║
║              ┌────────────────────────┐                             ║
║              │  Shop by Vibe →       │                             ║
║              │  Ember bg / Obsidian  │                             ║
║              └────────────────────────┘                             ║
║                                                                      ║
║              ┌────────────────────────┐                             ║
║              │  Browse All Designs → │                             ║
║              │  Ghost btn            │                             ║
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
║ SEARCH HEADER           ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ 🔍 [bold        ][✕]│ ║
║ │ h:48px / White bg   │ ║
║ │ auto-focused        │ ║
║ │ EN + AR support     │ ║
║ └─────────────────────┘ ║
║                         ║
║ "12 results for 'bold'" ║
║ 16px / Warm Charcoal    ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ RESULT TABS             ║
║ (horizontal scroll)     ║
║                         ║
║ [Designs(8)] [Vibes(2)] ║
║ [Artists(1)][Occas.(1)] ║
║                         ║
║ Active: Obsidian +      ║
║  Ember underline        ║
║ Inactive: Clay Earth    ║
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
║ │ ● Emotions││ ● Zodiac│║
║ │ 799 EGP  ││ 899 EGP  │║
║ └──────────┘└──────────┘║
║                         ║
║ ┌──────────┐┌──────────┐║
║ │  ...     ││  ...     │║
║ └──────────┘└──────────┘║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Load More Results   │ ║
║ │ h:48px / Ghost      │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

=== EMPTY STATE (mobile) ===

╔═════════════════════════╗
║                         ║
║ "No results for 'xyz'"  ║
║ 19px / Obsidian          ║
║                         ║
║ "Try a different word,  ║
║  or explore by vibe."   ║
║ 16px / Warm Charcoal    ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Shop by Vibe →      │ ║
║ │ Ember / h:48px      │ ║
║ └─────────────────────┘ ║
║ ┌─────────────────────┐ ║
║ │ Browse All Designs  │ ║
║ │ Ghost / h:48px      │ ║
║ └─────────────────────┘ ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER                  │
└─────────────────────────┘
```

---

## Component Annotations

### Search Input
- **Desktop:** Large, centered, 56px height, border-radius 16px
- **Mobile:** Full-width, 48px height (touch target)
- **Background:** Clean White `#FFFFFF`, 1px Stone `#D4CFC5` border
- **Auto-focus:** Input is focused on page load
- **Bilingual:** Accepts English and Arabic text, searches across both
- **Placeholder:** "Search designs, vibes, artists..." (English) / "ابحث عن تصميم، فايب، فنان..." (Arabic when AR mode)
- **Clear button:** X icon to clear search, right side of input
- **Live search:** Results update as user types (debounced 300ms)

### Result Tabs
- **Categories (implemented):** Designs (default), Vibes, Artists — **Occasions** tab not in current `Search.tsx`
- **Tab label:** Category name + count in parentheses
- **Active tab:** Obsidian text, 2px Ember `#E8593C` bottom border
- **Inactive tab:** Clay Earth `#816A4F` text, no border
- **Mobile:** Horizontal scrollable if tabs overflow
- **Tabs with 0 results:** Still shown but grayed out (Stone text)

### Search Result Cards (Designs tab)
- Same product card format as collection pages (see 03-vibe-collection.md)
- **Addition:** Vibe tag with accent dot below design name (helps contextualize results)
- **Sort default:** Relevance (search score)
- **Grid:** 4 columns desktop, 2 columns mobile

### Vibe Result Cards (Vibes tab)
- Compact version of vibe cards from 02-shop-by-vibe.md
- Accent dot + vibe name + tagline + design count + "Explore →" link
- Links to `/vibes/[slug]`

### Artist Result Cards (Artists tab)
- Compact version of artist cards from 06-browse-by-artist.md
- Avatar + "Illustrated by" label + name + style description + design count + "View Portfolio →" link
- Links to `/artists/[slug]`

### Empty State
- Contextual message with search term shown
- Offers two recovery paths: "Shop by Vibe" (primary) and "Browse All Designs" (secondary)
- Warm, helpful tone — not a dead end

### Filter/Sort (Designs tab only)
- Same filter/sort bar as collection pages
- **Sort options:** Relevance (default), Newest, Price Low-High, Price High-Low
- **Filters:** Size, Vibe, Price Range, Artist
- **Mobile:** Collapsed filter + sort buttons, bottom sheet for filters

---

## Key Brand Rules

> Search bar prominent on every page, supporting English and Arabic. — Section 6.4

> Arabic copy is not a translation of English. It is native Arabic that carries the same brand personality. — Section 7.2

> Website UI: English primary, Arabic toggle. — Section 7.2

> Never show more than 5-7 options at any single navigation level. — Section 6.4

> If a screen has confrontation but no resolution (no CTA), the user is stranded. — Section 5.2
