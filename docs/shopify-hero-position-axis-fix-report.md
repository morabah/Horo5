# HORO Shopify Hero Position Axis Fix

> **Date**: 2026-05-04  
> **Branch**: `medusa`  
> **File**: `shopify-theme/assets/component-home-hero.css`

---

## Problem

The previous hero position fix (commit `f6b4f8a`) used reversed flex axes for the bottom-left position:

```css
/* WRONG — places content at top-right (or top-left) */
.home-hero[data-position="bottom-left"] .home-hero__content {
  align-items: flex-start;      /* vertical = top */
  justify-content: flex-end;     /* horizontal = right */
}
```

In a normal `display: flex` row container:
- `justify-content` controls **horizontal** position (main axis)
- `align-items` controls **vertical** position (cross axis)

So `bottom-left` needs `justify-content: flex-start` (left) + `align-items: flex-end` (bottom), not the reverse.

Additionally, the previous implementation relied on `.home-hero` being a flex parent (`display: flex; align-items: center`) to position `.home-hero__content`. This limited positioning to the parent's flex alignment and did not let content truly fill the hero area for proper quadrant-based positioning.

---

## Files changed

| # | File | Lines changed |
|---|---|---|
| 1 | `shopify-theme/assets/component-home-hero.css` | `.home-hero`, `.home-hero__content`, position rules, mobile |

---

## What changed

### 1. Hero container

**Before**:
```css
.home-hero {
  position: relative;
  min-height: 60rem;
  display: flex;
  align-items: center;
  overflow: hidden;
}
```

**After**:
```css
.home-hero {
  position: relative;
  min-height: 60rem;
  overflow: hidden;
}
```

Removed `display: flex` and `align-items: center` from `.home-hero`. The content is now absolutely positioned and no longer participates in the parent's flex flow.

### 2. Content overlay — absolute fill

**Before**:
```css
.home-hero__content {
  position: relative;
  z-index: 10;
  display: flex;
  padding-block: 4rem;
  padding-inline: var(--page-width-margin);
}
```

**After**:
```css
.home-hero__content {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  width: 100%;
  max-width: var(--page-width);
  margin-inline: auto;
  box-sizing: border-box;
  padding-inline: clamp(2rem, 6vw, 8rem);
  padding-block: 4rem;
}
```

- `position: absolute; inset: 0` fills the entire hero area
- `max-width: var(--page-width)` + `margin-inline: auto` preserves Dawn page-width centering behavior
- `box-sizing: border-box` ensures padding doesn't expand beyond max-width
- `padding-inline: clamp(2rem, 6vw, 8rem)` gives fluid horizontal padding across all positions

### 3. Corrected position axes

| Position | `justify-content` (horizontal) | `align-items` (vertical) | Result |
|---|---|---|---|
| `center-center` | `center` | `center` | Dead center |
| `bottom-center` | `center` | `flex-end` | Bottom edge, centered |
| `bottom-left` | `flex-start` | `flex-end` | Bottom-left quadrant |
| `bottom-right` | `flex-end` | `flex-end` | Bottom-right quadrant |

**Before (broken bottom-left)**:
```css
.home-hero[data-position="bottom-left"] .home-hero__content {
  align-items: flex-start;      /* top — WRONG */
  justify-content: flex-end;     /* right — WRONG */
}
```

**After (fixed bottom-left)**:
```css
.home-hero[data-position="bottom-left"] .home-hero__content {
  align-items: flex-end;        /* bottom */
  justify-content: flex-start;   /* left */
  text-align: start;
  padding-block-end: clamp(4rem, 9vh, 8rem);
}
```

**After (fixed bottom-right)** — was already correct but cleaned up:
```css
.home-hero[data-position="bottom-right"] .home-hero__content {
  align-items: flex-end;        /* bottom */
  justify-content: flex-end;     /* right */
  text-align: end;
  padding-block-end: clamp(4rem, 9vh, 8rem);
}
```

### 4. Text-wrapper alignment per position

Added explicit `align-items` on `.home-hero__text-wrapper` for each position to control the CTA's cross-axis alignment inside the column flex container:

| Position | `.home-hero__text-wrapper` | Effect |
|---|---|---|
| `center-center` | `align-items: center` | Heading + CTA centered |
| `bottom-center` | `align-items: center` | Heading + CTA centered |
| `bottom-left` | `align-items: flex-start` | Heading + CTA left-aligned |
| `bottom-right` | `align-items: flex-end` | Heading + CTA right-aligned |

### 5. Mobile

Mobile overrides remain unchanged from the previous fix:
- `padding-inline: 2rem`
- `padding-block-end: 4rem` for bottom positions
- `max-width: 32rem` for text wrapper
- No horizontal overflow

### 6. Hero CTA cream style

Unchanged from previous fix:
```css
.home-hero .home-hero__cta.button {
  background-color: #f4efe7;
  color: #1f1c1a;
  border-color: #f4efe7;
}
```

---

## Safety

| Rule | Status |
|---|---|
| No Liquid files modified | ✅ |
| No JSON templates modified | ✅ |
| No settings_data.json modified | ✅ |
| No CSS/JS files other than hero touched | ✅ |
| No checkout/cart/product logic modified | ✅ |
| No Dawn protected files touched | ✅ |
| Existing scrim/grain/vignette preserved | ✅ |
| RTL-safe logical properties preserved | ✅ |

---

## Theme check result

```
198 files inspected with 26 total offenses found across 11 files.
2 errors.
24 warnings.
```

**0 new errors** introduced.  
**0 new warnings** introduced.

All existing errors/warnings are pre-existing and unrelated to the hero CSS.

---

## Manual test checklist

### Desktop (1440px)
- [ ] **center-center**: Content is dead center, both horizontally and vertically
- [ ] **bottom-center**: Content is at bottom edge, horizontally centered
- [ ] **bottom-left**: Content is at bottom-left, text left-aligned, CTA left-aligned
- [ ] **bottom-right**: Content is at bottom-right, text right-aligned, CTA right-aligned
- [ ] **CTA button visible on dark/lifestyle image**: Cream button (`#f4efe7`) with dark text
- [ ] **CTA hover**: Button turns white on hover
- [ ] **No horizontal overflow**
- [ ] **Scrim/grain/vignette layers still render**

### Mobile (375px)
- [ ] **bottom-left**: Content at lower-left, padding comfortable, no overflow
- [ ] **bottom-right**: Content at lower-right, padding comfortable, no overflow
- [ ] **Text wrapper max-width capped at 32rem**
- [ ] **CTA button tappable**

### Commerce safety
- [ ] **Add to cart works**
- [ ] **Cart works**
- [ ] **Variant picker works**

### RTL (Arabic)
- [ ] **bottom-left**: Content at inline-start (right side in RTL)
- [ ] **bottom-right**: Content at inline-end (left side in RTL)
- [ ] **Text alignment correct**

---

## Next steps

1. **Push theme** to update preview/live.
2. **Open theme editor** → Home Hero → set "Desktop content position" to **Bottom left**.
3. **Verify** checklist above on desktop + mobile.
4. **Stop here.** Do not proceed to Phase 1.6c.
