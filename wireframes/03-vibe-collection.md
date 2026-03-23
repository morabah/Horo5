# 03 — Vibe Collection

**Route:** `/vibes/[slug]` (e.g. `/vibes/emotions`, `/vibes/zodiac`) | **Purpose:** All designs in one vibe  
**Implementation:** `web/src/pages/VibeCollection.tsx`  
**Source:** Brand Guidelines v2.3, Section 5.2 + Section 6.1 + Section 8.2

---

## Three-Part Screen Structure

| Part           | What Happens                                              |
|----------------|-----------------------------------------------------------|
| Setup          | Vibe hero confirms name + tagline + design count        |
| Confrontation  | Product grid — which tee?                               |
| Resolution     | Tap product → PDP                                         |

---

## Current behavior (aligned with code)

- **Breadcrumb:** `Home` → **`/?vibe={slug}`** (opens homepage lookbook scrolled to that vibe’s story) · `Vibes` → `/vibes` · **current vibe name** (plain text). Implemented with `encodeURIComponent(slug)` on the Home link.
- **Hero:** Rounded `rounded-2xl` banner — cover image + accent gradient + glass panel: dot, **H1** vibe name, tagline, **“{n} designs”** from `productsByVibe(slug).length`.
- **Product grid:** CSS `repeat(auto-fill, minmax(220px, 1fr))` · each cell is a **card-glass** link to `/products/[slug]` with `TeeImageFrame` (1:1), artist name, product name, **price** `{priceEgp} EGP` (no locale formatting in template string).
- **Empty state:** “No designs in this vibe yet.” when list length is 0.
- **Explore other vibes:** Section title **“Explore other vibes”** — up to **four** sibling `btn btn-ghost` links (`vibes` minus current, `.slice(0, 4)`).
- **Not in MVP build:** Sticky filter/sort bar, quick-view modal, load-more pagination, design-count chips in tabs — wireframe below marked “future / spec” if product still needs them.

---

## Desktop wireframe (current)

```
┌──────────────────────────────────────────────────────────────┐
│ NAV (glass) · [HORO] · …                                     │
└──────────────────────────────────────────────────────────────┘

  Home / Vibes / Emotions
  (Home → /?vibe=emotions)

  ┌────────────────────────────────────────────┐
  │ [full-bleed vibe cover + accent gradient]  │
  │  ●  Emotions                                │
  │     Wear the mood you can't put into words. │
  │     N designs                               │
  └────────────────────────────────────────────┘

  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
  │ tee  │ │ tee  │ │ tee  │ │ tee  │   → auto-fill grid, min 220px
  │ artist│ │ artist│ │ artist│ │ artist│
  │ name │ │ name │ │ name │ │ name │
  │ price│ │ price│ │ price│ │ price│
  └──────┘ └──────┘ └──────┘ └──────┘

  Explore other vibes
  [ Zodiac ] [ Fictious ] [ Career ] [ Trends ]   (example; omits current)

┌──────────────────────────────────────────────────────────────┐
│ FOOTER (app shell / Layout)                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Mobile

- Same order: breadcrumb → hero → grid (2 columns naturally from `minmax(220px,1fr)` on narrow viewports) → ghost buttons wrap.

---

## Component annotations (implemented)

### Breadcrumb
- **Home** uses **`/?vibe=`** so returning users land in the **homepage** vibe story for that slug, not bare `/`.

### Product card
- Entire card navigates to PDP; **no** quick-view overlay in current code.

### “Other vibes”
- Text links only (ghost buttons), **no** mini thumbnails in the current implementation.

---

## Future enhancements (not in current `VibeCollection.tsx`)

- Filter/sort bar, filter chips, load more, quick-view modal — see older wireframe revision if reintroducing.

---

## Key brand rules

> Every design is tagged across axes (vibe, occasion, artist). — Section 6.4  

> One primary CTA per viewport where applicable. — Section 5.1
