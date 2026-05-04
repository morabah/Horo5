# HORO Shopify Phase 1.6e — Full Page Gap Fill Report

## Objective

Audit and safely fill the remaining practical page-level gaps between the custom web/Medusa implementation and the Shopify Dawn-based HORO implementation. This phase intentionally excludes PDP data parity because Phase 1.6d already addressed it.

## Audit summary

Audited 15 page groups across Shopify vs. web/Medusa:

1. Homepage — close; deferred cinematic scroll (JS-heavy)
2. Feelings/Vibes hub — **must fix**: missing editorial guide + CTA
3. Feeling/Vibe collection — minor; verify descriptions
4. Occasions hub — **later**: same pattern as feelings hub
5. Occasion collection — minor
6. Gifts hub — **later**: same pattern as feelings hub
7. Cart page — **must fix**: missing trust explainer
8. Search page — **must fix**: missing recovery CTAs
9. About page — **must fix**: missing hero image, trust chips, CTA
10. FAQ page — **must fix**: missing support CTA
11. Exchange page — **must fix**: draft warning text
12. Size guide page — minor
13. Privacy/Terms/policy pages — **must fix**: content population checklist
14. 404 page — minor
15. Navigation/footer — **must fix**: menu structure documentation

## Files created

| File | Purpose |
|------|---------|
| `docs/shopify-full-page-gap-audit.md` | Full gap audit across 15 page groups |
| `shopify-theme/sections/search-support-links.liquid` | Recovery links on search results |
| `shopify-theme/assets/component-search-support-links.css` | Styles for search support links |
| `shopify-theme/sections/cart-trust-explainer.liquid` | Trust cards between cart items and footer |
| `shopify-theme/assets/component-cart-trust-explainer.css` | Styles for cart trust explainer |
| `shopify-theme/sections/feelings-editorial-guide.liquid` | Editorial intro below feelings hub |
| `shopify-theme/assets/component-feelings-editorial-guide.css` | Styles for feelings editorial guide |
| `docs/shopify-footer-policy-readiness-checklist.md` | Menu structure + policy page checklist |
| `docs/shopify-phase-1-6e-full-page-gap-fill-report.md` | This report |

## Files changed

| File | Change |
|------|--------|
| `shopify-theme/templates/page.exchange-policy-horo.json` | Replaced draft warning with final cautious wording |
| `shopify-theme/sections/page-faq-horo.liquid` | Added optional support CTA settings + markup |
| `shopify-theme/assets/component-horo-pages.css` | Added FAQ support CTA + About hero/trust/CTA styles |
| `shopify-theme/sections/page-about-horo.liquid` | Added hero image, subheading, trust point blocks, CTA |
| `shopify-theme/templates/search.json` | Added `search-support-links` after `main-search` |
| `shopify-theme/templates/cart.json` | Added `cart-trust-explainer` between gift-wrap and cart-footer |
| `shopify-theme/templates/page.feelings-hub.json` | Added `feelings-editorial-guide` after `feelings_hub` |

## Must-fix gaps addressed

| # | Page | Fix |
|---|------|-----|
| 1 | Exchange | Replaced draft warning with cautious wording |
| 2 | FAQ | Added optional support CTA block (heading, text, button, link) |
| 3 | About | Added hero image picker, subheading, trust point blocks (default 5), CTA |
| 4 | Search | Added static recovery links section below search results |
| 5 | Cart | Added 4-card trust explainer between cart items and footer |
| 6 | Feelings Hub | Added editorial guide section (eyebrow, heading, text, CTA) |
| 7 | Policy/Footer | Created checklist with main/footer menu recommendations and policy content tasks |

## Gaps intentionally deferred

- Homepage cinematic sticky scroll (JS-heavy)
- Search faceted filters + suggestions (requires JS-heavy rebuild)
- Collection immersive hero (minor visual gap)
- Enhanced branded 404 (minor UX improvement)
- PDP related products by feeling (API limitation)
- Cart bundle upsell logic (touches cart JS)
- Mobile sticky add-to-cart (touches product form)

## Product/PDP note

Phase 1.6d already handled PDP data parity via `product-purchase-context` and `product-details-accordions`. These sections were **not duplicated** in Phase 1.6e.

## Safety notes

- No checkout logic changed.
- No cart item logic, quantity, or remove logic changed.
- No product form, variant picker, buy buttons, or price logic changed.
- No payment or shipping settings changed.
- No JavaScript added. All changes are Liquid + CSS only.
- All new sections are optional and degrade gracefully if unconfigured.

## Theme check result

Command: `shopify theme check --path shopify-theme`

- **0 new HORO errors** from Phase 1.6e changes.
- **0 new HORO warnings** from Phase 1.6e changes.
- Baseline pre-existing warnings remain unchanged (gift-wrap variable naming, featured-product schema translations, orphaned snippets, undefined objects in existing sections).

## Manual test checklist

- [ ] Home — hero and sections render correctly
- [ ] Feelings — hub grid + editorial guide section render
- [ ] Collection — banner/hero + product grid render
- [ ] Product — PDP context + accordions still present from Phase 1.6d
- [ ] Cart — items + trust explainer + footer render
- [ ] Search — results + support links render
- [ ] About — hero image, heading, subheading, trust chips, CTA, content blocks render
- [ ] FAQ — accordion items + support CTA render
- [ ] Exchange — final wording displays, no draft warning
- [ ] Size Guide — table renders correctly
- [ ] Footer links — all policy links resolve
- [ ] Mobile 375px — no layout breakage on key pages
- [ ] RTL quick check — logical CSS properties hold up (margin-inline, padding-inline, text-align)
