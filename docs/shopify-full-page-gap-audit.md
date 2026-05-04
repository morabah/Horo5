# HORO Shopify — Full Page Gap Audit (Phase 1.6e)

## Method
Compare each Shopify page (current Dawn + HORO sections) against the custom web/Medusa equivalent. Report missing content, visual treatment, dynamic data, CTAs, mobile gaps, SEO/trust gaps, risk, and recommendation.

---

## 1. Homepage

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | Home hero, feeling grid, occasion grid, gift block, trust ribbon, story plan, testimonials | Same structure | Minor |
| Visual | Phase 1.6c added editorial word layer | Web has cinematic scroll sections | **Defer** — cinematic scroll is JS-heavy |
| Dynamic | Metaobjects drive feelings/occasions/gifts | Same | None |
| CTA | Primary routes present | Web has more prominent CTA | Minor — hero CTA is already configurable |
| Mobile | Responsive grid, stacked cards | Same | None |
| SEO | Standard Dawn meta tags | Web has structured data + OG | **Later** — add OG image and structured data |
| Trust | Trust ribbon present | Same | None |
| **Risk** | Low | | |
| **Recommendation** | Defer cinematic scroll. Verify hero CTA copy. | | |

---

## 2. Feelings/Vibes Hub

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `feelings-hub` section with metaobject-driven grid | `ShopByFeelingPage` with editorial intro | **Must fix** — missing editorial guide |
| Visual | Clean grid with cards | Has editorial intro text + CTA | **Must fix** — add editorial guide section |
| Dynamic | Metaobjects | Same | None |
| CTA | None below heading | Web has "Shop all products" CTA | **Must fix** |
| Mobile | 2-col mobile grid | Same | None |
| SEO | Page-level title | Web has canonical + OG | Minor |
| Trust | None | Minor trust strip at bottom | **Later** |
| **Risk** | Very low — new section only | | |
| **Recommendation** | Add `feelings-editorial-guide` section below hub. | | |

---

## 3. Feeling/Vibe Collection

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `collection.json` with banner, feeling_hero, occasion_hero, subfeeling_nav, product-grid | `VibeCollectionPage` with editorial hero + subfeeling filter | Close |
| Visual | Banner + hero sections present | Web has more immersive hero | Minor |
| Dynamic | Collection products + metaobjects | Same | None |
| CTA | Product grid CTA implicit | Web has collection description CTA | Minor |
| Mobile | 2-col mobile | Same | None |
| SEO | Collection description used | Web has custom OG | Minor |
| **Risk** | Low | | |
| **Recommendation** | Verify collection descriptions are populated. Minor. | | |

---

## 4. Occasions Hub

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `occasions-hub` section with metaobject grid | `ShopByOccasionPage` with editorial intro | Same as feelings hub |
| Visual | Clean grid | Has editorial intro | Same gap |
| Dynamic | Metaobjects | Same | None |
| CTA | None | Web has CTA | Same gap |
| **Recommendation** | Add same editorial guide pattern to occasions hub. **Later** — not in Phase 1.6e scope. | | |

---

## 5. Occasion Collection

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `collection.json` reuses same sections | `OccasionCollectionPage` | Close |
| Visual | Standard collection grid | Web has occasion-specific hero | Minor |
| **Recommendation** | Verify occasion collection images/descriptions. Minor. | | |

---

## 6. Gifts Hub

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `gifts-hub` with metaobject grid | `GiftsPage` with editorial intro | Same as feelings hub |
| **Recommendation** | Add editorial guide pattern. **Later** — not in Phase 1.6e scope. | | |

---

## 7. Cart Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `main-cart-items`, `cart-gift-wrap-upsell`, `main-cart-footer`, `featured-collection` | Cart lines, gift wrap upsell, trust strip, checkout CTA, bundle upsell | Close |
| Visual | Standard Dawn cart | Web has trust strip below cart lines | **Must fix** — missing trust explainer |
| Dynamic | Cart items, gift wrap | Same | None |
| CTA | Checkout button present | Same | None |
| Mobile | Responsive | Same | None |
| Trust | No explicit trust signals in cart | Web shows COD, exchange, delivery trust items | **Must fix** |
| **Risk** | Very low — new section between items and footer | | |
| **Recommendation** | Add `cart-trust-explainer` section between cart-items and cart-footer. | | |

---

## 8. Search Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `main-search` with product/article/page results | `SearchPage` with faceted filters + suggestions | Large feature gap |
| Visual | Standard Dawn search grid | Web has search hero + filter bar + grouped results | **Defer** — JS-heavy rebuild |
| Dynamic | Shopify search API | Same | None |
| CTA | No recovery CTAs on zero results | Web has "Shop by Feeling / Gifts / Size Guide" | **Must fix** — add static support links |
| Mobile | Standard grid | Web has filter sheet | **Defer** |
| **Risk** | Very low for static support links; high for full rebuild | | |
| **Recommendation** | Add `search-support-links` section below main search. Do not rebuild search logic. | | |

---

## 9. About Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `page-about-horo` with single text block | `About` with hero image, multi-paragraph story, trust pills, bridge CTA | **Must fix** — missing hero, trust, CTA |
| Visual | Plain text | Hero image + dark overlay + trust pills + bridge image CTA | **Must fix** |
| Dynamic | None | Same | None |
| CTA | None | "Shop by Feeling" CTA | **Must fix** |
| Mobile | Narrow page width | Web is full-bleed hero | **Must fix** — add optional hero + trust blocks |
| SEO | Standard page title | Web has structured heading hierarchy | Minor |
| **Risk** | Low — add optional settings/blocks to existing section | | |
| **Recommendation** | Enhance `page-about-horo.liquid` with hero image, subheading, CTA, and trust point blocks. | | |

---

## 10. FAQ Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `page-faq-horo` with FAQ items | `FAQ` with accordion + support CTA at bottom | **Must fix** — missing support CTA |
| Visual | Clean accordion list | Has WhatsApp support CTA below | **Must fix** |
| Dynamic | None | Same | None |
| CTA | None | "Contact us on WhatsApp" | **Must fix** |
| Mobile | Accordion works | Same | None |
| **Risk** | Very low — add optional settings to existing section | | |
| **Recommendation** | Add optional support CTA settings to `page-faq-horo.liquid`. | | |

---

## 11. Exchange Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `page-exchange-policy-horo` with policy blocks | `Exchange` with policy list | Close |
| Visual | Clean policy list | Same structure | None |
| Dynamic | None | Same | None |
| CTA | None | Minor | None |
| **Gap** | Block `policy-5` contains draft warning text: "This policy is a draft. Please review and adjust it..." | Web has final cautious wording | **Must fix** |
| **Risk** | Very low — template JSON text change only | | |
| **Recommendation** | Replace draft text with final cautious wording in `page.exchange-policy-horo.json`. | | |

---

## 12. Size Guide Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `page-size-guide` with measurement table | Size guide with table + fit advice | Close |
| Visual | Clean table | Same | None |
| Dynamic | Static table rows | Same | None |
| CTA | None | Web links back to shop | Minor |
| **Recommendation** | Minor. Consider adding CTA link in settings. **Later**. | | |

---

## 13. Privacy/Terms/Policy Pages

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `page.json` (standard Dawn page) | `privacy/page.tsx`, `terms/page.tsx` with formatted content | **Must fix** — content not yet populated |
| Visual | Standard page | Web has formatted policy cards | Minor |
| **Risk** | Very low — content population task, not code | | |
| **Recommendation** | Document in checklist. Populate via Shopify Admin pages. | | |

---

## 14. 404 Page

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | `main-404` with title, subtext, continue shopping link | `not-found.tsx` with styled 404 + navigation links | Minor |
| Visual | Very basic | Web has branded 404 with links | Minor |
| CTA | Continue shopping only | Web has "Shop by Feeling", "Browse all" | **Later** — minor UX improvement |
| **Recommendation** | Minor. Can enhance later. Not in Phase 1.6e scope. | | |

---

## 15. Navigation / Footer

| Area | Shopify current | Web/Medusa equivalent | Gap |
|------|----------------|----------------------|-----|
| Content | Dawn header + footer with menus | Web has structured main menu + footer links | **Must fix** — menu structure not documented |
| Visual | Standard Dawn | Same | None |
| Dynamic | Menu links from admin | Same | None |
| **Gap** | No clear recommendation for main menu vs footer menu items | Web has specific menu structure | **Must fix** — document recommendations |
| **Risk** | Very low — documentation only | | |
| **Recommendation** | Create `shopify-footer-policy-readiness-checklist.md` with menu structure recommendations. | | |

---

## Summary of must-fix gaps (Phase 1.6e scope)

| # | Page | Gap | Fix approach | Risk |
|---|------|-----|-------------|------|
| 1 | Exchange | Draft warning text | Update `page.exchange-policy-horo.json` | Very low |
| 2 | FAQ | Missing support CTA | Add settings to `page-faq-horo.liquid` | Very low |
| 3 | About | Missing hero, trust, CTA | Add blocks/settings to `page-about-horo.liquid` | Low |
| 4 | Search | Missing recovery CTAs | Create `search-support-links` section + template | Very low |
| 5 | Cart | Missing trust explainer | Create `cart-trust-explainer` section + template | Very low |
| 6 | Feelings Hub | Missing editorial guide | Create `feelings-editorial-guide` section + template | Very low |
| 7 | Policy/Footer | Missing documentation | Create checklist document | Very low |

## Deferred gaps (not in Phase 1.6e)

| Page | Gap | Why deferred |
|------|-----|-------------|
| Homepage | Cinematic scroll | JS-heavy, requires animation library |
| Search | Faceted filters, suggestions | Requires JS-heavy rebuild of Dawn search |
| Collection | Immersive hero | Minor visual gap, requires custom Liquid |
| 404 | Enhanced branded 404 | Minor UX, can add later |
| PDP | Related products by feeling | Shopify recommendations API limitation |
| Cart | Bundle upsell logic | Requires cart JS changes |
| PDP | Sticky mobile add-to-cart | Requires JS, touches product form |

