# HORO Guideline Integrity Delta Audit

Date: 2026-03-25

Baseline references:
- [HORO_Brand_Guidelines_v2.3_Consolidated.md](/Volumes/Rabah_SSD/enrpreneurship/Horo5/HORO_Brand_Guidelines_v2.3_Consolidated.md)
- [audits/horo-website-integrity-audit-2026-03-25.md](/Volumes/Rabah_SSD/enrpreneurship/Horo5/audits/horo-website-integrity-audit-2026-03-25.md)

Current storefront evidence reviewed:
- [web/src/pages/Home.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/Home.tsx)
- [web/src/components/Nav.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/components/Nav.tsx)
- [web/src/pages/Search.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/Search.tsx)
- [web/src/search/view.ts](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/search/view.ts)
- [web/src/components/MerchProductCard.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/components/MerchProductCard.tsx)
- [web/src/pages/VibeCollection.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/VibeCollection.tsx)
- [web/src/pages/OccasionCollection.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/OccasionCollection.tsx)
- [web/src/pages/ProductDetail.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/ProductDetail.tsx)
- [web/src/pages/Checkout.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/Checkout.tsx)
- [web/src/pages/OrderConfirmation.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/pages/OrderConfirmation.tsx)
- [web/src/components/Footer.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/components/Footer.tsx)
- [web/src/data/domain-config.ts](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/data/domain-config.ts)
- [web/src/i18n/ui-locale.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/i18n/ui-locale.tsx)
- [web/src/App.tsx](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/src/App.tsx)
- [web/index.html](/Volumes/Rabah_SSD/enrpreneurship/Horo5/web/index.html)

External benchmark and standards set:
- [WCAG 2.2](https://www.w3.org/TR/wcag/)
- [NN/g: 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [Baymard: The State of Mobile E-Commerce Search and Category Navigation](https://baymard.com/blog/mobile-ecommerce-search-and-navigation)
- [UNIQLO UT Collection](https://www.uniqlo.com/us/en/men/tops/ut-graphic-tees)
- [ASOS Graphic T-Shirts](https://www.asos.com/us/men/t-shirts-tank-tops/printed-graphic-t-shirts/cat/?cid=9172)
- [Zara US](https://www.zara.com/us/)
- [H&M PDP reference](https://www2.hm.com/en_us/productpage.1205216002.html)
- [Threadless](https://www.threadless.com/)
- [Lazy Oaf](https://www.lazyoaf.com/)

## Executive Delta Summary

This is a delta review, not a restart. The current HORO storefront is materially stronger than the March baseline on IA clarity, search discoverability, checkout truthfulness, and story sequencing. The implemented site now feels like one system rather than a set of disconnected fashion pages.

The March audit is no longer the right framing for several areas:
- Search is no longer tab-fragmented and hidden. It is now visible, blended, and materially closer to Baymard-aligned product finding.
- Collection pages no longer lead with utility clutter. Proof now appears before filtering.
- Checkout and confirmation no longer rely on fake customer-facing fallback claims.
- Artist discovery is no longer an accidental half-feature. It is intentionally suppressed outside PDP.

The remaining integrity gaps are now mostly governance and launch-readiness issues, not raw UX structure:
- `P0`: support URLs are still unset, which keeps key trust/help channels non-live
- `P0`: the guide and the live taxonomy still disagree on what the vibe system actually is
- `P1`: imagery structure is fixed, but final editorial asset quality is not yet closed against the guide's anti-generic-photo rule
- `P1`: typography policy is now split between guide intent and performance implementation
- `P1`: Arabic readiness is scaffolded, but not a live bilingual commerce experience
- `P1`: CSS budget remains above the agreed performance target

Overall verdict:
- Storefront integrity versus the March audit: improved substantially
- Storefront integrity versus the written guide: partially aligned, with several explicit overrides now requiring guide revision or a product decision memo
- Launch readiness: blocked by support-channel configuration and unresolved source-of-truth decisions, not by core shopping flow

## Bias-Control Method

This review was run in three passes to reduce framing, confirmation, anchoring, recency, majority-label, positional, historical-pattern, and stakeholder-representation bias.

Pass 1:
- Review the implemented storefront structure and current code state first
- Reassess hierarchy, search, checkout, trust, and performance without reopening the guide

Pass 2:
- Map the current site against guide Sections 3, 6, 7, 8, and 9
- Mark each former issue as `Closed`, `Partially Closed`, `Still Open`, or `Superseded by product direction`

Pass 3:
- Validate disputed areas against WCAG 2.2, NN/g heuristics, Baymard mobile search guidance, and a hybrid benchmark set
- Use mainstream fashion references and art-led references together so the review does not collapse into majority-fashion mimicry

Bias safeguards applied:
- No prior finding was preserved just because it appeared in the March audit
- No guide instruction was treated as automatically correct when it conflicted with clarity, accessibility, or conversion evidence
- No single benchmark brand was treated as the right template for HORO
- Product-direction overrides were recorded explicitly instead of being silently rationalized

## What Changed Since the March Audit

Closed or materially improved since March:
- Global IA now consistently uses `Shop by Vibe` and `Shop by Occasion`
- Artist browse is removed from public IA instead of being half-promised and half-missing
- Search is visible, blended, suggestion-driven, and typo-tolerant
- Vibe and occasion collection pages now place proof before filters
- Homepage story flow is much tighter and more image-led
- Checkout step 1 now validates on submit instead of presenting an inert disabled CTA
- Order confirmation is more truthful and state-driven
- Legal surfaces are live at `/exchange`, `/privacy`, and `/terms`
- External Google Fonts and Material Symbols dependencies are removed
- JS bundle is now under the Phase 3 raw-size target

Still open or only partially resolved since March:
- Support URLs remain `null`, so key help/trust channels are still operationally incomplete
- The guide's vibe taxonomy and the live taxonomy still diverge
- The guide's artist-browse model and the implemented artist-behind-the-scenes model diverge
- Final image quality still depends on better editorial assets
- Arabic readiness exists at the system layer, but not as a finished bilingual commerce experience
- CSS bundle remains above target
- Typography now diverges from the guide after the performance cleanup

## March Findings Status Matrix

| March issue | Current status | Delta note |
| --- | --- | --- |
| Taxonomy and nav language were inconsistent across `Collection`, `Vibe`, and `Occasion` surfaces | `Partially Closed` | Live storefront language is now consistent, but the guide still defines a different vibe taxonomy than the live site uses. |
| Artist discovery was surfaced as a browse promise without a complete public IA | `Superseded by product direction` | The implemented rule is now clear: artist stays behind the scenes except on PDP. This is coherent in-product but no longer matches the guide. |
| Footer and trust surfaces exposed placeholder or unfinished states | `Partially Closed` | Legal pages and conditional rendering fixed the false states, but real Instagram and WhatsApp URLs still have not been configured. |
| Search was underpowered, hidden, and overly segmented | `Closed` | Visible nav search, autosuggest, typo tolerance, scoped matching, and blended results materially close the old issue. |
| Homepage message felt fragmented and utility-led after the hero | `Partially Closed` | The story sequence is much better, but the guide and the implementation still disagree on the exact homepage section order and latest-drop card content. |
| Vibe and occasion collection pages placed utility before proof | `Closed` | Proof now appears before filtering on both collection types. |
| Occasion browsing felt less immersive than vibe browsing | `Closed` | The occasion hub and occasion collection structure are now much more image-led and emotionally framed. |
| Product/listing cards drifted in hierarchy across surfaces | `Closed` | Shared image-first merch card contract now aligns homepage, search, and collection listings. |
| Checkout used a blocked first-step CTA pattern | `Closed` | Submit-first validation and focus-to-error behavior now align with error-prevention heuristics. |
| Confirmation used fake or overconfident post-purchase language | `Closed` | Confirmation now reflects actual stored order state and configured support conditions. |
| Arabic readiness was too shallow to support the guide's bilingual ambition | `Partially Closed` | Locale scaffolding and Arabic microcopy exist, but there is no live public bilingual browsing experience. |
| Performance was burdened by external font/icon dependencies and heavy bundles | `Partially Closed` | JS and network dependencies improved substantially, but CSS remains above target. |
| Imagery felt placeholder-shaped relative to the guide's editorial standard | `Partially Closed` | Structural image-slot cleanup is done, but final editorial asset quality is still not closed. |

## Integrity Matrix Against the Brand Guide

| Guide section | Guide intent | Current implementation | Integrity verdict |
| --- | --- | --- | --- |
| Section 3: Visual Identity | Image-led fashion experience, premium restraint, clear typography, no generic stock feeling | The site is now more image-dominant and less UI-cluttered, but final asset quality is still mixed. Typography now uses local fallback stacks rather than the guide's specified `Space Grotesk` / `Inter`. | `Partially Aligned` |
| Section 6: Product Classification & Navigation | Vibe-first browsing, occasion support, tertiary artist browse, clear taxonomy | Vibe-first and occasion support are strong. Public artist browse is intentionally removed. Live taxonomy is coherent internally but no longer matches the guide's named vibe system. | `Partially Aligned` |
| Section 7: Pricing, Language, and Reassurance | Clear pricing, bilingual readiness, Arabic support, reassurance built into commerce flow | Pricing and reassurance are clearer. Locale scaffolding exists. Full bilingual commerce is not live, and no public Arabic toggle exists. | `Partially Aligned` |
| Section 8: Website, Story Flow, and Checkout | StoryBrand-style homepage, image-first collection pages, trustworthy PDP, low-friction checkout | Homepage and collections are much closer to the intended story flow. PDP and checkout are stronger. Remaining misalignment is mainly on latest-drop card content and exact homepage ordering versus the written guide. | `Mostly Aligned` |
| Section 9: Standards, Ethics, and QA | Accessibility, responsiveness, testing rigor, truthful communication | Truthfulness and system consistency improved. Keyboard/search/validation behavior is stronger. Open risks remain around image-overlay contrast, unfinished support configuration, and incomplete Arabic readiness. | `Partially Aligned` |

## Section-by-Section Review

### Section 3: Visual Identity

What is now strong:
- Homepage, vibe hub, occasion hub, and collection pages are more image-led than they were in March
- Shared merch cards now establish a stable visual hierarchy: image, small proof/taxonomy line, product name, price, action
- The homepage is more coherent as a single story and less like a stack of unrelated modules

What remains weak:
- The guide's typography system and the implementation no longer match
- The current fallback stacks improve performance but reduce brand specificity
- The image architecture is fixed, but some assets still feel provisional rather than editorial

Decision:
- Visual hierarchy integrity is materially improved
- Visual-identity integrity is not fully closed until typography policy and final imagery are resolved

### Section 6: Product Classification & Navigation

What is now strong:
- Main nav is simple and under the seven-item threshold
- `Shop by Vibe` and `Shop by Occasion` are now clear, customer-facing browse paths
- Search now supports product finding rather than acting as a weak secondary route

What remains unresolved:
- The guide still names vibes as `Bold & Loud`, `Soft & Thoughtful`, `Proud & Rooted`, `Weird & Wonderful`, and `Cosmic`
- The live taxonomy still uses `Emotions`, `Zodiac`, `Fiction`, `Career`, and `Trends`
- Artist as a tertiary browse axis is no longer true in the implemented product

Decision:
- IA is stronger than the written guide in clarity
- Governance integrity is weak because the written source of truth and the shipped source of truth are no longer the same

### Section 7: Pricing, Language, and Reassurance

What is now strong:
- Checkout and confirmation use clearer, more truthful reassurance
- Locale scaffolding is present at the system UI level
- Arabic-support intent now exists in code, not just as a guideline statement

What remains unresolved:
- There is still no public bilingual browsing flow
- Arabic readiness is infrastructural rather than market-ready
- Real support channels are not configured, so reassurance remains structurally ready but operationally incomplete

Decision:
- Reassurance integrity improved significantly
- Language integrity remains partial

### Section 8: Website, Story Flow, and Checkout

What is now strong:
- Homepage now supports 3-second orientation better than the March version
- Collection pages are sequenced correctly for a fashion shopper: proof before utility
- PDP keeps trust and add-to-bag action close together
- Checkout is closer to mainstream fashion-commerce expectations: guest path, progress, COD default, transparent state

What remains unresolved:
- The guide specifies a homepage order that places `Latest Drop` after `Real Stories`, while the implemented site moves proof earlier
- The guide expects latest-drop cards to include artist signals; the implemented product intentionally hides artist on browse cards

Decision:
- The implementation is stronger for first-time comprehension than the written guide in these two areas
- These are no longer bugs; they are documented overrides that should be reflected in the guide

### Section 9: Standards, Ethics, and QA

What is now strong:
- The product is more truthful and less likely to mislead on support, tracking, or order state
- Search and validation behaviors now map better to NN/g heuristics on visibility, recognition, error prevention, and recovery
- External font/icon dependencies were removed from the critical path

What remains unresolved:
- CSS remains above the internal raw bundle target
- Image overlays still need final contrast review against real editorial assets
- Accessibility confidence is improved structurally, but still needs a rendered pass with final imagery and Arabic mode enabled

Decision:
- Standards integrity is improved, not finished

## Updated Ranked Findings

### P0

#### P0.1 Support channels remain operationally incomplete
- Area: footer, PDP help, order confirmation, legal/support credibility
- Principle: visibility of system status, trust continuity, conversion reassurance
- Current state: support URLs remain unset in config, so the site correctly hides those surfaces instead of lying, but launch-time reassurance is still reduced
- Shopper impact: customers have fewer visible post-purchase recovery paths at the exact moments they need them
- Why it matters: fashion buyers are sensitive to exchange, delivery, and message-based support credibility
- Exact fix: populate real `instagramUrl`, `whatsappSupportUrl`, and `whatsappTrackingUrl` in the environment-backed config before launch and regression-test every conditional support surface

#### P0.2 Guide taxonomy and live taxonomy are no longer the same system
- Area: governance, IA, future merchandising, future content operations
- Principle: consistency and standards, labeling, recognition rather than recall
- Current state: the live product uses one vibe model while the guide documents another
- Shopper impact: current shoppers are not directly harmed because the live IA is internally consistent, but the team lacks one stable source of truth for future growth
- Why it matters: taxonomy drift will reintroduce inconsistency across navigation, landing pages, campaigns, and search aliases
- Exact fix: choose one canonical vibe taxonomy, update either the guide or the storefront, then align search aliases, homepage modules, and merchandising rules to that single model

### P1

#### P1.1 Final image quality still trails the guide's editorial standard
- Area: homepage, browse hubs, collection proof sections
- Principle: image dominance, premium coherence, immediate immersion
- Current state: layout and image-slot structure are fixed, but some assets still feel generated, repeated, or provisional
- Shopper impact: the first three seconds are clearer, but not yet as emotionally convincing as the guide requires
- Why it matters: when imagery is meant to dominate, any generic feeling becomes the brand
- Exact fix: replace remaining provisional assets with a validated editorial set mapped to the existing slot contract

#### P1.2 Typography policy is unresolved
- Area: global brand expression and mobile readability
- Principle: coherence, hierarchy, readability, brand integrity
- Current state: the guide specifies `Space Grotesk` / `Inter`, while the implementation now relies on local fallback stacks to protect performance
- Shopper impact: readability is acceptable, but brand specificity is reduced
- Why it matters: typography is now a strategic tradeoff, not a pure implementation detail
- Exact fix: either approve a new local/self-hosted typography token policy or restore brand fonts in a performance-safe way and update the budget accordingly

#### P1.3 Arabic readiness is infrastructural, not market-ready
- Area: search, checkout, confirmation, future bilingual rollout
- Principle: accessibility, language clarity, market fit
- Current state: locale scaffolding exists and Arabic aliases are supported in search logic, but public Arabic browsing is not live
- Shopper impact: the product is more future-ready, but not yet a finished Arabic commerce experience
- Why it matters: the guide presents bilingual capability as a brand-level commitment
- Exact fix: decide whether Phase 4 includes a real bilingual release or whether the guide should be narrowed to reflect an English-first launch

#### P1.4 CSS budget remains above target
- Area: performance, mobile experience
- Principle: responsiveness, first-load efficiency
- Current state: JS target is met, but CSS raw output remains above the internal target
- Shopper impact: lower-end mobile devices may still pay a styling cost that is harder to justify now that the rest of the performance cleanup is underway
- Why it matters: the brand depends on large-format imagery and should avoid wasting budget elsewhere
- Exact fix: audit global utility leakage, unused component styling, and duplicated typography/surface tokens until CSS falls below the target

#### P1.5 The guide and the live product still disagree on artist visibility
- Area: taxonomy, browse behavior, proof model
- Principle: consistency and standards
- Current state: the guide still treats artist as a tertiary browse axis and latest-drop proof cue, while the live site shows artist only on PDP
- Shopper impact: current shoppers are not harmed; this is a product-strategy inconsistency, not a usability defect
- Why it matters: teams will keep revisiting the same debate unless the guide is updated
- Exact fix: revise the guide to formalize the new rule that artist is legitimacy on PDP, not a browse path

### P2

#### P2.1 Homepage section order now beats the written guide, but the guide has not caught up
- Area: homepage storytelling
- Principle: StoryBrand sequencing, 3-second immersion
- Current state: the live site moves proof earlier than the guide's written order
- Shopper impact: this likely helps comprehension rather than hurting it
- Why it matters: future contributors may “fix” the homepage back into a weaker sequence if the guide stays unchanged
- Exact fix: update the guide's homepage order to match the higher-performing structure or document the override in a design-decision record

#### P2.2 Final contrast and motion review still depends on real rendered assets
- Area: accessibility and visual polish
- Principle: WCAG contrast, focus visibility, reduced-motion care
- Current state: structural accessibility is stronger, but image-overlay contrast and motion feel still need a final rendered pass with production assets
- Shopper impact: low-vision and motion-sensitive users may still encounter edge-case issues after asset replacement
- Why it matters: the last accessibility failures in fashion sites usually appear after the imagery is finalized
- Exact fix: run a rendered accessibility pass after final assets and support URLs are in place

## Override Log

| Topic | Guide says | Current implementation | Benchmark / standards input | Winner | Why |
| --- | --- | --- | --- | --- | --- |
| Artist as browse axis | Artist should be a tertiary public browse path | Artist is hidden on browse surfaces and shown only on PDP | Mainstream fashion references prioritize product, edit, category, and occasion discovery; Threadless is artist-forward, but HORO is intentionally not a marketplace | `Benchmark + product direction` | The current rule produces cleaner IA and a more unified message for HORO's shopping model. |
| Exact typography stack | `Space Grotesk` / `Inter` are specified | Local fallback stacks are used after performance cleanup | Performance budgets and mobile rendering favor lighter dependency patterns, but brand specificity matters | `Unresolved` | This is not a pure benchmark win. It needs an explicit brand/performance decision. |
| Homepage sequencing | Latest Drop comes after Real Stories | Product proof appears earlier | Image-first fashion references often surface product proof early, and StoryBrand also benefits from fast evidence after the problem/setup | `Benchmark` | The implemented order improves first-time comprehension inside the 3-second window. |
| Latest-drop card proof model | Artist should appear on cards | Cards show vibe/proof cue, not artist | Mainstream fashion cards lead with image, edit/category cue, name, price, and action; artist-forward cards suit marketplaces more than focused fashion brands | `Benchmark + product direction` | The current card model is cleaner and better aligned with the “artist behind the scenes” rule. |
| Bilingual ambition timing | Arabic capability reads as a broad brand promise | Arabic exists as scaffolding, not a full public experience | Shipping partial bilingual infrastructure is acceptable only if the guide stops implying a fully live rollout | `Unresolved` | Either the product must finish the rollout or the guide must narrow the promise. |

## Benchmark Readout

What HORO now does more credibly:
- Like Zara, H&M, UNIQLO, and ASOS, the core shopping routes are now simpler and more product-led
- Like ASOS and Lazy Oaf, search is more visibly invited rather than hidden
- Like H&M and UNIQLO, PDP emphasis is now closer to image, price, add-to-bag, and compact proof rather than excess storytelling inside the buying zone

What HORO still lags:
- Final editorial image confidence is still below the strongest fashion references
- Operational trust surfaces are weaker than mature references until support URLs are live
- Threadless shows how explicit artist discovery can work, but HORO is correctly choosing not to emulate that model unless the business direction changes

Most useful external benchmark takeaways applied here:
- NN/g supports immediate, continuous feedback and error recovery, which the new checkout and confirmation flows handle better
- Baymard's mobile search findings support visible search, useful autocomplete, scope cues, and non-dead-end no-results behavior
- Fashion benchmarks consistently keep category language and product cards simple while letting imagery do most of the persuasion

## Phase 4 and Remaining Work Roadmap

### Phase 4A: Launch Blockers

1. Populate real support-channel URLs in config and regression-test every conditional help surface.
2. Resolve the canonical vibe taxonomy decision and update either the guide or the product so there is one source of truth.
3. Publish a formal guide addendum for the artist-behind-the-scenes rule so future work does not re-open public artist browsing by accident.

### Phase 4B: Brand Integrity Closures

1. Replace remaining provisional imagery with final editorial assets mapped to the existing slot system.
2. Make an explicit typography policy decision.
Self-host approved brand fonts, or approve the new local-stack system and revise the guide.
3. Decide whether bilingual commerce is truly in scope for the next release or whether the guide should be narrowed to English-first launch reality.

### Phase 4C: Performance and Accessibility Finish

1. Reduce CSS below the agreed raw target.
2. Run a rendered accessibility pass after final assets are in place.
The pass should cover image-overlay contrast, focus visibility, reduced-motion handling, and keyboard behavior across nav search, quick view, checkout, and confirmation.
3. Re-run first-impression and discovery testing on mobile once final imagery and support URLs are live.

## Recommended Status Summary for Leadership

- `Closed`: search structure, collection sequencing, shared card hierarchy, checkout validation, confirmation truthfulness, legal surfaces, external font/icon dependency removal
- `Partially Closed`: trust-channel readiness, imagery quality, Arabic readiness, performance budget, taxonomy integrity, homepage/story alignment to the written guide
- `Still Open`: none at the raw UX-architecture level; the remaining open items are governance, asset, and launch-ops issues
- `Superseded by product direction`: public artist browsing as a planned discovery axis

## Source Notes

Standards and research used:
- W3C WCAG 2.2 for accessibility conformance framing
- NN/g heuristics for status visibility, consistency, error prevention, recognition, and recovery
- Baymard mobile search/navigation research for visible search, autocomplete, scope suggestions, and no-results recovery

Benchmark set used:
- Zara, H&M, ASOS, and UNIQLO for mainstream fashion-commerce structure
- Threadless for artist-forward graphic-commerce contrast
- Lazy Oaf for art-led streetwear presentation, visible search behavior, and image-first merchandising

Validation notes:
- This delta review was based on the current implemented codebase and a current production build check
- The current build succeeds
- Current build truth at review time: JS bundle is under the raw target.
- Current build truth at review time: CSS bundle remains above the raw target.
- Current build truth at review time: external Google Fonts and Material Symbols are removed from the critical path.
- No production URL was available in-repo, so rendered judgments remain based on the local implementation structure rather than a live published environment
