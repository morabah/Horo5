# HORO Egypt — Comprehensive UX/UI Design Review

**Assessed Against E-Commerce Best Practices, Academic Sources & Brand Guidelines v2.3**

**Date:** March 2026 | **Scope:** All customer-facing screens (Homepage through Order Confirmation) | **Pages reviewed:** 01-Homepage, 02-Shop by Vibe, 03-Vibe Collection, 05-Occasion Collection, 08-Product Detail, 10-Checkout, 11-Order Confirmation, 12-Search Results + all corresponding .tsx implementations

---

## Executive Summary

HORO's design system is ambitious and largely well-executed. The StoryBrand three-part screen structure (Setup → Confrontation → Resolution) is applied consistently across every page, and the brand's "gallery not catalog" philosophy gives the experience a distinctive editorial quality that separates it from commodity graphic-tee competitors. The warm Papyrus palette, glassmorphism card system, and vibe-based navigation axis create genuine differentiation.

However, the review identifies **23 actionable findings** across the five evaluation areas — some structural, most refinement-level. The most impactful issues cluster around three themes: (1) the homepage scroll depth risks losing the 3-second immersion window for mobile users, (2) several screens lack the image-dominant hierarchy the brand guidelines demand, and (3) the checkout implementation drifts from the wireframe spec in ways that reduce trust at the payment moment. None of these are fatal; all are fixable with targeted changes rather than redesign.

The review is structured to mirror the five evaluation pillars from the brief, with each finding cross-referenced to the relevant academic source and brand guideline section.

---

## 1. Visual Design and Hierarchy

### 1.1 What's Working Well

The design leverages several principles of visual hierarchy identified in the academic literature (Solberg Söilen, 2024, Ch. 12, "Six Core Principles of Visual Hierarchy": size, color, viewing patterns, spacing, typeface, alignment). The hero section uses a full-viewport dark cinematic background with white headline text — a strong Z-pattern entry that places "Wear What You Mean" exactly where the eye lands first. The typographic scale (Space Grotesk for headlines at clamp(1.5rem, 3vw, 2rem), Inter for body, and a distinct label class for metadata) creates three clear tiers of information, which aligns with the literature's recommendation for "subdivisions into titles, subtitles, and text blocks" as a complexity signal that prevents trivial text presentation (Rosen & Purinton, 2004, cited in Kollmann, 2024).

The accent-color system per vibe (Emotions #6B4C8A, Zodiac #D4A24E, Fictious #2B7596, Career #3A4A3F, Trends #E8593C) provides excellent wayfinding. Each vibe's color appears as a dot on cards, a gradient on hero banners, and a highlight on selected states — a consistent coding language that reduces the cognitive load of the five-axis navigation. This maps to the affordance principle: "design aspects that suggest how an object should be used" reduce the learning curve (Solberg Söilen, 2024, Ch. 11.2.5).

The glassmorphism surfaces (glass-vibe-card-footer, glass-trust-badge, warm-glow-glass) are used sparingly and purposefully — never on checkout forms (as the brand guideline §8.4 mandates). This restraint is notable; many fashion sites overuse frosted glass, which hurts readability.

### 1.2 Findings

**Finding 1 — Homepage: Image Dominance Weakens Below the Hero.**
Brand Guideline §8.1 states: "The illustration is always the hero. UI exists to frame it, never compete with it." The hero section delivers on this — the full-bleed lifestyle photograph fills the viewport. However, Section 2 ("The Feeling") is deliberately text-only with no imagery at all. While this is specified as intentional in the wireframe (to "name the problem"), from a visual hierarchy standpoint it creates a visual pause that may feel like a dead zone rather than a dramatic beat, especially on mobile where the user has just seen a rich image and now sees plain Papyrus-background text. Fashion e-commerce leaders like Burberry and Gymshark maintain image density through scroll, using cinematic product displays and editorial imagery at every section transition (INSIDEA, 2026). The StoryBrand approach of "naming the problem" can still work with a subtle background texture or a slow-reveal animation to maintain visual momentum.

*Recommendation:* Add a subtle warm-toned background texture or a very restrained parallax shift to Section 2 so the transition from the hero doesn't feel like a drop-off. Do not add product images here — that would compete with the hero — but consider a soft gradient or linen-texture pattern to keep the warmth. This preserves the StoryBrand "problem" beat while maintaining the 3-second immersion window.

**Finding 2 — Shop by Occasion Page: Missing Visual Anchors.**
The ShopByOccasion.tsx implementation shows the first occasion (Gift Something Real) as a featured card with an image, but occasions 2–5 render as text-only cards (name + blurb + "Explore →" link). In an image-dominant brand, having four navigation cards without any visual content contradicts §8.1. The F-pattern reading behavior (Solberg Söilen, 2024, Ch. 10.6) means users scanning from left to right and then down will encounter text blocks where they expect imagery.

*Recommendation:* Add a representative product image or occasion-themed illustration to each secondary occasion card. Even a 96px thumbnail in each card would anchor the visual hierarchy.

**Finding 3 — Product Card Grid: Price Hierarchy Inconsistency.**
In VibeCollection.tsx and OccasionCollection.tsx, price is displayed with template literal formatting (`{priceEgp} EGP`) without locale formatting. On the Cart and Checkout pages, prices use comma formatting ("1,598 EGP"). The inconsistency is subtle but runs counter to the "consistency and standards" heuristic (Nielsen, 1994) and the brand guideline §7.1 which establishes 799 EGP as the anchor price. All price displays should use the same formatting convention.

*Recommendation:* Standardize all price rendering through a shared formatting utility (e.g., Intl.NumberFormat or a simple helper) so "799 EGP" always appears identically across cards, PDP, cart, and checkout.

---

## 2. Usability and Interaction Design

### 2.1 Nielsen's 10 Heuristics Assessment

| Heuristic | Grade | Notes |
|-----------|-------|-------|
| Visibility of system status | Strong | Progress indicator in checkout (3 steps), breadcrumbs on collection pages, nav scroll-spy showing "Reading · [vibe]" on homepage |
| Match between system and real world | Strong | Language is natural, customer-centric ("Find Your Design," "Which vibe is yours?"), avoids internal jargon |
| User control and freedom | Moderate | "← Back to cart" in checkout is good; however, the homepage vibe lookbook has complex scroll-spy + sessionStorage + ?vibe= state management that may produce unexpected scroll jumps on return visits |
| Consistency and standards | Moderate | Some styling inconsistency between Tailwind-class pages (ShopByVibe) and inline-style pages (ShopByOccasion, Cart, Checkout) — covered in Finding 4 |
| Error prevention | Moderate | Size selector disables out-of-stock sizes; no form validation shown in checkout implementation |
| Recognition rather than recall | Strong | Vibe accent dots provide consistent color coding; breadcrumbs show location |
| Flexibility and efficiency | Needs work | No quick-view, no filter/sort on collection pages, no saved preferences — acceptable for MVP but flagged |
| Aesthetic and minimalist design | Strong | Clean, uncluttered, generous whitespace, one CTA per viewport |
| Help users recognize/recover from errors | Needs work | No error states shown for checkout forms; empty search result state is well handled |
| Help and documentation | Moderate | Size guide modal specified but not implemented in current code; no FAQ or help section visible |

### 2.2 Findings

**Finding 4 — Inconsistent Styling Approach Across Pages.**
ShopByVibe.tsx uses Tailwind utility classes throughout, while ShopByOccasion.tsx, Cart.tsx, Checkout.tsx, and OccasionCollection.tsx use inline `style={{...}}` objects with CSS custom properties. This dual approach doesn't directly affect the user, but it creates maintenance risk and makes it harder to enforce consistent spacing, typography, and responsive behavior across pages. The academic literature on e-commerce site quality emphasizes that "the entire website should follow a consistent design line to ensure easy recognition and orientation" (Rosen & Purinton, 2004; Kollmann, 2024).

*Recommendation:* Standardize on one approach (preferably Tailwind, since the design token system is already built there) to ensure spacing, font-family, and responsive breakpoints behave identically.

**Finding 5 — Checkout Form Lacks Validation and Error States.**
The Checkout.tsx implementation has bare input fields with no validation, no error messages, and no required-field visual indicators beyond label asterisks. Section 8.4 of the brand guidelines mandates "48px touch targets" and "maximum clarity," but the current implementation doesn't prevent empty submissions or guide users through errors. The e-commerce literature identifies form errors as a significant abandonment driver: "helping users recognize, diagnose, and recover from errors" is one of Nielsen's core heuristics, and checkout is the single highest-stakes place to apply it (Solberg Söilen, 2024, Ch. 10.9.1; Kim & Lee, 2002).

*Recommendation:* Add inline field validation with clear error messages in a warm tone ("We need your email to send order updates"), a visual red/ember indicator on the field border, and disable the "Continue" button until required fields are filled. Keep error messages in the brand voice — perceptive and warm, not robotic.

**Finding 6 — Homepage Vibe Lookbook Scroll Complexity.**
The VibeLookbook component manages: URL ?vibe= query parameters, sessionStorage for return state, IntersectionObserver for scroll-spy, scrollTo for horizontal card strip, and data-attributes for nav updates. While architecturally sound, this layered interaction model creates risk of unexpected behavior when users navigate away and return (e.g., being scrolled to a mid-page editorial block when they expected to see the hero). The literature on mobile interface design warns against complexity that "overwhelms users" and recommends "designing a linear story with essential content" for mobile (Solberg Söilen, 2024, Ch. 13.10).

*Recommendation:* Simplify the return-to-homepage behavior. Consider clearing the sessionStorage vibe key on every fresh page load (not just on explicit "Vibe menu" taps), so users always start at the hero. Let the ?vibe= deep link be the only way to scroll into a specific editorial.

**Finding 7 — Affordance Gap on Vibe Cards (Homepage).**
On the homepage, vibe cards display "Read below ↓" — but on the /vibes page, identical card chrome displays "Explore →". While the text differs intentionally (one scrolls to an editorial, the other navigates to a collection), the visual affordance is identical. Users who learned the card interaction on the homepage may expect the same behavior on /vibes, or vice versa. This is a subtle "consistency" issue. The multi-variant UI literature notes that identical visual elements should produce predictable behaviors across contexts (Wasilewski, 2024, Ch. 4).

*Recommendation:* Differentiate the homepage card behavior visually — perhaps a subtle downward-arrow icon animation on the homepage cards vs. a forward-arrow on the /vibes cards — so the affordance signals the different interaction.

---

## 3. Information Architecture and Navigation

### 3.1 What's Working Well

The three-axis navigation (Vibe → Occasion → Artist) is a distinctive information architecture that aligns with the three buyer personas (Self-Expression Buyer enters via Vibe, Gift Buyer via Occasion, Art Lover via Artist). This persona-driven IA structure is supported by the literature: "defining the target market helps customize the website for the ideal user" through "personas which provide deeper understanding of potential customers" (Solberg Söilen, 2024, Ch. 13.7). The five vibes stay within the "5–7 options at a single navigation level" rule (Brand Guidelines §6.4), which aligns with Miller's Law and the IA best practice of manageable choice sets (Chernev et al., 2012, on choice overload).

Breadcrumbs are consistently implemented on collection and product pages. The Home link on vibe collection pages uses `/?vibe={slug}` to return users to the relevant editorial context — a thoughtful deep-linking pattern.

### 3.2 Findings

**Finding 8 — Navigation Item Count May Exceed 7 When Expanded.**
The nav wireframe shows: HORO logo, "Reading · Vibe" context, Search, Menu/hamburger, language toggle, wishlist, and cart. That's 7 items visible on desktop. While the brand guideline says "no more than 5–7 options at a single navigation level" (§6.4), the academic literature on horizontal navigation specifically recommends that "main horizontal navigation panels are simple and ideally contain no more than seven items" (Solberg Söilen, 2024, Ch. 12). With the scroll-spy "Reading · Emotions" label potentially adding text width, the nav may feel dense on smaller desktop viewports (1024px).

*Recommendation:* Test at 1024px to ensure the nav doesn't wrap or truncate. Consider collapsing the language toggle and wishlist into the hamburger menu on viewports below 1280px.

**Finding 9 — Search Lacks Auto-Suggestions and Spell-Check.**
The Search.tsx implementation is a client-side filter over the existing product, vibe, and artist arrays. There are no auto-suggestions, no "did you mean?" spell correction, no recent searches, and no trending/popular searches. The brand guideline §6.4 requires "search bar prominent on every page, supporting English and Arabic," and the IA literature calls for search "equipped with helpful features like auto-suggestions, spell-check, and relevant filters" (Solberg Söilen, 2024, Ch. 11.2.4).

For MVP this is acceptable — the catalog is small — but as the product count grows, search needs to evolve. The current three-tab system (Designs, Vibes, Artists) is a good start for faceted results.

*Recommendation:* For the next iteration, add: (a) debounced search-as-you-type with highlighted matches, (b) a "Popular searches" block when the input is empty, (c) basic fuzzy matching for common Arabic/English transliteration variations. Consider an Algolia or Meilisearch integration as the catalog scales.

**Finding 10 — No Filter or Sort on Collection Pages.**
VibeCollection.tsx and OccasionCollection.tsx display product grids with no ability to filter by price, size, or artist, and no sort options (newest, price low-high, etc.). The spec marks these as "future / not in MVP," but the academic literature notes that filter/sort is fundamental to product listing UX: "products are organized into taxonomies and categories such as 'Running Shoes'… each category is tagged with relevant metadata to facilitate accurate product filtering" (Solberg Söilen, 2024, Ch. 11.2.6). For a 5-vibe × N-product catalog, the absence isn't critical now, but it should be prioritized immediately after launch.

*Recommendation:* Implement a minimal sticky filter bar: sort by (Featured / Price: Low to High / Price: High to Low / Newest) as the first iteration. Add size filtering once inventory data is available.

---

## 4. Landing Page and Conversion Optimization

### 4.1 What's Working Well

The homepage follows a clear conversion funnel: Hero (USP + CTA) → Problem empathy ("The Feeling") → Solution discovery (Vibe Lookbook) → Trust proof (badges) → Social proof (quotes) → Latest product → Final CTA. This mirrors the e-commerce process described in the literature: "the customer arrives on the landing page, which is designed to capture their attention and guide them further" through consideration, intent, and purchase phases (Solberg Söilen, 2024, Ch. 10.1).

The CTA naming is excellent. "Find Your Design" is persona-centered (you're finding something that already exists for you, not being sold to), and it maps directly to the StoryBrand framework where the customer is the hero and the brand is the guide. The CTA appears exactly three times: hero, lookbook context, and closing invite — reinforcing §5.1's "one primary CTA per viewport" rule without being repetitive.

The checkout implements every non-negotiable rule from §8.4: guest checkout (no registration), 3-step progress indicator, COD as default, prepaid card incentive ("Save 30 EGP"), order summary with product image at every step, and Arabic trust text on the payment screen.

### 4.2 Findings

**Finding 11 — Checkout Progress Indicator Differs from Wireframe Spec.**
The 10-checkout.md wireframe specifies a visual progress indicator with filled/unfilled dots connected by lines (●─────○─────○), with color states (Ember for current, Obsidian for completed, Stone for upcoming). The Checkout.tsx implementation uses clickable text buttons with underlines ("1. Information — 2. Shipping — 3. Payment") with ember underline on the active step. While functional, the text-button approach lacks the visual momentum of a graphical progress bar. The literature emphasizes that "visual progress indicators reduce perceived complexity and build momentum" (Brand Guidelines §8.4; Solberg Söilen, 2024, Ch. 10.11).

*Recommendation:* Implement the dot-and-line progress indicator as wireframed. The visual metaphor of "filling in" a path toward completion is a stronger momentum signal than text tabs.

**Finding 12 — Shipping Cost Not Visible Before Checkout Entry.**
Brand Guideline §8.4 states: "Shipping cost visible before checkout." In Cart.tsx, shipping is listed as "At checkout" — which technically defers the information. The cart summary shows the subtotal but not the expected shipping range. The academic literature identifies surprise costs as "the #1 abandonment driver globally" (§8.4; Solberg Söilen, 2024, Ch. 10.11). While "At checkout" isn't deceptive, it creates uncertainty.

*Recommendation:* Display "Shipping: from 60 EGP" on the cart page, or show the estimated range "60–120 EGP." This sets expectations before the user commits to the checkout flow.

**Finding 13 — Checkout Steps Are Freely Clickable (No Linear Enforcement).**
The current implementation allows clicking any step label to jump to it (setStep(i) on any button). While this provides user control, it also means a user could jump to "Payment" without filling in contact or shipping information. There's no validation gate between steps. This undermines the progressive-disclosure benefit of a multi-step checkout.

*Recommendation:* Only allow forward progression when the current step's required fields are valid. Completed steps can be revisited freely. This prevents the "empty checkout" scenario while still giving control.

**Finding 14 — Cart Upsell Module Competes with Checkout CTA.**
Brand Guideline §8.5 says "Never show more than one upsell module on the cart page. No 'You might also like' grids competing with checkout CTA." The current Cart.tsx implementation follows this for the single upsell (gift wrap for 1 item, bundle discount for 2+). However, the upsell card uses the same visual weight as the order summary sidebar — both are card-glass surfaces. On mobile, the upsell renders between the line items and the checkout CTA, which could push the "Proceed to checkout" button below the fold.

*Recommendation:* On mobile viewports, either collapse the upsell into a more compact inline banner, or move it below the sticky CTA bar so the primary conversion action stays visible.

---

## 5. Accessibility and Responsiveness

### 5.1 What's Working Well

The brand guidelines mandate WCAG 2.1 AA compliance (§9.1) with specific rules: all text 4.5:1 contrast, large text 3:1, no color as the sole information carrier, keyboard navigation support, and reduced-motion respect. The implementation shows several positive accessibility patterns: focus-visible outlines on vibe cards (focus-visible:outline-deep-teal), aria-hidden on decorative gradients, sr-only labels on search inputs, and the size selector spec uses "border + background + text, not color alone" for selected states (§8.3/§9.1).

The responsive grid strategy is well-considered: product grids use `repeat(auto-fill, minmax(220px, 1fr))` which naturally adjusts from 4 columns on desktop to 2 on mobile without breakpoint jumps. The homepage hero uses `min-h-dvh` (dynamic viewport height) which handles mobile browser chrome correctly.

### 5.2 Findings

**Finding 15 — Touch Target Sizing on Checkout Steps.**
The step labels in Checkout.tsx are styled as buttons with no explicit min-height or padding constraints — they rely on text size and a small paddingBottom. On mobile, these could fall below the 48px minimum touch target specified in §8.4 and the WCAG 2.5.5 guideline. The "← Back to information" and "← Back to shipping" links are also bare text buttons without sizing constraints.

*Recommendation:* Ensure all interactive elements in the checkout have `min-height: 48px` and at least 8px of padding. The back-navigation links should be styled as ghost buttons with adequate touch targets.

**Finding 16 — Alt Text Quality Varies.**
The Hero section has a good descriptive alt: "Model wearing a HORO graphic tee in warm editorial photography." However, in the Cart and Checkout, product thumbnails use `alt=""` (decorative), which is incorrect since they're the primary visual identifier of what's in the order. The brand guideline §9.1 specifies descriptive alt text format: "HORO 'The Weight of Light' t-shirt, flat lay on linen."

*Recommendation:* Replace empty alt attributes in Cart and Checkout order summary images with descriptive text following the §9.1 format: "HORO '[Product Name]' graphic tee."

**Finding 17 — Keyboard Navigation on Vibe Cards.**
ShopByVibe.tsx uses `<Link>` elements for vibe cards, which are natively focusable and keyboard-accessible. Good. However, the homepage VibeLookbook uses `<button>` elements for the same cards (since they trigger scroll + state change, not navigation). The focus ring is specified but the keyboard behavior for the horizontal scroll strip (chevron buttons, scrollTo) may not be fully accessible. Users relying on keyboard should be able to Tab through the five cards and use Enter to activate them.

*Recommendation:* Verify that the horizontal card strip on homepage supports sequential Tab focus across all five cards, and that the chevron scroll buttons are also focusable with visible focus indicators.

**Finding 18 — No Reduced-Motion Implementation Visible.**
Brand Guideline §9.1 states: "All animations respect reduced-motion preferences." The code includes hover transitions (scale-105, translate-y-1, duration-300/500) but no `@media (prefers-reduced-motion: reduce)` queries are visible in the component code. Users who have reduced motion enabled will still see hover zoom, card lift, and page transitions.

*Recommendation:* Add a global `prefers-reduced-motion: reduce` media query that disables transform transitions, reduces animation durations to 0ms, and disables scroll-snap animations.

---

## 6. Additional Findings (Cross-Cutting)

**Finding 19 — Mobile Hero Scroll-Depth vs. 3-Second Immersion Goal.**
The brief states: "I want the client to get immersed immediately within 3 seconds, no distraction and unified message." On mobile, the hero section fills the viewport effectively. However, the hero glass-backdrop container has `overflow-y-auto` and `max-h-[min(72dvh,calc(100dvh-10rem))]` — meaning on very short viewports (older iPhones, landscape), the hero copy itself may scroll internally, creating a scroll-within-scroll interaction that breaks immersion.

*Recommendation:* Remove internal scroll on the hero glass-backdrop for mobile. If the content overflows, reduce the supporting text or the "Starting at 799 EGP" label to fit. The hero should never internally scroll — the entire viewport should be one unified "poster" that invites a single scroll down.

**Finding 20 — Scarcity/Urgency Elements Are Absent (Correctly).**
Brand Guideline §9.2 mandates ethical marketing practices: "Never use fake scarcity tactics, fake countdown timers, or manufactured urgency." The implementation correctly avoids these. However, the absence of any legitimate stock-level information (e.g., "Only 3 left in size M") means the design misses an opportunity for authentic scarcity signaling that the academic literature supports: "Scarcity increases the perceived value of products" (Oetzel & Luppold, 2023, Ch. 29). This can be implemented ethically when stock levels are genuinely low.

*Recommendation:* Once inventory management is live, consider displaying real-time stock indicators on the PDP for sizes with fewer than 5 units remaining. This aligns with ethical marketing while leveraging the scarcity effect.

**Finding 21 — No WhatsApp Integration at Checkout Confirmation.**
Brand Guideline §8.4 specifies "WhatsApp order confirmation" to reduce COD cancellation. The current order confirmation screen (11-order-confirmation.md) shows a success message but no WhatsApp delivery — no opt-in checkbox at checkout, no WhatsApp confirmation CTA on the success page. For the Egyptian market where WhatsApp is the dominant messaging platform, this is a significant missed trust signal.

*Recommendation:* Add a WhatsApp number field (or auto-populate from the phone field) at checkout, with an opt-in toggle: "Send order updates via WhatsApp." On the confirmation page, add a "Track on WhatsApp" deep link.

**Finding 22 — Homepage Scroll Depth: 7 Sections May Lose Mobile Users.**
The homepage is a 7-section scroll story. On mobile, this represents significant scroll depth — hero, feeling, 5 vibe editorials, trust badges, quotes, latest drops, invite. The mobile interface literature warns: "Mobile users prefer not to scroll through extensive content. Designing a linear story with essential content is more effective" (Solberg Söilen, 2024, Ch. 13.10). While the editorial approach is central to the brand identity, mobile engagement data should be monitored to see if users reach the trust section and latest drops.

*Recommendation:* Consider a mobile-specific condensed version where the 5 vibe editorials are presented as expandable summaries rather than full-length articles. Users who want the full story can tap to expand. This preserves the editorial depth while reducing the scroll commitment.

**Finding 23 — Occasion Collection Hero: Low Image Opacity.**
In OccasionCollection.tsx, the hero banner uses a background image at opacity 0.25. This is extremely faint — the image is barely visible, which contradicts the "images should always be dominant" directive and §8.1's "illustration is always the hero." By comparison, the VibeCollection hero uses opacity 0.90, creating a rich immersive banner.

*Recommendation:* Increase the occasion hero image opacity to at least 0.6–0.7, and add a proper scrim gradient (similar to the vibe collection hero) so text remains readable while the image creates atmosphere.

---

## Summary of Priority Actions

**High Priority (Conversion Impact)**

1. Implement visual progress indicator in checkout per wireframe spec (Finding 11)
2. Show shipping cost estimate on cart page (Finding 12)
3. Add form validation and error states to checkout (Finding 5)
4. Add WhatsApp opt-in at checkout and CTA on confirmation (Finding 21)
5. Gate checkout step progression behind validation (Finding 13)

**Medium Priority (Brand Alignment & Usability)**

6. Increase image presence on Shop by Occasion secondary cards (Finding 2)
7. Boost Occasion Collection hero image opacity (Finding 23)
8. Simplify homepage return-scroll behavior (Finding 6)
9. Standardize price formatting across all pages (Finding 3)
10. Fix hero internal scroll on short mobile viewports (Finding 19)
11. Add prefers-reduced-motion support (Finding 18)
12. Fix alt text on Cart/Checkout product images (Finding 16)

**Lower Priority (Iteration & Scale)**

13. Standardize code styling approach (Finding 4)
14. Add filter/sort to collection pages (Finding 10)
15. Enhance search with auto-suggestions (Finding 9)
16. Differentiate homepage vs. /vibes card affordance (Finding 7)
17. Test nav density at 1024px viewport (Finding 8)
18. Consider mobile-condensed vibe editorials (Finding 22)
19. Implement real-time stock indicators once inventory is live (Finding 20)
20. Move mobile cart upsell below sticky CTA (Finding 14)
21. Ensure 48px touch targets on all checkout interactive elements (Finding 15)
22. Verify keyboard navigation on homepage vibe strip (Finding 17)
23. Add warmth texture to "The Feeling" section (Finding 1)

---

## Strategic UX framework — operational addenda

This section operationalizes the Goals → Strategy → Tactics → Implementation → Control model for HORO: **measurable control loops**, **phased expectations for fashion-specific tactics**, and an explicit **ethical boundary** between helpful nudging and dark patterns. Accessibility spans both micro-interaction clarity (Theme 1) and baseline compliance testing (Theme 4); Theme 4 owns WCAG scope and tooling, while Theme 1 owns copy, states, and per-component affordances.

### Appendix A — Metrics, owners, tools, and cadence (by theme)

Use this as the single place to record **baseline** (numeric or procedural), **owner**, **tooling**, and **review cadence**. Update baselines when instrumentation or catalog scale materially changes.

| Theme | Primary metric(s) | Baseline (establish if missing) | Owner | Typical tools | Review cadence |
|-------|-------------------|----------------------------------|-------|---------------|----------------|
| **1 — Core UX/UI** | Step-level form completion; task abandonment on key flows; optional CSAT / in-app rating | First stable period after event tagging (e.g. 2–4 weeks) | Product / UX lead | Analytics funnels; session replay (e.g. Hotjar, FullStory, Microsoft Clarity) | Biweekly funnel review; quarterly Theme 1 checklist audit |
| **2 — IA & navigation** | Median time-to-product (lab or RUM proxy); search-to-purchase conversion; share of queries with zero results | Baseline usability study + 30-day search log export | Product + data / engineering | Search query logs; on-site search analytics; path analysis | Monthly zero-results and backtrack review; post-IA-change comparison |
| **3 — Fashion PDP / personalization** | AOV; cross-sell / rec widget CTR and attributed revenue; return rate (by cohort where possible) | Quarter snapshot before major PDP or widget changes | Merchandising + engineering | E-commerce analytics; returns / OMS data | Monthly widget dashboards; quarterly return comparison |
| **4 — Checkout, mobile, accessibility** | Checkout drop-off by step; mobile vs desktop conversion; **WCAG 2.x Level AA** issues in scoped flows (not ambiguous “100%”) | One-week funnel baseline after checkout stabilizes; initial axe / Lighthouse baseline on core URLs | Engineering + QA | Funnel analytics; RUM (mobile LCP, INP); automated a11y (axe, Lighthouse CI) | Weekly checkout funnel; monthly automated a11y run; remediation backlog |

**WCAG wording:** Target **no known Level AA violations in audited core flows** (browse → PDP → cart → checkout → confirmation), with edge cases tracked in a backlog — rather than an unscoped “100% compliance” claim.

### Appendix B — Theme 3 (fashion experience): MVP vs Phase 2 vs Stretch

Checklist items are **not** all required for launch. Use tags to score maturity without failing a review solely for missing stretch capabilities.

| Checklist item | Phase |
|----------------|--------|
| High-resolution PDP imagery; clear primary gallery | **MVP** |
| Exact garment measurements and sizing guides prominently shown | **MVP** |
| Primary CTAs (“Add to cart”, “Buy now”) highly visible above the fold | **MVP** |
| Cross-sell widgets (“Style it with”, “Similar items”) — rule-based or curated | **MVP** |
| Cross-sell / recommendations **personalized** via ML or behavioral models | **Phase 2** |
| PDP **video** demonstrating drape / fit | **Phase 2** |
| **Live** AR or virtual try-on (device camera / true 3D viewer) | **Stretch** |

**Dependencies (Theme 3):** ML recommendations and live AR imply data pipelines, privacy review, 3D or vendor integrations, and content production — plan these explicitly in Phase 2 / Stretch roadmaps, not as MVP blockers.

### Appendix C — Ethical boundary: digital nudging vs dark patterns

**Digital nudging** (subtle UI that guides decisions without coercion) is acceptable when it is **transparent** (users can see what is being suggested and why), **reversible** (easy undo, clear escape from defaults), and **aligned with stated user goals** (e.g. completing an order they started, seeing true shipping options).

It is **not** acceptable when it **hides material information** (fees, renewal terms, basket changes), **exploits inertia or misdirection** (fake urgency, disguised ads, trick questions), or **removes meaningful choice** — i.e. **dark patterns**. Theme 4’s “no dark patterns” rule takes precedence over any tactic that would otherwise count as nudging.

---

## Sources Referenced

**Academic / Textbook Sources (from Project Knowledge)**

- Solberg Söilen, K. (2024). *Digital Marketing.* Springer. (Chapters 10–13: E-Commerce Website, Information Architecture, Site Structure, Mobile Interface)
- Kollmann, T. (2024). *Digital Business and Electronic Commerce.* Springer. (Chapter 17: Digital Marketing and Electronic Commerce — website design, navigation, user flow)
- Wasilewski, A. (2024). *Multi-variant User Interfaces in E-commerce.* Springer. (Chapters 4–5: Designing dedicated interfaces, evaluation)
- Oetzel, S. & Luppold, A. (2023). *33 Phenomena of Purchasing Decisions.* Springer. (Scarcity Effect, Confirmation Bias, Compromise Effect, Choice Overload)
- von Wachenfeldt, P. et al. (2026). *Fashion Communication in the Digital Age.* Springer. (Art direction, storytelling, visual identity in fashion digital)

**Heuristics & Frameworks**

- Nielsen, J. (1994). 10 Usability Heuristics for User Interface Design.
- WCAG 2.1 AA Guidelines (W3C)
- Miller, D. (2022). *Building a StoryBrand* (2nd Edition) — three-part narrative structure

**Industry References**

- Fashion e-commerce design patterns from Burberry, Gymshark, Calvin Klein, Tommy Hilfiger, Aesop (reviewed via INSIDEA 2026, Vervaunt 2025)
- E-commerce UX trends 2025–2026 (Craftberry, OptiMonk, A-Fresh)

**Internal**

- HORO Brand Guidelines v2.3 (March 2026), all sections
- Page specs: 01-Homepage through 12-Search Results
- Component implementations: Home.tsx, ShopByVibe.tsx, VibeCollection.tsx, ShopByOccasion.tsx, OccasionCollection.tsx, Cart.tsx, Checkout.tsx, Search.tsx
