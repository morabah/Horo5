# 01 — Homepage

**Route:** `/` | **Purpose:** Single-mode shopping story: hero → feeling → **five vibe cards (commerce)** → trust → quotes → latest drop → invite. Long-form vibe editorials live on **`/vibes/:slug`** ([`VibeCollection.tsx`](../web/src/pages/VibeCollection.tsx)), not on the homepage.  
**Source:** Brand Guidelines v2.3, Section 8.2 + Section 5.2

**Implementation (current):** [`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx) + [`web/src/components/HomeVibeGrid.tsx`](../web/src/components/HomeVibeGrid.tsx). Five product vibes (**Emotions, Zodiac, Fictious, Career, Trends**) match `web/src/data/site.ts`. Editorial copy and imagery for vibe pages: `web/src/data/homeEditorial.ts`. **No** scroll-spy, **no** “Reading · [vibe]” in the nav on `/`. Mobile nav search opens a **full-screen search layer** ([`Nav.tsx`](../web/src/components/Nav.tsx)); desktop uses an inline search field.

---

## Three-Part Screen Structure

| Part           | What Happens                                                                 |
|----------------|-------------------------------------------------------------------------------|
| Setup          | Hero: “Wear What You Mean” + **Find Your Design** → `/vibes`                  |
| Confrontation  | **Five vibe cards** — each links to **`/vibes/:slug`** with commerce CTA (“See vibe”) |
| Resolution     | Trust → stories → Just Dropped → **Find Your Design** invite → `/vibes`     |

### Section order (implemented in `Home.tsx`)

1. **Hero** (`<header>`)  
2. **The Feeling** — text-only band  
3. **HomeVibeGrid** — five image-led cards → `/vibes/:slug` (no editorials on `/`)  
4. **Trust** — four badges  
5. **Stories** — three quote cards  
6. **Just Dropped** — four products  
7. **Invite** — headline + **Find Your Design** → `/vibes`  

---

## Desktop Wireframe (1440px)

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAV BAR  (frosted glass — Glass White #F8F6F2 @ 25%, blur 16px)    │
│                                                                      │
│  Mobile: [menu ☰]  [HORO]  [🔍 → full-screen search]  [bag]            │
│  Desktop: [HORO]  [Search field]  [Menu]  [lang] [♡] [bag]           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                     SECTION 1 — HERO                                 ║
║                 (full viewport, Obsidian #1A1A1A bg)                 ║
║                                                                      ║
║              ┌─────────────────────────────────┐                     ║
║              │                                 │                     ║
║              │   Background: cinematic warm     │                     ║
║              │   illustration / lifestyle shot  │                     ║
║              │   with dark overlay              │                     ║
║              │                                 │                     ║
║              │   H1: "Wear What You Mean"      │                     ║
║              │   Space Grotesk 600 / 32px      │                     ║
║              │   Color: White #FFFFFF           │                     ║
║              │                                 │                     ║
║              │   Sub: "Find the design that    │                     ║
║              │   says it for you."              │                     ║
║              │   Inter 400 / 17px              │                     ║
║              │   Color: Stone #D4CFC5           │                     ║
║              │                                 │                     ║
║              │   Supporting line + "Starting at  │                     ║
║              │   799 EGP" (label)               │                     ║
║              │                                 │                     ║
║              │   ┌──────────────────────┐      │                     ║
║              │   │  Find Your Design   │      │                     ║
║              │   │  → /vibes            │      │                     ║
║              │   │  Primary CTA         │      │                     ║
║              │   └──────────────────────┘      │                     ║
║              │   COD | Free Exchange (caption)  │                     ║
║              │   [Featured product thumb — BR]  │                     ║
║              │   "The Narrative" ↓ (scroll cue) │                     ║
║              │                                 │                     ║
║              └─────────────────────────────────┘                     ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                    SECTION 2 — THE FEELING                           ║
║                  (Papyrus #F5F0E8 bg, text only)                     ║
║                                                                      ║
║                                                                      ║
║                    "You know that feeling?"                           ║
║                    Space Grotesk 500 / 22px                          ║
║                    Obsidian #1A1A1A                                   ║
║                                                                      ║
║           "When nothing in your closet says what                     ║
║            you're actually thinking."                                ║
║            Large light display (≈24px mobile / 36px desktop)       ║
║            Warm Charcoal #2C2A26                                     ║
║                                                                      ║
║            "We get it. That's why we're here."                       ║
║            Inter 400 / 17px                                          ║
║            Clay Earth #816A4F                                        ║
║                                                                      ║
║         (NO images, NO cards — just words, centered)                 ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║  SECTION 3 — FIND YOUR VIBE (HomeVibeGrid)    Papyrus #F5F0E8        ║
║                                                                      ║
║   Row 1: "FIND YOUR VIBE"  ·  short helper (commerce copy)            ║
║                                                                      ║
║   ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   ← 5 cards (responsive grid)    ║
║   │ E  │ │ Z  │ │ F  │ │ C  │ │ T  │     Link → `/vibes/:slug`        ║
║   │ m  │ │ o  │ │ i  │ │ a  │ │ r  │                                 ║
║   │ o  │ │ d  │ │ c  │ │ r  │ │ e  │   Emotions · Zodiac · Fictious ║
║   │ t  │ │ i  │ │ t  │ │ e  │ │ n  │   · Career · Trends            ║
║   │ i  │ │ a  │ │ i  │ │ e  │ │ d  │                                 ║
║   │ o  │ │ c  │ │ o  │ │ r  │ │ s  │   Accent dot + name + tagline  ║
║   │ n  │ │    │ │ u  │ │    │ │    │   CTA: "See vibe →"             ║
║   │ s  │ │    │ │ s  │ │    │ │    │                                 ║
║   └────┘ └────┘ └────┘ └────┘ └────┘                                 ║
║                                                                      ║
║   Layout: responsive grid — no horizontal strip, no `?vibe=` on `/`    ║
║   Long-form stories: on `/vibes/:slug` only (`VibeEditorialSection`)  ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                     SECTION 4 — THE PROOF                            ║
║                    (Obsidian #1A1A1A bg)                             ║
║                                                                      ║
║   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐║
║   │ ╭──────────╮ │ │ ╭──────────╮ │ │ ╭──────────╮ │ │╭──────────╮│║
║   │ │ 🧵       │ │ │ │ 🎨       │ │ │ │ 🔄       │ │ ││ 💵       ││║
║   │ │          │ │ │ │          │ │ │ │          │ │ ││          ││║
║   │ │ 220 GSM  │ │ │ │ Licensed │ │ │ │ Free     │ │ ││ COD      ││║
║   │ │ Cotton   │ │ │ │ Artwork  │ │ │ │ Exchange │ │ ││Available ││║
║   │ │          │ │ │ │          │ │ │ │ 14 Days  │ │ ││          ││║
║   │ ╰──────────╯ │ │ ╰──────────╯ │ │ ╰──────────╯ │ │╰──────────╯│║
║   └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘║
║                                                                      ║
║   4 badges on Frost Blue glass (#E3EFF5 @ 20%, blur 16px)           ║
║   Icon + label per badge                                             ║
║   Text: White #FFFFFF                                                ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                   SECTION 5 — REAL STORIES                           ║
║                    (Papyrus #F5F0E8 bg)                              ║
║                                                                      ║
║   LABEL: "YOU COMPLETED IT"                                          ║
║   Space Grotesk 500 / 12px / uppercase / Label Brown #876749        ║
║                                                                      ║
║   ┌───────────────────┐ ┌───────────────────┐ ┌──────────────────┐ ║
║   │                   │ │                   │ │                  │ ║
║   │  "Finally, a shirt│ │  "The quality of  │ │  "Horo isn't    │ ║
║   │   that feels like │ │   the cotton is   │ │   just clothing;│ ║
║   │   a conversation  │ │   insane. 220 GSM │ │   it's a mood." │ ║
║   │   starter…"       │ │   makes such a…"  │ │                  │ ║
║   │                   │ │                   │ │                  │ ║
║   │   — Omar K., Cairo│ │   — Sarah M.,     │ │   — Yassin A.,  │ ║
║   │                   │ │     Alexandria    │ │     Giza        │ ║
║   └───────────────────┘ └───────────────────┘ └──────────────────┘ ║
║                                                                      ║
║   3 quote cards on Warm Glow glass (#FFF5E6 @ 25%, blur 16px)       ║
║   Real names + cities, specific verifiable quotes                    ║
║   Quote: Inter 400 / 17px / Warm Charcoal #2C2A26                   ║
║   Attribution: Space Grotesk 500 / 14px / Clay Earth #816A4F        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                   SECTION 6 — LATEST DROP                            ║
║                    (Papyrus #F5F0E8 bg)                              ║
║                                                                      ║
║   H2: "Just Dropped"                                                 ║
║   Space Grotesk 500 / 22px / Obsidian                                ║
║                                                                      ║
║   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          ║
║   │          │  │          │  │          │  │          │          ║
║   │  [img]   │  │  [img]   │  │  [img]   │  │  [img]   │          ║
║   │          │  │          │  │          │  │          │          ║
║   ├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤          ║
║   │ Artist   │  │ Artist   │  │ Artist   │  │ Artist   │          ║
║   │ Name     │  │ Name     │  │ Name     │  │ Name     │          ║
║   │ Caption  │  │ Caption  │  │ Caption  │  │ Caption  │          ║
║   │ 14px     │  │ 14px     │  │ 14px     │  │ 14px     │          ║
║   │ Clay     │  │ Clay     │  │ Clay     │  │ Clay     │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ Design   │  │ Design   │  │ Design   │  │ Design   │          ║
║   │ Name     │  │ Name     │  │ Name     │  │ Name     │          ║
║   │ 17px     │  │ 17px     │  │ 17px     │  │ 17px     │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ Story    │  │ Story    │  │ Story    │  │ Story    │          ║
║   │ teaser   │  │ teaser   │  │ teaser   │  │ teaser   │          ║
║   │──────────│  │──────────│  │──────────│  │──────────│          ║
║   │ 799 EGP  │  │ 799 EGP  │  │ 899 EGP  │  │ 799 EGP  │          ║
║   └──────────┘  └──────────┘  └──────────┘  └──────────┘          ║
║                                                                      ║
║   4-column grid. Glass White card overlay.                           ║
║   Price: Space Grotesk 600 / 17px / Obsidian                        ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                    SECTION 7 — THE INVITE                            ║
║                     (Papyrus #F5F0E8 bg)                             ║
║                                                                      ║
║                                                                      ║
║                                                                      ║
║                     "Find your word."                                ║
║                   Space Grotesk 500 / 22px                           ║
║                   Obsidian #1A1A1A                                   ║
║                                                                      ║
║                ┌───────────────────────┐                             ║
║                │  Find Your Design     │                             ║
║                │  → /vibes              │                             ║
║                │  Primary / Obsidian txt│                             ║
║                └───────────────────────┘                             ║
║                                                                      ║
║             (generous whitespace above and below)                    ║
║                                                                      ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│ FOOTER  (Obsidian #1A1A1A bg)                                        │
│                                                                      │
│  [HORO]     Shop    About    Artists    Contact     [IG] [TK] [WA]  │
│                                                                      │
│             "Wear What You Mean"                                     │
│             Stone #D4CFC5 / 14px                                     │
│                                                                      │
│  © 2026 HORO Egypt                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Wireframe (375px)

```
┌─────────────────────────┐
│ NAV (glass, sticky)     │
│ [HORO]    [🔍] [Cart]  │
│ Hamburger menu left     │
└─────────────────────────┘

╔═════════════════════════╗
║ SECTION 1 — HERO        ║
║ (full viewport height)  ║
║                         ║
║  ┌───────────────────┐  ║
║  │                   │  ║
║  │ [cinematic bg     │  ║
║  │  with overlay]    │  ║
║  │                   │  ║
║  │ H1: "Wear What   │  ║
║  │  You Mean"        │  ║
║  │ 26px / White      │  ║
║  │                   │  ║
║  │ Sub: "Find the    │  ║
║  │ design that says  │  ║
║  │ it for you."      │  ║
║  │ 17px / Stone      │  ║
║  │                   │  ║
║  │ ┌───────────────┐ │  ║
║  │ │ Find Your     │ │  ║
║  │ │ Design →      │ │  ║
║  │ │ /vibes        │ │  ║
║  │ │ h:48px touch  │ │  ║
║  │ └───────────────┘ │  ║
║  │                   │  ║
║  └───────────────────┘  ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 2 — THE FEELING ║
║ (Papyrus bg, text only) ║
║                         ║
║  "You know that         ║
║   feeling?"             ║
║  19px / Obsidian        ║
║                         ║
║  "When nothing in your  ║
║   closet says what      ║
║   you're actually       ║
║   thinking."            ║
║  16px / Warm Charcoal   ║
║                         ║
║  "We get it."           ║
║  16px / Clay Earth      ║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 3 — VIBES       ║
║ (HomeVibeGrid)          ║
║                         ║
║ FIND YOUR VIBE          ║
║                         ║
║   5 cards (grid)        ║
║   E Z F C T             ║
║   "See vibe →"          ║
║   → /vibes/:slug        ║
║                         ║
║ (no editorials here)    ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 4 — THE PROOF   ║
║ (Obsidian bg)           ║
║                         ║
║ ┌─────────┐┌─────────┐ ║
║ │ 220 GSM ││Licensed │ ║
║ │ Cotton  ││Artwork  │ ║
║ └─────────┘└─────────┘ ║
║ ┌─────────┐┌─────────┐ ║
║ │ Free    ││ COD     │ ║
║ │Exchange ││Available│ ║
║ │ 14 Days ││         │ ║
║ └─────────┘└─────────┘ ║
║                         ║
║ 2x2 grid, Frost Blue   ║
║ glass badges            ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 5 — REAL STORIES║
║ (Papyrus bg)            ║
║                         ║
║ LABEL: "YOU COMPLETED   ║
║  IT"                    ║
║                         ║
║ (horizontal scroll)     ║
║                         ║
║ ┌──────────┐            ║
║ │ "Finally │            ║
║ │  a shirt │ ──►        ║
║ │  …"      │            ║
║ │          │            ║
║ │ — Omar K.│            ║
║ │   Cairo  │            ║
║ └──────────┘            ║
║                         ║
║ Warm Glow glass cards   ║
║ Snap-scroll on mobile   ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 6 — LATEST DROP ║
║ (Papyrus bg)            ║
║                         ║
║ H2: "Just Dropped"      ║
║                         ║
║ (2-column grid)         ║
║                         ║
║ ┌──────────┐┌──────────┐║
║ │ [img]    ││ [img]    │║
║ │ Artist   ││ Artist   │║
║ │ Name     ││ Name     │║
║ │ Story    ││ Story    │║
║ │ 799 EGP  ││ 799 EGP  │║
║ └──────────┘└──────────┘║
║ ┌──────────┐┌──────────┐║
║ │ [img]    ││ [img]    │║
║ │ Artist   ││ Artist   │║
║ │ Name     ││ Name     │║
║ │ Story    ││ Story    │║
║ │ 899 EGP  ││ 799 EGP  │║
║ └──────────┘└──────────┘║
║                         ║
╚═════════════════════════╝

╔═════════════════════════╗
║ SECTION 7 — THE INVITE  ║
║ (Papyrus bg)            ║
║                         ║
║                         ║
║   "Find your word."     ║
║   19px / Obsidian       ║
║                         ║
║ ┌─────────────────────┐ ║
║ │ Find Your Design    │ ║
║ │ → /vibes            │ ║
║ │ h:48px touch        │ ║
║ └─────────────────────┘ ║
║                         ║
║                         ║
╚═════════════════════════╝

┌─────────────────────────┐
│ FOOTER (Obsidian bg)    │
│                         │
│ [HORO]                  │
│ Shop · About · Artists  │
│ Contact                 │
│                         │
│ [IG] [TK] [WA]         │
│                         │
│ "Wear What You Mean"    │
│ © 2026 HORO Egypt       │
└─────────────────────────┘
```

---

## Component Annotations

### Navigation Bar
- **Glass:** `glass-nav` — frosted bar, fixed top (`z-50`)
- **Logo:** `BrandLogo` → `/`
- **Mobile:** Menu | Logo | Search (opens full-screen search layer) | Bag — **no** duplicate search field + icon in one row
- **Desktop:** Logo | Search field | Menu | Language | Wishlist | Bag
- **Links:** Collection (`/vibes`), Artists, About — inside **Menu** drawer (full-screen sheet)
- **Utilities:** Material Symbols for menu / icons (no emoji in UI per brand rules — wireframe icons are illustrative)

### Hero Section
- **Height:** `min-h-dvh` / `min-h-screen`, `bg-obsidian`
- **Background:** Full-bleed image (`heroHomeTee`), gradient overlay
- **Headline:** “Wear What You Mean” — `font-headline`, ~32px desktop / 26px mobile, white
- **Body copy:** “Find the design that says it for you.” + “When nothing in your closet says what you're thinking.”
- **Price line:** “Starting at 799 EGP” (label style)
- **Primary CTA:** “Find Your Design” → `/vibes` — primary button, white text on primary
- **Trust line:** “COD Available | Free Exchange”
- **Featured:** Random product thumbnail after mount (bottom-right) → product page; avoids SSR/client mismatch
- **Scroll cue:** “The Narrative” + vertical rule (suggests scroll to story below)

### Home vibe grid (`HomeVibeGrid`)
- **Header:** “Find your vibe” + short helper line (commerce-first).
- **Cards:** Five vibes — **Emotions, Zodiac, Fictious, Career, Trends** — image-led, glass footer, accent dot, name, tagline, **“See vibe →”** (links to **`/vibes/:slug`**).
- **Layout:** Responsive grid (`grid-cols-1` → `sm:2` → `lg` / `xl` up to 5 columns). No horizontal snap strip, no FAB, no `?vibe=` on `/`.
- **Editorials:** Moved to **`/vibes/:slug`** (`VibeEditorialSection` + `vibeEditorialBlocks`).

### Trust Badges
- **Section:** `bg-obsidian`
- **Cards:** `glass-trust-badge` — Material Symbols icons (`layers`, `verified`, `history`, `payments`), title + subtitle
- **Copy (current):** 220 GSM Cotton; Original Licensed Design; Free Exchange 14 Days; COD Available
- **Layout:** 1 col → `sm:` 2 cols → `lg:` 4 cols

### Customer Quote Cards
- **Surface:** `warm-glow-glass` — staggered vertical offset on desktop (`md:mt-16` / `md:mt-32` on columns 2–3)
- **Layout:** 1 col mobile → 3 cols `md`
- **Quotes (current):** Omar K. / Cairo; Sarah M. / Alexandria; Yassin A. / Giza — see `Home.tsx` strings
- **Label:** “You completed it” (`font-headline`, wide tracking)

### Latest Drop Grid
- **Heading:** “Just Dropped” + **View All** link → `/vibes`
- **Data:** First four `products` from `site` data; image from `getProductMedia`; vibe + artist labels
- **Layout:** 1 → `sm:` 2 → `lg:` 4 columns; `aspect-[3/4]` product image
- **CTA per card:** “Shop now — EGP {price}” → product detail
- **Price:** Shown top-right and in button (formatted `en-EG`)

### Invite (closing band)
- **Headline:** “Find your word.”
- **CTA:** “Find Your Design” → `/vibes` — primary, obsidian text on primary (`md+` inline)

### Footer
- **Note:** Homepage content in `Home.tsx` ends after the **Invite** section. Any global footer is provided by the app shell (`Layout`), not shown in the wireframe ASCII above—align footer docs with `Layout` / shared components if present.

---

## Key Brand Rules (from Guidelines)

> "The HORO website must feel like walking through a gallery, not scrolling through a catalog." — Section 8.1

> "The illustration is always the hero. UI exists to frame it, never compete with it." — Section 8.1

> Every customer-facing page must have: (1) An offer, (2) Supporting information, (3) A simple response mechanism. — Section 5.3

> One primary CTA per viewport. — Section 5.1

> Never use emojis on the website. — Section 2.2 (UI uses **Material Symbols** icon font for icons, not Unicode emoji in copy.)

> All text passes 4.5:1 contrast on its background. — Section 9.1

> All animations respect reduced-motion preferences. — Section 9.1
