# HORO Shopify Phase 1.6 — Visual Alignment Plan

> **Date**: 2026-05-04  
> **Status**: Audit complete. No code changes yet.  
> **Goal**: Bridge the visual gap between the React/Vercel storefront (`web-next`) and the Shopify Dawn theme (`shopify-theme`).

---

## Current visual gap

The Shopify theme is functionally complete but visually reads as a **generic Dawn store** rather than the **editorial HORO brand**. The React storefront (`horo5.vercel.app`) has a distinctive identity: warm papyrus backgrounds, obsidian ink text, clay-action CTAs, fine-grained typography, layered hero scrims, and rounded editorial cards. The Shopify theme inherits Dawn's default color schemes, typography, and spacing, which creates a noticeable disconnect.

| Area | React/Vercel feel | Shopify/Dawn feel | Gap severity |
|---|---|---|---|
| **Page background** | Warm papyrus `#f4efe7` | Pure white `#FFFFFF` (scheme-1) | **High** |
| **Body text** | Obsidian `#1f1c1a` on papyrus | `#121212` on white | Medium |
| **Buttons** | Rounded (md), clay/ember fill, hover inversion | Square (radius 0), generic Dawn fill | **High** |
| **Hero** | Full-bleed lifestyle + 3-layer scrim + grain + vignette + bottom-left copy | Single black overlay + centered text | **High** |
| **Cards** | 18px radius, subtle stone borders, hover lift, editorial labels | Dawn `var(--border-radius)` (0), no borders | **High** |
| **Typography** | Avenir Next, fine scale (`clamp()`), uppercase tracking labels | Assistant, Dawn scale | **High** |
| **Trust ribbon** | Inline muted badges with 14px icons | Block list with 18px icons | Medium |
| **Primary routes** | Large 16:9 images with overlay text | 4:5 images with text below | Medium |
| **Mobile hero** | Mantra grid ("WEAR WHAT YOU FEEL") | Standard centered heading | Medium |
| **Section dividers** | `border-t border-stone/20` separators | No separators, Dawn spacing | Low |

---

## What Vercel does differently

### 1. Color system (Brand Guidelines v2.6 §3.3)

| Token | Hex | Role |
|---|---|---|
| Papyrus / Chalk | `#f4efe7` | Page background, card background |
| Linen | `#e6ddd1` | Alternate section background |
| Obsidian / Ink | `#1f1c1a` | Headlines, dark text |
| Warm Charcoal | `#4b4641` | Body text, captions |
| Clay Action / Ember | `#b77a67` | Primary CTA buttons |
| Deep Teal / River | `#556f73` | Secondary links, info |
| Desert Sand / Moon Gold | `#c5a15c` | Borders, hover states, badges |
| Stone | `#d4ccc0` | Dividers, disabled states |
| Dusk Violet | `#6a5b76` | Feeling accent (emotions) |

### 2. Typography

- **Font family**: `Avenir Next, Segoe UI, Helvetica Neue, Arial, sans-serif`
- **Headlines**: Semibold, tight tracking (`tracking-tight`), leading `1.18`
- **Labels**: 12px, uppercase, `tracking-[0.2em]`, semibold
- **Body**: 17px, line-height 1.65
- **Scale**: Uses `clamp()` for fluid sizing across breakpoints
- **Editorial hierarchy**: Eyebrow label → Headline → Body → CTA

### 3. Hero treatment (`HomeHeroWearMean` / `HomeHeroExplosive`)

- **Layout**: `min-h-svh` (100% small viewport height)
- **Image**: Absolute full-bleed, `object-cover`, with `object-position` tuning
- **Scrim layers**:
  1. Base gradient: `linear-gradient(180deg, rgba(9,10,8,0.35) 0%, rgba(9,10,8,0.2) 35%, rgba(9,10,8,0.45) 100%)`
  2. Mobile top gradient: `from-black/65 via-black/25 to-transparent` (34% height)
  3. Bottom gradient: `from-black/50 to-transparent` (22% height)
- **Grain texture**: CSS noise/grain overlay (class `hero-bleed-grain`)
- **Vignette**: Edge darkening overlay
- **Copy position**: Bottom-left, `max-w-[48ch]`, left-aligned
- **CTAs**: Primary = solid clay on dark, secondary = ghost underline
- **Mobile**: "WEAR WHAT YOU FEEL" mantra grid (2×2 large text at top) + promise line at bottom

### 4. Cards and grids

- **Feeling cards**: `aspect-[1/1.1]`, `rounded-[18px]`, `bg-obsidian`, white text, image cover, hover `-translate-y-0.5`
- **Occasion cards**: `rounded-[18px]`, `border border-stone/55`, `bg-white/82`, accent left border strip, shadow `[0_18px_44px_-30px_rgba(26,26,26,0.2)]`
- **Primary routes**: Large image with overlay text, editorial layout
- **Gift block**: `aspect-[4/3]` image, `rounded-[18px]`, two-column editorial

### 5. Trust ribbon

- Inline flex layout, small 14px SVG icons
- Muted opacity (55%), no background card
- Labels: "Artist-made design", "Printed in Egypt", "COD available", etc.

### 6. Buttons

- **Primary**: `rounded-md`, `bg-[#f5f0e6]` (light), `text-[#2a2d26]` (dark), hover `bg-white`
- **Secondary/ghost**: Underline, transparent background, hover color change
- **Clay CTA**: `bg-obsidian`, white text, hover `bg-obsidian/90`
- Minimum height: 44–48px (touch-friendly)

---

## What Shopify currently does

### 1. Color system (Dawn defaults)

| Scheme | Background | Text | Notes |
|---|---|---|---|
| scheme-1 | `#FFFFFF` | `#121212` | Used for most sections |
| scheme-2 | `#F3F3F3` | `#121212` | Cards, featured collection |
| scheme-3 | `#242833` | `#FFFFFF` | Dark accent |
| scheme-4 | `#121212` | `#FFFFFF` | Inverse |
| scheme-5 | `#334FB4` | `#FFFFFF` | Sale badges |

**Problem**: None of these are the HORO brand colors. The theme editor allows overriding, but the defaults are jarringly different.

### 2. Typography

- **Font**: `Assistant` (Google Font, Dawn default)
- **Heading scale**: 100% (Dawn default)
- **Body scale**: 100% (Dawn default)
- **No editorial labels**: No 12px uppercase tracking pattern

### 3. Hero treatment (`home-hero.liquid`)

- **Layout**: `min-height: 60rem` (desktop), `40rem` (mobile)
- **Image**: Absolute full-bleed, `object-fit: cover`
- **Overlay**: Single `::after` pseudo-element with black background + opacity slider (default 30%)
- **Copy position**: Configurable (center-center, bottom-center, bottom-left, bottom-right)
- **CTA**: Dawn `.button` class (square corners by default)
- **Mobile**: Same centered layout, no mantra grid

### 4. Cards and grids

- **Feeling/occasion cards**: `var(--border-radius)` (0 by default), `aspect-ratio: 4/5`, no border, no shadow
- **Primary routes**: 3-column grid, `aspect-ratio: 4/5`, text below image
- **Hover**: `translateY(-0.3rem)` + `box-shadow: 0 0.4rem 1rem rgba(0,0,0,0.1)`

### 5. Trust ribbon (`product-trust-strip.liquid`)

- Block list layout, 18px SVG icons
- Uses Dawn `.page-width` container
- No inline muted style

### 6. Buttons

- **Dawn default**: `buttons_radius: 0` (square), `buttons_border_thickness: 1`
- **Style**: `.button--primary` / `.button--secondary` (Dawn classes)
- No clay/ember brand color mapping

---

## Root causes

### 1. Dawn color schemes are generic
The `settings_data.json` presets use Dawn's default colors. Shopify Admin allows overriding these in the theme editor, but the defaults create a generic look. There is no built-in "HORO Brand" color scheme.

### 2. Font mismatch
Dawn defaults to `Assistant` (a Google Font). HORO brand uses `Avenir Next` (a system/proprietary font). Shopify can load Google Fonts but not Avenir Next without a license/upload. The closest free alternative is `Inter` or `Segoe UI`.

### 3. Hero lacks layered visual treatment
The Shopify hero has a single overlay. The React hero has 4+ visual layers (base gradient, mobile top gradient, bottom gradient, grain, vignette). These are CSS effects that can be added to `component-home-hero.css` without touching Dawn protected files.

### 4. Card radius and styling
Dawn's `buttons_radius: 0` and card `border-radius: 0` (derived from button radius in Dawn) create sharp corners. The React design uses 18px radius for cards and rounded-md for buttons. This can be fixed by updating theme settings in the editor or overriding CSS.

### 5. Editorial typography patterns missing
The React design uses a distinctive "eyebrow → headline → body → CTA" pattern with 12px uppercase tracking labels. The Shopify sections lack this hierarchy. This requires Liquid/CSS updates to the custom sections.

### 6. Missing images and content
Both storefronts look empty without data, but the React app has fallback/placeholder logic that makes it feel more intentional. The Shopify theme shows gray placeholder SVGs which look broken.

---

## Must-fix visual settings (before soft launch)

These are **theme editor configuration changes** that do not require code modifications.

| # | Setting | Current | Target | Location |
|---|---|---|---|---|
| 1 | **scheme-1 background** | `#FFFFFF` | `#f4efe7` (Papyrus) | Theme editor → Colors → Scheme 1 |
| 2 | **scheme-1 text** | `#121212` | `#1f1c1a` (Obsidian) | Theme editor → Colors → Scheme 1 |
| 3 | **scheme-2 background** | `#F3F3F3` | `#e6ddd1` (Linen) | Theme editor → Colors → Scheme 2 |
| 4 | **scheme-2 text** | `#121212` | `#1f1c1a` (Obsidian) | Theme editor → Colors → Scheme 2 |
| 5 | **Button radius** | `0` | `8` or `12` | Theme editor → Buttons → Corner radius |
| 6 | **Card radius** | `0` | `16` or `18` | Theme editor → Cards → Corner radius |
| 7 | **Page width** | `1200` | `1440` or keep `1200` | Theme editor → Layout |
| 8 | **Font** | `Assistant` | `Inter` or `Segoe UI` | Theme editor → Typography |
| 9 | **Heading scale** | `100` | `90` or `100` | Theme editor → Typography |
| 10 | **Body scale** | `100` | `100` | Theme editor → Typography |
| 11 | **Hero image** | Placeholder SVG | Upload lifestyle hero | Theme editor → Home Hero |
| 12 | **Primary route images** | Placeholder SVGs | Upload 3 editorial images | Theme editor → Primary Routes |
| 13 | **Featured collection** | "all" collection | Select curated collection | Theme editor → Featured Collection |

---

## Missing image/assets checklist

| Asset | Dimensions | Format | Where to upload |
|---|---|---|---|
| Homepage hero image | 1920×1080 min, 3840×2160 ideal | JPG | Theme editor → Home Hero |
| Primary route image 1 (Feelings) | 1100×1100 | JPG/PNG | Theme editor → Primary Routes → Block 1 |
| Primary route image 2 (Occasions) | 1100×1100 | JPG/PNG | Theme editor → Primary Routes → Block 2 |
| Primary route image 3 (Gifts/All) | 1100×1100 | JPG/PNG | Theme editor → Primary Routes → Block 3 |
| Feeling card images | 1100×1100 | JPG | Metaobject entries → `feeling.card_image` |
| Occasion card images | 1100×1100 | JPG | Metaobject entries → `occasion.card_image` |
| Collection hero images | 1920×600 | JPG | Metaobject entries → `feeling.hero_image` / `occasion.hero_image` |
| Product images | 1024×1024 min | JPG | Product media |
| Artist avatar | 500×500 | JPG | Metaobject entries → `artist.avatar_image` |
| Logo | SVG or PNG | — | Theme editor → Logo |
| Favicon | 32×32 | PNG | Settings → Favicon |

---

## Recommended Shopify color scheme mapping

To match the React brand system within Dawn's 5-scheme limit:

| Scheme | Purpose | Background | Text | Button | Button Label | Secondary Button Label |
|---|---|---|---|---|---|---|
| **scheme-1** | Default page, feeling grid | `#f4efe7` | `#1f1c1a` | `#1f1c1a` | `#f4efe7` | `#1f1c1a` |
| **scheme-2** | Occasion grid, cards, featured | `#e6ddd1` | `#1f1c1a` | `#1f1c1a` | `#e6ddd1` | `#1f1c1a` |
| **scheme-3** | Dark accent (trust ribbon bg) | `#242833` | `#ffffff` | `#ffffff` | `#242833` | `#ffffff` |
| **scheme-4** | Inverse / footer | `#1f1c1a` | `#ffffff` | `#ffffff` | `#1f1c1a` | `#ffffff` |
| **scheme-5** | CTA / accent (ember) | `#b77a67` | `#ffffff` | `#ffffff` | `#b77a67` | `#ffffff` |

**Note**: Dawn button colors are mapped to the scheme's `button` and `button_label` colors. To get a clay-colored button, assign `scheme-5` to a section. For a dark button on light background, use `scheme-1`.

**Shadow**: Set all scheme shadows to `#1f1c1a` (Obsidian) for consistency.

---

## Recommended typography mapping

Dawn does not support `clamp()` or custom font stacks natively. Recommendations:

| Element | React value | Shopify approach |
|---|---|---|
| **Heading font** | `Avenir Next` | Change to `Inter` (Google Font, similar geometric sans) or keep `Assistant` if preferred |
| **Body font** | `Avenir Next` | Same as heading |
| **Heading scale** | Fluid `clamp()` | Set Dawn heading scale to `90` or `100`; custom CSS can add fluid sizing later |
| **Body scale** | `17px` | Set Dawn body scale to `100` (≈16px); add `font-size: 1.7rem` override in custom CSS if needed |
| **Eyebrow labels** | 12px uppercase tracking | Not in Dawn. Add via custom CSS to `.home-feeling-grid__subheading` etc. |

**Font recommendation**: `Inter` (Google Fonts) is the closest free alternative to Avenir Next with similar x-height and geometric feel. Load via Dawn's built-in Google Font picker.

---

## Hero alignment options

### Option A: Keep current Shopify hero, enhance with CSS

**Effort**: Low (CSS only)  
**Risk**: Low  
**Result**: Better, but not identical to React

Changes to `component-home-hero.css`:
- Add multi-layer gradient scrim (base + bottom)
- Add grain texture overlay (CSS noise or SVG data URI)
- Add vignette edge darkening
- Adjust default content position to `bottom-left`
- Increase mobile min-height to `50rem`

**Pros**: Safe, no Liquid changes, preserves Dawn commerce patterns.  
**Cons**: Still won't have the mantra grid mobile layout or exact React feel.

### Option B: Rebuild hero Liquid to match `HomeHeroWearMean`

**Effort**: Medium (Liquid + CSS)  
**Risk**: Medium — more custom code to maintain  
**Result**: Close to React feel

Changes to `home-hero.liquid`:
- Add `gradient` divs for layered scrim
- Add `grain` div for texture
- Add `vignette` div
- Restructure text wrapper for bottom-left alignment
- Add mobile mantra grid conditional (4 words in 2×2 grid)

**Pros**: Closer to brand target.  
**Cons**: More custom markup, harder to edit in theme editor, may conflict with Dawn color scheme system.

### Recommendation for Phase 1

**Choose Option A (CSS enhancement)**. The current hero is functional and editable in the theme editor. Adding CSS layers (gradient, grain, vignette) gets 80% of the way there without breaking the editor experience. The mantra grid is a nice-to-have for Phase 2.

---

## Product/card styling recommendations

### Feeling/Occasion cards

| Property | Current (Dawn) | Target (React) | How to achieve |
|---|---|---|---|
| **Border radius** | `0` (from `--border-radius`) | `18px` | Set **Cards → Corner radius** to `16` or `18` in theme editor |
| **Background** | `var(--gradient-background)` (transparent) | `bg-obsidian` on feeling cards | Assign `scheme-4` to feeling grid section for dark cards |
| **Border** | None | `1px solid rgba(212,204,192,0.55)` | Add CSS to `component-home-feeling-grid.css` |
| **Shadow** | None | `0 18px 44px -30px rgba(26,26,26,0.2)` | Add CSS |
| **Hover** | `translateY(-0.3rem)` | `translateY(-0.3rem)` | Already close; keep |
| **Aspect ratio** | `4/5` | `1/1.1` (feeling), custom (occasion) | Update CSS |
| **Text below image** | Yes | Yes (feeling), overlay (occasion) | Occasion cards need CSS overlay treatment |

### Primary routes cards

| Property | Current | Target | How to achieve |
|---|---|---|---|
| **Aspect ratio** | `4/5` | `16/9` | Update CSS in `component-home-primary-routes.css` |
| **Text position** | Below image | Overlay on image | Add CSS overlay + text styling |
| **Image treatment** | Standard cover | Darkened with text | Add gradient overlay in CSS |

### Trust ribbon

| Property | Current | Target | How to achieve |
|---|---|---|---|
| **Layout** | Block list | Inline flex | Update CSS in `component-product-trust-strip.css` |
| **Icon size** | `18px` | `14px` | Update CSS |
| **Opacity** | `1` | `0.55` | Update CSS |
| **Background** | Section bg | Transparent / muted | Update CSS |

---

## Mobile recommendations

| Issue | React behavior | Shopify behavior | Fix |
|---|---|---|---|
| **Hero text** | Mantra grid (2×2 large words) at top on mobile | Standard centered heading below image | Add CSS/media query for mantra layout (Phase 2) |
| **Hero height** | `min-h-svh` (100vh) | `min-height: 40rem` | Increase to `50rem` or `60rem` in CSS |
| **Card columns** | 2 columns on mobile | 2 columns (feeling), 1 column (routes) | Feeling grid OK; routes should be 1 column |
| **Safe areas** | `env(safe-area-inset-*)` used | Not used | Add `padding` with safe-area insets to hero CSS |
| **Font sizing** | Fluid `clamp()` | Fixed rem | Add `clamp()` to hero heading/subheading in CSS |

---

## Implementation priorities

### Phase 1.6a — Must fix before soft launch (config only)

| # | Task | Effort | Risk |
|---|---|---|---|
| 1 | Update color schemes 1–5 in theme editor to HORO brand colors | 10 min | None |
| 2 | Set button radius to `8` or `12` | 2 min | None |
| 3 | Set card radius to `16` or `18` | 2 min | None |
| 4 | Change font to `Inter` (or preferred alternative) | 2 min | None |
| 5 | Upload hero image and 3 primary route images | 15 min | None |
| 6 | Verify all HORO sections use appropriate color scheme | 5 min | None |
| 7 | Set page width to `1440` if desired | 1 min | None |

### Phase 1.6b — Should fix after first content test (CSS only)

| # | Task | Effort | Risk |
|---|---|---|---|
| 8 | Add multi-layer hero scrim (gradient + bottom fade) to `component-home-hero.css` | 30 min | Low |
| 9 | Add grain/vignette overlay to hero CSS | 20 min | Low |
| 10 | Adjust hero default content position to `bottom-left` | 5 min | Low |
| 11 | Increase mobile hero min-height | 5 min | Low |
| 12 | Update card aspect ratios and borders in grid CSS files | 30 min | Low |
| 13 | Adjust trust ribbon to inline muted style | 15 min | Low |
| 14 | Update primary routes to 16:9 aspect + overlay text | 30 min | Low |
| 15 | Add `border-top` section separators to grid CSS | 10 min | Low |

### Phase 1.6c — Nice to have after launch (deeper changes)

| # | Task | Effort | Risk |
|---|---|---|---|
| 16 | Add mobile mantra grid to hero Liquid | 2 hours | Medium |
| 17 | Rebuild occasion cards with left accent border strip | 1 hour | Low |
| 18 | Add editorial eyebrow labels to section headings | 1 hour | Low |
| 19 | Implement fluid `clamp()` typography scale | 2 hours | Medium |
| 20 | Add hover color inversion to buttons | 30 min | Low |
| 21 | Add grain texture to non-hero sections (optional) | 1 hour | Low |

### Do not do now

| Task | Reason |
|---|---|
| Replace Dawn's entire button system | Too risky, breaks checkout patterns |
| Replace Dawn's card system | Too much CSS, maintenance burden |
| Add custom font loading (Avenir Next) | Licensing issue, use Google Fonts instead |
| Rewrite hero as full React-like component | Overkill for Phase 1, editor usability suffers |
| Add JavaScript animations | Not needed for MVP, Dawn has scroll-trigger |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Color scheme overrides break Dawn components** | Medium | Medium | Test cart, checkout, product form after changing schemes |
| **Card radius change affects all Dawn cards** | High | Low | Acceptable — improves all cards |
| **Button radius change affects all Dawn buttons** | High | Low | Acceptable — improves all buttons |
| **Font change causes layout shifts** | Low | Medium | Test on mobile, adjust scale if needed |
| **Hero CSS layers conflict with theme editor overlay slider** | Low | Low | Keep editor slider low (10–20%) and let CSS handle the rest |
| **Grain texture hurts performance on low-end devices** | Low | Low | Use CSS `noise` or tiny SVG, not large image |
| **Too many CSS changes create maintenance debt** | Medium | Medium | Document all changes, keep changes scoped to `component-*.css` |

---

## Final recommendation

### Immediate action (this week)

1. **Apply Phase 1.6a** in the Shopify theme editor. This is 30 minutes of work and transforms the store from "generic Dawn" to "HORO-branded."
2. **Upload all images** (hero, primary routes, feeling/occasion card images, product images).
3. **Populate metaobjects and collections** (Phase 1.5 checklist).
4. **Retest the homepage** on desktop and mobile.

### Short-term action (next 1–2 weeks)

5. **Apply Phase 1.6b** CSS enhancements. These are safe, scoped changes to HORO-specific CSS files that bring the visual quality closer to the React target without touching Dawn core.
6. **Run a second visual QA** comparing Shopify to Vercel screenshots.

### Post-launch action

7. **Apply Phase 1.6c** enhancements after the store is live and stable. These are polish items that improve the brand feel but are not blockers.
8. **Consider a full headless migration** (React/Vercel + Shopify Storefront API) if the Dawn customization ceiling is reached. The React storefront is already built and could be the long-term target.

### Key principle

> **Preserve Shopify commerce safety over pixel-perfect brand matching.** The Dawn checkout, cart, product form, and variant picker are battle-tested. Changing them risks conversion. All visual alignment should be additive (CSS layers, color schemes, images) rather than destructive (replacing Dawn components).

The Shopify theme is **80% functionally aligned** and can reach **80% visually aligned** with Phase 1.6a + 1.6b. The remaining 20% (mantra grid, exact typography scale, grain everywhere) is headless territory and should be deferred to a future platform decision.
