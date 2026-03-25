# HORO Website Integrity Audit

Date: 2026-03-25

## Scope
- Reviewed the local Vite app as the source of truth across `/`, `/vibes`, `/vibes/:slug`, `/occasions`, `/occasions/:slug`, `/products/:slug`, `/search`, `/cart`, `/checkout`, `/checkout/success`, `/about`, plus global nav, footer, quick view, drawer, and search overlays.
- Benchmarked against current fashion-commerce patterns from [UNIQLO](https://www.uniqlo.com/us/en/men/tops/ut-graphic-tees), [ASOS](https://www.asos.com/us/men/t-shirts-tank-tops/printed-graphic-t-shirts/cat/?cid=9172), [Zara](https://www.zara.com/us/en/woman-basics-tshirts-l6119.html), and [H&M](https://www2.hm.com/en_us/productpage.1205216002.html).
- Checked usability against [WCAG 2.2](https://www.w3.org/TR/wcag/), the [NN/g heuristic summary](https://media.nngroup.com/media/articles/attachments/Heuristic_Summary1_Letter-compressed.pdf), and [Baymard mobile search/navigation guidance](https://baymard.com/blog/mobile-ecommerce-search-and-navigation).
- Used a blind-first pass on the live app structure, then cross-checked against the embedded brand rulebook in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md).

## Executive Summary
- HORO already has a strong visual foundation on the homepage and PDP. The best parts of the site are image-led, warm, and emotionally legible.
- The integrity problems are systemic, not cosmetic. The site currently splits its message across conflicting taxonomies, placeholder trust surfaces, unfinished artist discovery, and a mixed-quality image system.
- The biggest risk is not "bad UI". It is credibility drift. A fashion brand that asks shoppers to buy meaning has to look, label, and behave like a finished brand at every touchpoint.
- The client will likely feel the brand in the first 3 seconds on the homepage, but the illusion weakens as soon as they navigate, search, verify trust, or reach post-purchase states.

## What Already Works
- Homepage hero is image-dominant and communicates brand promise quickly. See [`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx).
- PDP has strong purchase architecture: large gallery, story card, size selection, trust strip, and a mobile sticky CTA. See [`web/src/pages/ProductDetail.tsx`](../web/src/pages/ProductDetail.tsx).
- Cart follows the one-upsell rule well and keeps a single dominant checkout path. See [`web/src/pages/Cart.tsx`](../web/src/pages/Cart.tsx).
- Checkout includes guest checkout, visible shipping, COD default, a prepaid incentive, and an Arabic trust cue. See [`web/src/pages/Checkout.tsx`](../web/src/pages/Checkout.tsx).
- Accessibility intent is visible in focus styles, skip links, trapped overlays, reduced-motion support, and touch-target sizing across the app.

## Scorecard

Scale: `1` weak, `3` acceptable, `5` strong.

| Area | Visual | Usability | IA / Nav | Conversion | Accessibility |
| :-- | --: | --: | --: | --: | --: |
| Global nav + footer | 3 | 3 | 1 | 2 | 3 |
| Homepage | 4 | 3 | 3 | 3 | 3 |
| Shop by Vibe hub | 4 | 3 | 3 | 3 | 4 |
| Vibe collection | 4 | 4 | 3 | 3 | 4 |
| Shop by Occasion + occasion collection | 4 | 4 | 3 | 4 | 4 |
| Product detail | 4 | 4 | 4 | 4 | 4 |
| Search | 3 | 4 | 3 | 3 | 4 |
| Cart | 4 | 4 | 4 | 4 | 4 |
| Checkout | 3 | 4 | 4 | 4 | 4 |
| Order confirmation | 3 | 3 | 2 | 3 | 3 |

## Ranked Findings

### P0

#### P0. Navigation taxonomy is inconsistent and breaks the site's mental model
- Page / flow: Global nav, `/vibes`, `/artists`, `/search`, homepage CTA flow.
- Violated principle: Labeling and taxonomy, consistency and standards, recognition rather than recall, StoryBrand single-message discipline.
- Evidence: The main nav labels `/vibes` as `Collection` in [`web/src/lib/navLinks.ts`](../web/src/lib/navLinks.ts), while the live browse hub is `Shop by vibe` in [`web/src/pages/ShopByVibe.tsx`](../web/src/pages/ShopByVibe.tsx). The product taxonomy in [`web/src/data/site.ts`](../web/src/data/site.ts) uses `Emotions`, `Zodiac`, `Fiction`, `Career`, and `Trends`, while the brand guideline defines a different primary vibe set in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md). `/artists` and `/artists/:slug` redirect back to `/vibes` in [`web/src/App.tsx`](../web/src/App.tsx).
- Shopper impact: Users do not get one stable map of "how to shop". The site alternates between `Collection`, `Vibe`, `Occasion`, and `Artist`, but not all of those are fully real. That weakens confidence and slows discovery.
- Why it matters for fashion: Fashion browsing is category-led. Zara, H&M, ASOS, and UNIQLO all use concrete, shopper-facing labels and predictable browse paths. Abstract labels like `Collection` make the site feel more like an unfinished concept deck than a live store.
- Exact structural fix: Choose one discovery system and apply it everywhere. Rename the primary nav to `Shop by Vibe` and `Shop by Occasion`. Either restore `Browse by Artist` as a real third axis with real landing/profile pages, or remove artist as a surfaced discovery promise until it exists. Align the live taxonomy and the brand guide into one approved vocabulary.

#### P0. Trust-critical commerce endpoints and policy surfaces are still placeholder-grade
- Page / flow: PDP support, footer, checkout, order confirmation.
- Violated principle: Visibility of system status, helping users recover, trust and credibility, match between system and the real world.
- Evidence: The PDP WhatsApp help URL is still a placeholder in [`web/src/data/domain-config.ts`](../web/src/data/domain-config.ts). Order confirmation uses a hardcoded WhatsApp number in [`web/src/pages/OrderConfirmation.tsx`](../web/src/pages/OrderConfirmation.tsx). The footer links to generic `instagram.com` and exposes disabled `Privacy Policy` and `Terms of Service` controls in [`web/src/components/Footer.tsx`](../web/src/components/Footer.tsx).
- Shopper impact: A buyer can complete checkout and still land in a post-purchase state that feels fake. That is especially damaging in COD-heavy markets where legitimacy checks happen late.
- Why it matters for fashion: Trust is not only payment security. It is also "can I contact this brand", "can I track this order", and "does this store have real policies". Fashion purchases are emotional first and trust-verified second.
- Exact structural fix: Replace all placeholder WhatsApp and Instagram destinations with real verified channels. Publish at least minimal `Exchange`, `Privacy`, and `Terms` pages. Link the exchange policy from cart, checkout, and confirmation. Do not expose disabled customer-facing controls in the footer.

#### P0. The image system undermines the site's own image-first strategy
- Page / flow: Homepage, collection hubs, PDP gallery system, artist portraits, overall brand perception.
- Violated principle: 3-second immersion, aesthetics and coherence, trust signaling, internal brand consistency.
- Evidence: The image registry in [`web/src/data/images.ts`](../web/src/data/images.ts) still describes `Unsplash`-sourced assets and mixed generated assets. The catalog itself is labeled `Mock catalog — wireframe-aligned placeholders` in [`web/src/data/site.ts`](../web/src/data/site.ts). The brand guide explicitly bans `Generic stock images` in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md).
- Shopper impact: Because imagery is the dominant layer, generic or obviously placeholder imagery does more damage than placeholder copy would. The site asks users to buy meaning, but some visuals still feel like substitutes rather than proof.
- Why it matters for fashion: On apparel sites, the photography is the product before the product details are. If the imagery does not look specific, native, and credible, the brand loses its premium-mid positioning immediately.
- Exact structural fix: Replace the shared placeholder pool with a real HORO editorial image system: homepage hero, vibe hero set, real artist portraits, flat lays, on-body shots, macro print detail, size-reference shots, and gift-bundle imagery. Use one Cairo-rooted photographic direction consistently across homepage, collections, PDP, cart, and confirmation.

### P1

#### P1. Artist discovery is promised but not truly implemented
- Page / flow: Search, app routes, product differentiation.
- Violated principle: IA completeness, consistency, guide vs implementation integrity.
- Evidence: The guideline defines `Browse by Artist` as a tertiary axis in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md). The app redirects `/artists` to `/vibes` in [`web/src/App.tsx`](../web/src/App.tsx). Search artist cards route to filtered search results instead of artist profiles in [`web/src/search/view.ts`](../web/src/search/view.ts) and [`web/src/pages/Search.tsx`](../web/src/pages/Search.tsx).
- Shopper impact: The user is invited to browse by artist, but the product never pays off that promise with a distinct artist destination.
- Why it matters for fashion: Artist legitimacy is part of HORO's differentiation from generic graphic-tee sellers. If that layer is weak, the site loses one of its strongest reasons to exist.
- Exact structural fix: Add real artist landing pages or profile cards with portrait, style description, and portfolio-linked products. If that is not being built now, remove `artists` as a surfaced discovery mode and keep artist credit inside product and collection cards only.

#### P1. Search is usable but not prominent, predictive, or bilingual-ready enough
- Page / flow: Global nav search, search page, scoped search, mobile search overlay.
- Violated principle: Searchability, recognition rather than recall, flexibility and efficiency of use.
- Evidence: Desktop search is hidden behind an icon until expanded in [`web/src/components/Nav.tsx`](../web/src/components/Nav.tsx). Mobile search is also icon-first in the same file. The search engine in [`web/src/search/view.ts`](../web/src/search/view.ts) tokenizes and matches text but does not do fuzzy typo correction or autocomplete. The page uses English-only prompts such as `Search designs, vibes, artists...` in [`web/src/data/domain-config.ts`](../web/src/data/domain-config.ts). The `POPULAR_SEARCHES` list in [`web/src/pages/Search.tsx`](../web/src/pages/Search.tsx) includes terms like `Coffee` that do not belong to the visible taxonomy.
- Shopper impact: The user must know what to type, and the site gives little predictive help. That slows discovery and makes the search feel less helpful than modern fashion ecommerce search.
- Why it matters for fashion: Shoppers often search by mood, occasion, or half-formed intent. Baymard's research strongly favors thematic discovery support and stronger mobile search/category scaffolding.
- Exact structural fix: Keep a visible search affordance in the nav, add autosuggest across designs, vibes, occasions, and artists, add typo tolerance, prepare Arabic query support, and replace dead popular chips with real high-intent themes from the catalog.

#### P1. The homepage is close to a strong StoryBrand arc, but not fully singular after the hero
- Page / flow: Homepage sections 2 through 6.
- Violated principle: Visual hierarchy, one primary action per viewport, unified message, StoryBrand sequencing.
- Evidence: The Feeling section includes a secondary image in [`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx), while the brand guide specifies a text-only problem section in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md). The simple plan strip appears before the main proof section in the same file. The latest-drop cards omit artist credit, though the guideline specifies artist name on those cards. CTA naming also drifts between `Find Your Vibe`, `Find Your Design`, and `View All` across homepage, cart, and about flows.
- Shopper impact: The user gets a strong opening, but the path fragments into multiple modes and labels too early. The site becomes "many decent ideas" instead of "one clear invitation".
- Why it matters for fashion: The strongest fashion homepages move from emotional hook to category choice to product proof with very little narrative branching.
- Exact structural fix: Make The Feeling section text-only or demote its image substantially. Move the simple plan below proof or merge it into trust. Add artist credit to latest-drop cards. Standardize the dominant CTA naming around one shopping action.

#### P1. Collection pages move to filtering before enough proof
- Page / flow: `/vibes/:slug`, `/occasions/:slug`.
- Violated principle: Story sequencing, value proposition reinforcement, conversion support.
- Evidence: Both collection types place filter/search controls directly above the product grid in [`web/src/pages/VibeCollection.tsx`](../web/src/pages/VibeCollection.tsx) and [`web/src/pages/OccasionCollection.tsx`](../web/src/pages/OccasionCollection.tsx). The vibe story section sits below the product grid, and occasion pages have no equivalent editorial proof block beyond the optional gift banner.
- Shopper impact: Users are asked to sort and filter before the site has fully sold why this edit matters.
- Why it matters for fashion: Themed apparel discovery works best when the emotional reason to shop the edit is reinforced before utility controls take over.
- Exact structural fix: Keep the hero. Add a short proof/story strip immediately before the products. Move filters below that strip. For occasion pages, add a short "why this edit exists" block and gift/fit/trust rationale before the grid.

#### P1. Listing cards underplay artist legitimacy and product proof
- Page / flow: Homepage latest drop, vibe collection grid, occasion cards, some search surfaces.
- Violated principle: Supporting information, authority signaling, brand differentiation.
- Evidence: Homepage latest-drop cards in [`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx) show vibe, product name, story, and price, but not artist. Vibe collection cards in [`web/src/pages/VibeCollection.tsx`](../web/src/pages/VibeCollection.tsx) show only name and price. Occasion cards in [`web/src/pages/OccasionCollection.tsx`](../web/src/pages/OccasionCollection.tsx) show artist name, but artist is not made into a consistent trust pattern across all listing surfaces.
- Shopper impact: The catalog becomes visually attractive but less defensible. It reads more like generic graphic merchandising than credited wearable illustration.
- Why it matters for fashion: HORO is not competing on basic apparel. It is competing on "this art means something". Artist proof has to show up before the PDP, not only inside it.
- Exact structural fix: Standardize merch cards to show artist line, design name, price, and one compact proof attribute where space permits. Keep the image dominant, but do not hide the differentiator.

#### P1. Checkout works functionally, but its trust continuity is uneven
- Page / flow: Checkout information, shipping, payment.
- Violated principle: Visibility of status, user control, credibility, brand coherence.
- Evidence: Checkout includes the right fundamentals in [`web/src/pages/Checkout.tsx`](../web/src/pages/Checkout.tsx): guest checkout, shipping visibility, COD default, card incentive, Arabic trust cue, and image-backed order summary. But the primary button is disabled before submit on step 1, the exchange-policy link on payment routes to `/`, and the overall screen drops into a very generic utility layout.
- Shopper impact: The shopper can complete checkout, but the emotional tone and trust clarity dip at the exact moment doubt peaks.
- Why it matters for fashion: Fashion checkout should become simpler, not colder. The best flows reduce decoration without feeling detached from the brand.
- Exact structural fix: Keep the form clarity, but let the CTA validate on submit rather than stay inert, add a real exchange-policy destination, reinforce delivery and trust next to the payment CTA, and carry a minimal branded trust strip or image cue through the flow.

#### P1. Post-purchase status messaging is partially false
- Page / flow: Order confirmation.
- Violated principle: Visibility of system status, honesty, error prevention.
- Evidence: Order confirmation in [`web/src/pages/OrderConfirmation.tsx`](../web/src/pages/OrderConfirmation.tsx) always says `A WhatsApp confirmation is on its way`, uses a fallback fake order ID, and offers tracking through a hardcoded WhatsApp number. The checkout opt-in state is not reflected here.
- Shopper impact: The user is told things that may not actually be true. That is a trust leak after conversion.
- Why it matters for fashion: Post-purchase reassurance is a brand moment. If it feels simulated, the brand feels unfinished.
- Exact structural fix: Condition confirmation messaging on the actual stored order data and opt-in state. Remove fake shopper-facing fallback IDs. Show real channels only when real integrations exist.

#### P1. Arabic-commerce readiness is not structurally present yet
- Page / flow: Global site language, search, navigation, checkout continuity.
- Violated principle: Match between system and audience, localization readiness, consistency.
- Evidence: The brand guide defines English brand identity with Arabic-led commerce in [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md). The app currently renders English-only labels across nav, search, and browse surfaces, while checkout only adds a single Arabic reassurance line in [`web/src/pages/Checkout.tsx`](../web/src/pages/Checkout.tsx). The HTML document is also set to `lang="en"` in [`web/index.html`](../web/index.html).
- Shopper impact: The site partially signals bilingual intent but does not support Arabic-led commerce behavior in any meaningful browsing flow.
- Why it matters for fashion: Discovery and reassurance language matter as much as final payment language in Egyptian ecommerce.
- Exact structural fix: Add a real bilingual readiness plan: toggle or routing model, Arabic-aware search and labels, Arabic customer-service surfaces, and native Arabic trust/help language at the right steps.

### P2

#### P2. The footer leaks roadmap instead of confidence
- Page / flow: Global footer.
- Violated principle: Minimalist design, credibility, no dead-end navigation.
- Evidence: The footer exposes multiple disabled `Coming soon` controls in [`web/src/components/Footer.tsx`](../web/src/components/Footer.tsx).
- Shopper impact: Instead of closing the experience with confidence, the footer reminds the user what is missing.
- Exact structural fix: Either publish minimal live pages or remove those controls until they are real. Keep the footer focused on trust, contact, and next-step discovery.

#### P2. Search IA may be more segmented than the current catalog needs
- Page / flow: Search results tabs and mobile filter sheet.
- Violated principle: Minimalist design, efficiency.
- Evidence: Search splits results into `Designs`, `Vibes`, and `Artists` tabs in [`web/src/pages/Search.tsx`](../web/src/pages/Search.tsx), while the current catalog remains relatively compact.
- Shopper impact: Users may do more UI switching than actual product evaluation.
- Exact structural fix: Consider a blended search results page with grouped sections and one primary results grid, while preserving scoped filters when necessary.

#### P2. Performance budget is at risk for the 3-second immersion target
- Page / flow: First load, especially mobile.
- Violated principle: Mobile friendliness, perceived performance, immersion target.
- Evidence: Production build output is currently `445.04 kB` JS and `125.53 kB` CSS before gzip. The app also pulls Google Fonts and Material Symbols from the network in [`web/index.html`](../web/index.html).
- Shopper impact: On slower mobile connections, the experience can feel heavy before the visual story lands.
- Exact structural fix: Reduce font families, consider self-hosting fonts/icons, trim CSS/JS, and make sure the hero image pipeline stays optimized around the first viewport only.

## Page-Level Test Results

### First impression
- Homepage: Pass for immediate brand promise and dominant image. Partial fail for unified follow-through after the hero.
- Shop by Vibe hub: Pass for image-led immersion. Partial fail for taxonomy clarity because the global nav still says `Collection`.
- Vibe collection hero: Pass for mood and dominant CTA. Partial fail because proof/story sits below browsing controls.
- PDP: Pass. This is currently the clearest buying screen on the site.

### Discovery tasks
- Find a mood-led design: Pass via `/vibes`.
- Find a gift-ready option: Pass via `/occasions` and cart gift upsell.
- Browse by artist: Fail. The site hints at this mode but does not deliver a real artist destination.
- Recover from no-results or over-filtered states: Partial pass. The site provides reset actions, but the search experience is still not predictive enough.
- Search in Arabic or with typo-heavy intent: Fail structurally. There is no real Arabic readiness or typo-tolerant autocomplete layer.

### Conversion tasks
- Enter from homepage and reach a product: Pass.
- Choose size and add to bag from PDP: Pass.
- Use quick view and add to bag: Pass, though the quick view keeps the brand very dark and modal-heavy.
- Understand cart upsell without distraction: Pass.
- Complete guest checkout with visible shipping and COD: Pass.
- Verify trust and support after purchase: Fail due to placeholder WhatsApp, generic Instagram, and disabled policy surfaces.

### Accessibility and responsiveness
- Keyboard-only navigation through overlays and drawers: Mostly pass.
- Reduced-motion behavior: Pass.
- Touch-target sizing: Mostly pass.
- Contrast reliability: Partial fail on image-overlaid white text because contrast depends on photography and semi-transparent scrims rather than guaranteed solid surfaces.
- Cognitive clarity: Partial fail where labels and browse modes drift between `Collection`, `Vibe`, `Occasion`, and `Artist`.

## Override Decisions Where Guidelines and Best Practice Differ
- Prefer concrete customer-facing labels over romantic or vague labels. This is why `Shop by Vibe` should win over `Collection`.
- Keep checkout visually clearer than the rest of the site even if that means less glass and decoration. External ecommerce practice and the internal guide both support clarity-first checkout.
- Keep images dominant, but not at the expense of contrast or credibility. WCAG and trust beat art direction when they conflict.
- If the current live vibe names are the real merchandising taxonomy, update the guideline to match. If the guideline taxonomy is the real brand direction, remap the live site to it. One system only.

## Recommended Execution Order

### Phase 1
- Fix all trust-critical placeholders and dead-end footer links.
- Lock the final discovery taxonomy and nav labels.
- Decide whether `Browse by Artist` is shipping or being removed from the live IA for now.

### Phase 2
- Replace placeholder imagery with a real editorial image system.
- Standardize merch cards to carry artist legitimacy consistently.
- Tighten homepage and collection-page story sequencing.

### Phase 3
- Upgrade search prominence, autosuggest, typo tolerance, and Arabic readiness.
- Improve checkout continuity and truthful post-purchase states.
- Reduce first-load asset weight and external font dependency.

## Source References
- Internal brand guide: [`HORO_Brand_Guidelines_v2.3_Consolidated.md`](../HORO_Brand_Guidelines_v2.3_Consolidated.md)
- App routes: [`web/src/App.tsx`](../web/src/App.tsx)
- Global nav: [`web/src/components/Nav.tsx`](../web/src/components/Nav.tsx)
- Footer: [`web/src/components/Footer.tsx`](../web/src/components/Footer.tsx)
- Homepage: [`web/src/pages/Home.tsx`](../web/src/pages/Home.tsx)
- Vibe hub and collection: [`web/src/pages/ShopByVibe.tsx`](../web/src/pages/ShopByVibe.tsx), [`web/src/pages/VibeCollection.tsx`](../web/src/pages/VibeCollection.tsx)
- Occasion hub and collection: [`web/src/pages/ShopByOccasion.tsx`](../web/src/pages/ShopByOccasion.tsx), [`web/src/pages/OccasionCollection.tsx`](../web/src/pages/OccasionCollection.tsx)
- PDP and quick view: [`web/src/pages/ProductDetail.tsx`](../web/src/pages/ProductDetail.tsx), [`web/src/components/ProductQuickView.tsx`](../web/src/components/ProductQuickView.tsx)
- Search: [`web/src/pages/Search.tsx`](../web/src/pages/Search.tsx), [`web/src/search/view.ts`](../web/src/search/view.ts)
- Cart and checkout: [`web/src/pages/Cart.tsx`](../web/src/pages/Cart.tsx), [`web/src/pages/Checkout.tsx`](../web/src/pages/Checkout.tsx), [`web/src/pages/OrderConfirmation.tsx`](../web/src/pages/OrderConfirmation.tsx)
