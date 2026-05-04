# HORO Shopify Hero Position Fix

> **Date**: 2026-05-04  
> **Task**: Apply a long-term code-level fix for Home Hero layout positioning and CTA visibility  
> **Branch**: `medusa`  
> **Store**: horo-9109.myshopify.com

---

## Problem

The Shopify section "Custom CSS" field has a **500-character limit**. We previously used this to move the hero CTA to the lower-left when a centered model/lifestyle image is used. This was a temporary workaround. The hero needed a **code-level fix** so the text and CTA sit clearly in the lower-left (or lower-right) area without relying on section Custom CSS.

The existing `component-home-hero.css` had position rules for `center-center`, `bottom-center`, `bottom-left`, and `bottom-right`, but the `bottom-left` and `bottom-right` rules were incomplete — they only changed `justify-content` without proper lower-corner alignment, text alignment, padding, or CTA spacing.

Additionally, the CTA button could become invisible on dark/lifestyle hero images because it inherited Dawn's default dark button style, which blends into the hero scrim layers.

---

## Files changed

| # | File | Purpose |
|---|---|---|
| 1 | `shopify-theme/assets/component-home-hero.css` | Fixed bottom-left, bottom-right, and center positioning; added hero-only CTA light style; added mobile overrides. |

---

## What changed

### 1. Bottom-left positioning (Task 1)

**Before** (incomplete):
```css
.home-hero[data-position="bottom-left"] .home-hero__content {
  justify-content: flex-end;
}
```

**After** (robust lower-left):
```css
.home-hero[data-position="bottom-left"] .home-hero__content {
  align-items: flex-start;
  justify-content: flex-end;
  text-align: start;
  padding-inline: clamp(2rem, 6vw, 8rem);
  padding-block-end: clamp(4rem, 9vh, 8rem);
}

.home-hero[data-position="bottom-left"] .home-hero__text-wrapper {
  align-items: flex-start;
  max-width: 42rem;
}

.home-hero[data-position="bottom-left"] .home-hero__heading,
.home-hero[data-position="bottom-left"] .home-hero__subheading {
  text-align: start;
}

.home-hero[data-position="bottom-left"] .home-hero__cta {
  align-self: flex-start;
  margin-block-start: 2.4rem;
  margin-inline: 0;
}
```

- Content block positioned **lower-left** (`justify-content: flex-end`, `align-items: flex-start`)
- Text aligned **start** (RTL-safe: left in LTR, right in RTL)
- CTA button aligned **left/start** under the text
- Generous but fluid bottom padding (`clamp(4rem, 9vh, 8rem)`) so content does not sit over the model's face/torso
- Generous inline padding (`clamp(2rem, 6vw, 8rem)`) for edge spacing
- Text wrapper capped at `42rem` for readability

### 2. Bottom-right positioning (Task 2)

**After** (robust lower-right):
```css
.home-hero[data-position="bottom-right"] .home-hero__content {
  align-items: flex-end;
  justify-content: flex-end;
  text-align: end;
  padding-inline: clamp(2rem, 6vw, 8rem);
  padding-block-end: clamp(4rem, 9vh, 8rem);
}

.home-hero[data-position="bottom-right"] .home-hero__text-wrapper {
  align-items: flex-end;
  max-width: 42rem;
}

.home-hero[data-position="bottom-right"] .home-hero__heading,
.home-hero[data-position="bottom-right"] .home-hero__subheading {
  text-align: end;
}

.home-hero[data-position="bottom-right"] .home-hero__cta {
  align-self: flex-end;
  margin-block-start: 2.4rem;
  margin-inline: 0;
}
```

Mirrors bottom-left on the opposite edge. Uses `text-align: end`, `align-items: flex-end`, `align-self: flex-end`. RTL-safe via logical properties.

### 3. Hero-only CTA light style (Task 3)

**New scoped styles** inside `component-home-hero.css`:
```css
/* Hero-only CTA: light cream button on dark hero background */
.home-hero .home-hero__cta.button {
  background-color: #f4efe7;
  color: #1f1c1a;
  border-color: #f4efe7;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.home-hero .home-hero__cta.button:hover {
  background-color: #ffffff;
  color: #1f1c1a;
  border-color: #ffffff;
}

/* Neutralise Dawn button pseudo-element shadows inside hero */
.home-hero .home-hero__cta.button::before,
.home-hero .home-hero__cta.button::after {
  box-shadow: none;
}
```

- Uses HORO brand cream (`#f4efe7`) as button background
- Dark obsidian (`#1f1c1a`) text for contrast
- Button shape (border-radius, padding) comes from Dawn's `.button` class — not overridden
- Scoped strictly to `.home-hero .home-hero__cta.button` so **other buttons outside the hero are unaffected**
- Pseudo-element shadow reset prevents Dawn's default button shadow from fighting the new background color

### 4. Mobile behavior (Task 4)

**Added mobile overrides** inside `@media screen and (max-width: 749px)`:
```css
/* Mobile: bottom-left */
.home-hero[data-position="bottom-left"] .home-hero__content {
  padding-inline: 2rem;
  padding-block-end: 4rem;
}

.home-hero[data-position="bottom-left"] .home-hero__text-wrapper {
  max-width: 32rem;
}

/* Mobile: bottom-right */
.home-hero[data-position="bottom-right"] .home-hero__content {
  padding-inline: 2rem;
  padding-block-end: 4rem;
}

.home-hero[data-position="bottom-right"] .home-hero__text-wrapper {
  max-width: 32rem;
}
```

- Reduced inline padding to `2rem` to avoid overflow on narrow viewports
- Reduced bottom padding to `4rem` for compact mobile hero height
- Capped text wrapper at `32rem` (down from `42rem`) so text does not hit screen edges
- Existing `home-hero__content` mobile padding (`max(3rem, env(safe-area-inset-bottom, 0px))`) still applies to all positions as a baseline

### 5. Theme editor compatibility (Task 5)

All existing position settings are preserved:
- `center-center` still centers content vertically and horizontally
- `bottom-center` still aligns content to the bottom, centered horizontally
- `bottom-left` now truly lower-left with robust alignment
- `bottom-right` now truly lower-right with robust alignment

No Liquid files modified. No section settings renamed or removed. The `data-position` attribute selector in CSS is what the theme editor's "Desktop content position" dropdown already sets.

---

## Safety checklist

| Rule | Status |
|---|---|
| No Dawn protected files touched | ✅ Confirmed |
| No checkout logic changed | ✅ Confirmed |
| No cart logic changed | ✅ Confirmed |
| No product form, variant picker, or price logic changed | ✅ Confirmed |
| No payment settings changed | ✅ Confirmed |
| No Liquid modified | ✅ Confirmed — only CSS |
| Existing scrim, grain, vignette, overlay-opacity logic preserved | ✅ Confirmed — untouched |
| RTL-safe logical properties used | ✅ Confirmed — `padding-inline`, `margin-block-start`, `margin-inline`, `text-align: start/end`, `align-items: flex-start/flex-end` |
| Mobile responsiveness preserved | ✅ Confirmed — mobile overrides added |
| No huge hardcoded margins (e.g., 40rem) | ✅ Confirmed — uses `clamp()` and viewport-relative units |
| No reliance on Shopify section Custom CSS | ✅ Confirmed — all styles are in the CSS asset file |

---

## Theme check result

```
198 files inspected with 26 total offenses found across 11 files.
2 errors.
24 warnings.
```

**0 new HORO errors** introduced.  
**0 new HORO warnings** introduced.  

All existing errors/warnings are pre-existing and unrelated to the hero CSS.

---

## Manual test checklist

### Desktop (1440px)
- [ ] **Home hero with Desktop content position = Center**: Content centered, heading and CTA centered, CTA light cream button visible
- [ ] **Home hero with Desktop content position = Bottom center**: Content at bottom center, CTA centered
- [ ] **Home hero with Desktop content position = Bottom left**: Content at lower-left, text left-aligned, CTA left-aligned, good bottom spacing, does not cover model's face on centered lifestyle image
- [ ] **Home hero with Desktop content position = Bottom right**: Content at lower-right, text right-aligned, CTA right-aligned, good bottom spacing
- [ ] **CTA button visible on dark/lifestyle image**: Button appears as cream (`#f4efe7`) with dark text (`#1f1c1a`)
- [ ] **CTA hover**: Button turns white (`#ffffff`) on hover
- [ ] **No horizontal overflow** on any position

### Mobile (375px)
- [ ] **Home hero with Desktop content position = Bottom left**: Content lower-left, padding comfortable, text wrapper capped at 32rem, safe-area padding works on iPhone
- [ ] **Home hero with Desktop content position = Bottom right**: Content lower-right, same comfort checks
- [ ] **No horizontal overflow**
- [ ] **CTA button visible and tappable**

### Commerce safety
- [ ] **Add to cart still works** from product page
- [ ] **Cart still works** (quantity change, remove, checkout)
- [ ] **Variant picker still works**

### RTL (Arabic)
- [ ] **Bottom left**: Content starts at inline-start (right side in RTL), text-align start
- [ ] **Bottom right**: Content ends at inline-end (left side in RTL), text-align end
- [ ] **No broken layouts**

---

## Next steps

1. **Push theme** (`shopify theme push`) to update the preview/live theme.
2. **Open theme editor** → Home Hero section → set "Desktop content position" to **Bottom left**.
3. **Remove any temporary Custom CSS** from the hero section's Custom CSS field (it is now redundant and may conflict).
4. **Run manual checklist** above.
5. **Stop here.** Phase 1.6c not started.
