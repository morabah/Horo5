# HORO Shopify Settings Data Brand Baseline

> **Date**: 2026-05-04  
> **Branch**: `medusa`  
> **File**: `shopify-theme/config/settings_data.json`  
> **Store**: horo-9109.myshopify.com

---

## Problem

Full Shopify theme pushes (`shopify theme push`) currently overwrite Shopify Admin theme settings because `config/settings_data.json` contained default Dawn-like color values (white backgrounds, `#121212` text, blue accent). Every push reset the store to unbranded defaults, requiring manual re-configuration in the Admin after each deploy.

This baseline codifies the HORO brand identity into `settings_data.json` so that **theme pushes preserve brand colors, typography, and component styling** without requiring post-push Admin reconfiguration.

---

## File changed

| # | File | Lines changed | Purpose |
|---|---|---|---|
| 1 | `config/settings_data.json` | Color schemes × 5, radius × 6, borders × 4, shadows × 2, card schemes × 2 | Brand baseline in code |

---

## Color scheme changes

### scheme-1 — Papyrus (default light)

| Token | Before (Dawn) | After (HORO) |
|---|---|---|
| `background` | `#FFFFFF` | `#F4EFE7` |
| `text` | `#121212` | `#1F1C1A` |
| `button` | `#121212` | `#1F1C1A` |
| `button_label` | `#FFFFFF` | `#F4EFE7` |
| `secondary_button_label` | `#121212` | `#1F1C1A` |
| `shadow` | `#121212` | `#1F1C1A` |

### scheme-2 — Linen (alternate light)

| Token | Before (Dawn) | After (HORO) |
|---|---|---|
| `background` | `#F3F3F3` | `#E6DDD1` |
| `text` | `#121212` | `#1F1C1A` |
| `button` | `#121212` | `#1F1C1A` |
| `button_label` | `#F3F3F3` | `#E6DDD1` |
| `secondary_button_label` | `#121212` | `#1F1C1A` |
| `shadow` | `#121212` | `#1F1C1A` |

### scheme-3 — Deep Blue (dark accent)

| Token | Before (Dawn) | After (HORO) |
|---|---|---|
| `background` | `#242833` | `#242833` (unchanged) |
| `text` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button_label` | `#000000` | `#242833` |
| `secondary_button_label` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `shadow` | `#121212` | `#1F1C1A` |

### scheme-4 — Obsidian (dark)

| Token | Before (Dawn) | After (HORO) |
|---|---|---|
| `background` | `#121212` | `#1F1C1A` |
| `text` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button_label` | `#121212` | `#1F1C1A` |
| `secondary_button_label` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `shadow` | `#121212` | `#1F1C1A` |

### scheme-5 — Clay/Ember (warm accent)

| Token | Before (Dawn) | After (HORO) |
|---|---|---|
| `background` | `#334FB4` | `#B77A67` |
| `text` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `button_label` | `#334FB4` | `#B77A67` |
| `secondary_button_label` | `#FFFFFF` | `#FFFFFF` (unchanged) |
| `shadow` | `#121212` | `#1F1C1A` |

---

## Typography, radius, and card changes

| Setting | Before | After | Rationale |
|---|---|---|---|
| `type_header_font` | `assistant_n4` | `assistant_n4` | No change — Inter requires theme schema update |
| `type_body_font` | `assistant_n4` | `assistant_n4` | No change — Inter requires theme schema update |
| `heading_scale` | `100` | `100` | Unchanged |
| `body_scale` | `100` | `100` | Unchanged |
| `buttons_radius` | `0` | `12` | Rounded editorial buttons |
| `inputs_radius` | `0` | `8` | Softer form inputs |
| `card_corner_radius` | `0` | `18` | Editorial card rounding (matches HORO React) |
| `collection_card_corner_radius` | `0` | `18` | Consistent with product cards |
| `blog_card_corner_radius` | `0` | `18` | Consistent with product cards |
| `media_radius` | `0` | `12` | Slightly rounded media images |
| `text_boxes_radius` | `0` | `12` | Softer text box corners |
| `popup_corner_radius` | `0` | `12` | Softer popup corners |
| `card_border_thickness` | `0` | `1` | Subtle card border |
| `collection_card_border_thickness` | `0` | `1` | Subtle collection card border |
| `card_shadow_opacity` | `0` | `8` | Light editorial shadow |
| `collection_card_shadow_opacity` | `0` | `8` | Light editorial shadow |
| `card_color_scheme` | `scheme-2` | `scheme-1` | Papyrus default for product cards |
| `collection_card_color_scheme` | `scheme-2` | `scheme-1` | Papyrus default for collection cards |
| `sale_badge_color_scheme` | `scheme-5` | `scheme-5` | Unchanged — Clay/Ember accent |
| `sold_out_badge_color_scheme` | `scheme-3` | `scheme-3` | Unchanged — Deep Blue accent |
| `cart_type` | `notification` | `notification` | Unchanged — drawer disabled |

---

## What is now code-controlled

Pushing `settings_data.json` will now **automatically set**:

- All 5 color schemes with HORO brand colors
- Button, input, card, collection card, blog card, media, text box, popup corner radius
- Card and collection card border thickness and shadow opacity
- Card and collection card default color scheme (Papyrus)
- Typography scale (100%)
- Cart type (notification drawer)

---

## What remains Admin-controlled

These are **not** in `settings_data.json` and remain editable via the Shopify Admin theme editor without being overwritten by pushes:

- Section-specific settings (hero image, hero overlay opacity, hero content position)
- Section ordering and visibility
- Menu assignments
- Page content
- Product/collection images and descriptions
- Metaobject/metafield content
- Custom CSS per section (500-char limit)
- App embed blocks

---

## How to deploy intentionally

### Deploy the brand baseline (including settings)

Use this when you want to **reset or update** the theme settings from the code baseline:

```bash
shopify theme push --store horo-9109.myshopify.com --theme THEME_ID
```

This pushes the full theme including `config/settings_data.json`, which will overwrite any Admin theme editor changes made since the last push.

**Use case**: Initial setup, re-branding, or recovering from accidental Admin misconfiguration.

---

### Deploy code changes while preserving Admin settings

Use this when you only want to push **code changes** (CSS, Liquid, JS) without overwriting the store's current Admin theme editor settings:

```bash
shopify theme push --store horo-9109.myshopify.com --theme THEME_ID --ignore config/settings_data.json --ignore "templates/*.json"
```

**Use case**: Day-to-day development where the merchant or designer has tuned settings in the Admin and you don't want to reset them.

---

### Deploy only the settings baseline

Use this to update **only** the brand settings without touching any other code:

```bash
shopify theme push --store horo-9109.myshopify.com --theme THEME_ID --only config/settings_data.json
```

**Use case**: Re-applying the brand baseline after someone made unwanted Admin changes.

---

## How to avoid accidental reset later

### Option A: Add `--ignore config/settings_data.json` to your default push command

For routine development pushes, always exclude `settings_data.json`:

```bash
shopify theme push --store horo-9109.myshopify.com --theme THEME_ID --ignore config/settings_data.json
```

This keeps the code in sync while preserving whatever settings the merchant/designer has set in the Admin.

### Option B: Document the baseline in your deployment runbook

Keep a checklist:

1. Does this push include brand changes? → **Include** `settings_data.json`
2. Is this a routine bug-fix/feature push? → **Exclude** `settings_data.json`
3. Are you setting up a new store/theme? → **Include** `settings_data.json`

### Option C: CI/CD pipeline conditional

In a CI/CD pipeline, use an environment variable or branch naming convention:

- Branch `main` or tag `release-*` → push full theme including settings
- Branch `feature/*` or `bugfix/*` → push with `--ignore config/settings_data.json`

---

## Safety checklist

| Rule | Status |
|---|---|
| Only `config/settings_data.json` modified | ✅ |
| No `templates/*.json` modified | ✅ |
| No Liquid files modified | ✅ |
| No CSS/JS files modified | ✅ |
| No checkout/cart/product logic modified | ✅ |
| No Dawn protected files touched | ✅ |
| Valid JSON confirmed | ✅ |
| Theme check: 0 new errors | ✅ |
| Theme check: 0 new warnings | ✅ |

---

## Theme check result

```
198 files inspected with 26 total offenses found across 11 files.
2 errors.
24 warnings.
```

**0 new errors** introduced.  
**0 new warnings** introduced.

All existing errors/warnings are pre-existing and unrelated to `settings_data.json`.

---

## Verification checklist (post-push)

- [ ] Open Shopify Admin → Online Store → Themes → Customize
- [ ] Navigate to **Theme settings** → **Colors**
- [ ] Verify scheme-1 background is `#F4EFE7` (Papyrus)
- [ ] Verify scheme-2 background is `#E6DDD1` (Linen)
- [ ] Verify scheme-5 background is `#B77A67` (Clay/Ember)
- [ ] Navigate to **Theme settings** → **Typography**
- [ ] Verify heading scale is 100
- [ ] Verify body scale is 100
- [ ] Navigate to **Theme settings** → **Buttons**
- [ ] Verify button corner radius is 12
- [ ] Navigate to **Theme settings** → **Cards**
- [ ] Verify product card corner radius is 18
- [ ] Verify collection card corner radius is 18
- [ ] Verify card border thickness is 1
- [ ] Verify card shadow opacity is 8
- [ ] Verify card color scheme is scheme-1 (Papyrus)
- [ ] Navigate to homepage preview
- [ ] Verify hero background is cream-toned (not white)
- [ ] Verify product cards have rounded corners and subtle borders
- [ ] Verify no visual regressions in cart/checkout
- [ ] **Optional**: Re-publish theme if it was a draft/preview

---

## Next steps

1. **Push the theme**:
   ```bash
   shopify theme push --store horo-9109.myshopify.com --theme THEME_ID
   ```
2. **Verify** the checklist above in the Shopify Admin theme editor.
3. **For future routine pushes**, use `--ignore config/settings_data.json` to preserve Admin settings.
4. **Stop here.** Do not proceed to Phase 1.6c.
