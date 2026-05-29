# HORO Theme Base

This theme is a customization of **Shopify Dawn**, not a from-scratch build. **Elegant Textures** and headless storefront are out of scope for this repo path.

## Base Version

| Field | Value |
|---|---|
| Theme | Shopify Dawn (branded HORO in theme editor) |
| Version | v15.4.1 |
| Commit | 9ccdacf81f175c7caeebc28348e50bcb02ef8fc7 |
| Source | https://github.com/Shopify/dawn/tree/v15.4.1 |
| Forked | 2026-05-03 |

## Purpose

HORO brand customization on top of Dawn. Extend, don't replace.
Preserve Dawn's product form, cart, gallery, variant picker, filters, accessibility,
and responsive image behavior.

## Data contract

**Canonical:** [docs/HORO_DATA_CONTRACT.md](docs/HORO_DATA_CONTRACT.md)

**Architecture (Option A + C):**

- Component snippets (`horo-product-card-meta`, `horo-product-proof-items`, etc.) own repeated markup and internal fallbacks.
- Sections use contract-compliant assigns; do **not** treat `{% render %}` as a shared state module.
- `horo-product-field.liquid` is for **scalar** fields only.

## Files That Must Never Be Modified

| File | Reason |
|---|---|
| `sections/main-product.liquid` | Product form, gallery, variant picker — no edits |
| `sections/main-cart-items.liquid` | Cart line items — no edits |
| `sections/main-cart-footer.liquid` | Cart footer — no structural edits |
| `snippets/price.liquid` | Price rendering |
| `snippets/product-variant-picker.liquid` | Variant picker |
| `snippets/product-media-gallery.liquid` | Media gallery |
| `snippets/facets.liquid` | Collection filters |
| Any checkout files | Checkout modification forbidden |
| `assets/base.css` existing rules | Only append, never modify |

## `snippets/card-product.liquid` — allowed amendment

| Allowed | Forbidden |
|---------|-----------|
| Replace inline HORO chip block with `{% render 'horo-product-card-meta', card_product: card_product %}` | Changing Dawn media, price, quick-add, variant picker, or accessibility behavior |

## Files Where Minimal Additions Are Allowed

| File | Allowed Scope |
|---|---|
| `config/settings_schema.json` | Append new HORO settings groups only |
| `locales/en.default.json` | Add `horo.*` keys only |
| `layout/theme.liquid` | Append font loading in `<head>`; script load audit per section |
| `assets/base.css` | Append `:lang(ar)` overrides at end only |
| `assets/global.js` | Append minimal gift-wrap logic at end only |
| JSON templates (`templates/*.json`) | Add/remove section references and blocks |

## How Custom UI Is Added

- **JSON template blocks**: Add custom sections and blocks via template JSON
- **New section files**: All HORO sections are new files in `sections/`
- **New snippet files**: All HORO snippets are new files in `snippets/`
- **New CSS files**: Each custom section gets its own `assets/component-*.css`
- **Never by editing Dawn section files** (except the single `card-product` hook above)

## Migration Plan Reference

- `docs/HORO_DATA_CONTRACT.md` — Metafields, metaobjects, Admin checklist
- `docs/shopify-migration-map-v2.1.md` — Revised migration plan (if present in repo root `doc/`)
