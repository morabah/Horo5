# 02 — Shop by Vibe

**Route:** `/vibes` | **Purpose:** Primary axis — all vibes as immersive cards; tap through to `/vibes/[slug]`  
**Implementation:** `web/src/pages/ShopByVibe.tsx`  
**Source:** Brand Guidelines v2.3, Section 6.1 + Section 8.2

---

## Three-Part Screen Structure

| Part           | What Happens                                              |
|----------------|-----------------------------------------------------------|
| Setup          | “Which vibe is yours?” + one-line intro                   |
| Confrontation  | Five vibe cards — pick one                                |
| Resolution     | Whole card links to that vibe’s collection page           |

---

## Current behavior (aligned with code)

- **Container:** `max-w-[1200px]`, `bg-papyrus`, responsive padding.
- **Header:** Label class “Shop by vibe” · H1 **“Which vibe is yours?”** · sub **“Every design starts with a feeling. Start with yours.”**
- **Grid:** `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3` · **gap-5** · **five** cards (one per `vibes` entry in `site.ts`).
- **Card:** Full-card `<Link to={/vibes/${slug}}>` — **not** asymmetric 3+2; equal grid slots.
- **Card chrome:** Fixed height (`min(420px,58vh)` / `md:h-[440px]`), `rounded-2xl`, shadow + `ring-1 ring-black/5`, hover lift + image zoom (`group-hover:scale-105`).
- **Image:** `vibeCovers[slug]` with scrim + accent corner gradient (same language as homepage strip).
- **Footer strip:** `glass-vibe-card-footer` + `vibe-card-text-strip` — accent dot, **glass-text-heading** name, tagline `line-clamp-2`, label **“Explore →”** (always visible; not a separate ghost button).
- **Below grid:** “Or explore another way:” + ghost links **Shop by Occasion** → `/occasions`, **Browse by Artist** → `/artists` (`btn btn-ghost`).

---

## Desktop wireframe (conceptual)

```
┌──────────────────────────────────────────────────────────────┐
│ NAV (glass) · [HORO] · [Reading·Vibe]* · search · nav · cart   │
└──────────────────────────────────────────────────────────────┘

  Shop by vibe
  Which vibe is yours?
  Every design starts with a feeling…

  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ [cover] │ │ [cover] │ │ [cover] │   row wraps: 3 cols on lg
  │ Emotions│ │ Zodiac  │ │Fictious │
  │ tagline │ │ tagline │ │ tagline │
  │Explore →│ │Explore →│ │Explore →│
  └─────────┘ └─────────┘ └─────────┘
  ┌─────────┐ ┌─────────┐
  │ Career  │ │ Trends  │
  └─────────┘ └─────────┘

  Or explore another way:
  [ Shop by Occasion ]  [ Browse by Artist ]
```

---

## Vibes & accents (from `site.ts`)

| Slug       | Name      | Accent (HEX) |
|------------|-----------|--------------|
| `emotions` | Emotions  | `#6B4C8A`    |
| `zodiac`   | Zodiac    | `#D4A24E`    |
| `fictious` | Fictious  | `#2B7596`    |
| `career`   | Career    | `#3A4A3F`    |
| `trends`   | Trends    | `#E8593C`    |

---

## Component notes

- **Typography:** `font-headline` / `font-body` / `font-label` per design tokens (not raw Space Grotesk names in code).
- **Accessibility:** Focus ring `focus-visible:outline-deep-teal` on cards.
- **Homepage:** The **Find your vibe** block on `/` reuses the **same card chrome** as this page; there it scrolls to stacked editorials + `?vibe=` (see `01-homepage.md`).

---

## Brand rules (unchanged intent)

> Never show more than 5–7 options at a single navigation level. — Section 6.4  

> The five vibes are the primary axis; layout must stay stable as the set grows slightly. — Section 6.1
