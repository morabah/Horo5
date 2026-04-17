# HORO Egypt — Visual Design Guideline v2.2
## Complete Website Design Specification
### For Figma, Cursor, and Development

> **This is the single source of truth.** It supersedes all previous visual specs.
> It merges: brand guidelines v2.0 (glassmorphism, classification), v2.1 (palette contrast fixes, typography), and v2.2 (SB7 messaging, 3-act screen structure, checkout UX, trust architecture, testing culture, accessibility).

---

## PART 1 — DESIGN SYSTEM TOKENS

### 1A. Color Palette (v2.1 corrected)

**Tier 1: Backgrounds (surfaces only — never used as text)**

| Name | HEX | Role |
|------|-----|------|
| Papyrus | #F5F0E8 | Default page background, product cards, packaging feel |
| Clean White | #FFFFFF | Checkout fields, image backgrounds, data tables |
| Obsidian | #1A1A1A | Dark sections (proof strip, footer, hero overlays) |

**Tier 2: Text Colors (all pass WCAG AA on their intended backgrounds)**

| Name | HEX | On Papyrus | On White | On Obsidian | Role |
|------|-----|-----------|----------|-------------|------|
| Obsidian | #1A1A1A | 15.3:1 ✅ | 17.4:1 ✅ | — | H1, H2, product names, prices, CTA button text |
| Warm Charcoal | #2C2A26 | 12.6:1 ✅ | 14.3:1 ✅ | — | Body text, descriptions, paragraphs |
| Clay Earth | #816A4F | 4.51:1 ✅ | 5.11:1 ✅ | — | Captions, metadata, artist names |
| Label Brown | #876749 | 4.55:1 ✅ | 5.16:1 ✅ | — | Section labels, navigation links, filter tags |
| Clean White | #FFFFFF | — | — | 17.4:1 ✅ | All text on dark backgrounds |
| Papyrus | #F5F0E8 | — | — | 15.3:1 ✅ | Subheadings on dark backgrounds |
| Stone | #D4CFC5 | — | — | 11.2:1 ✅ | Secondary text on dark backgrounds ONLY |

**Tier 3A: Text-Safe Accents (can be used as text on light backgrounds)**

| Name | HEX | On Papyrus | Role |
|------|-----|-----------|------|
| Deep Teal | #2B7596 | 4.53:1 ✅ | Links, "New In" markers, info text |
| Dusk Violet | #6B4C8A | 6.12:1 ✅ | Mood theme text, "For the one who…" labels |
| Kohl Gold Dark | #896832 | 4.53:1 ✅ | Featured text labels, gold accents as text |
| Nile Dark | #3A4A3F | 6.88:1 ✅ | Cultural pride text |

**Tier 3B: Decorative-Only (never as text on light backgrounds)**

| Name | HEX | Approved Uses |
|------|-----|--------------|
| Ember | #E8593C | CTA button background, sale tags, notification dots, vibe accent dots |
| Desert Sand | #C4956A | Borders, hover highlights, icon strokes on dark backgrounds |
| Kohl Gold Bright | #D4A24E | Badge fills, star icons, quality marks on dark backgrounds |
| Stone | #D4CFC5 | Borders, dividers, disabled fills, size selector default borders |

**BANNED PAIRINGS — never use:**
- Stone text on Papyrus (1.37:1 — invisible)
- Desert Sand text on Papyrus (2.36:1 — unreadable)
- Kohl Gold Bright text on Papyrus (2.04:1 — invisible)
- Ember text on Papyrus at body size (3.12:1 — only acceptable at ≥24px bold)
- White text on Ember on light page backgrounds (3.54:1 — use Obsidian text on Ember instead)

**Glassmorphism Frost Layer (semi-transparent overlays)**

| Name | HEX | Opacity | Use |
|------|-----|---------|-----|
| Glass White | #F8F6F2 | 20–35% | Product card overlay, navigation bar, modals |
| Frost Blue | #E3EFF5 | 15–25% | Trust badges, info panels, size guide overlays |
| Soft Violet | #EDE5F5 | 15–25% | Mood theme overlays, design story cards |
| Warm Glow | #FFF5E6 | 20–30% | Gift cards, CTA hover, featured badges |
| Mint Frost | #E6F5EF | 15–20% | Success states, confirmation moments |

### 1B. Typography (v2.1 corrected)

**Display: Space Grotesk** — Geometric sans-serif, slightly rounded terminals. Warm and modern.
**Body: Inter** — Screen-optimized, outstanding small-size legibility.

| Level | Typeface & Weight | Desktop | Mobile | Color | Line Height |
|-------|------------------|---------|--------|-------|-------------|
| H1 | Space Grotesk 600 | 32px | 26px | Obsidian #1A1A1A | 1.2 |
| H2 | Space Grotesk 500 | 22px | 19px | Obsidian #1A1A1A | 1.3 |
| H3 | Space Grotesk 500 | 17px | 16px | Obsidian #1A1A1A | 1.4 |
| Body | Inter 400 | 17px | 16px | Warm Charcoal #2C2A26 | 1.65 |
| Caption | Inter 400 | 14px | 13px | Clay Earth #816A4F | 1.5 |
| Label | Space Grotesk 500 | 12px | 12px | Label Brown #876749 | 1.3, tracking 0.1em, uppercase |
| Small/Legal | Inter 400 | 12px | 11px | Clay Earth #816A4F | 1.5 |

### 1C. Glassmorphism Specifications

| Property | Value |
|----------|-------|
| Background | Frost color at specified opacity (see above) |
| Backdrop-filter | blur(16px) desktop / blur(10px) mobile |
| Border | 1px solid rgba(255,255,255, 0.18) |
| Border-radius | 16px standard / 12px small / 24px modals |
| Box-shadow | 0 8px 32px rgba(26,26,26, 0.08) |
| Hover shadow | 0 12px 40px rgba(26,26,26, 0.12) with 2px upward shift |

**Use glassmorphism on:** product cards, navigation bar (85% opacity), size guide overlays, add-to-cart modals, theme badges, featured spotlights, customer quote cards, design story cards.

**Never use glassmorphism on:** product photography backgrounds, body text areas, over detailed illustrations, checkout form fields, full-page backgrounds, text-heavy mobile screens.

### 1D. CTA Buttons (v2.1 contrast-fixed)

| Type | Background | Text | Shadow | Use |
|------|-----------|------|--------|-----|
| Primary (light bg) | Ember #E8593C | Obsidian #1A1A1A | Ember shadow | Add to Cart, Checkout, main CTAs |
| Primary (dark bg) | Ember #E8593C | White #FFFFFF | Ember shadow | Hero CTA, dark section CTAs |
| Ghost (light bg) | Transparent | Obsidian, Stone border | None | Continue Shopping, secondary |
| Ghost (dark bg) | Transparent | White, Charcoal border | None | Dark section secondary |

All buttons: Space Grotesk 600, 15px, padding 14px 32px, border-radius 16px.

### 1E. Spacing & Layout

- Page max-width: 1280px content area
- Page margins: 16px mobile / 24px tablet / 64px desktop
- Section vertical padding: 96px desktop / 64px mobile
- Card gap: 16px mobile / 24px desktop
- Touch targets: 48px minimum on all interactive elements (WCAG 2.1)

### 1F. Icons

Lucide icon set. Stroke weight 1.5px. Size: 20px navigation / 24px features / 16px inline.

---

## PART 2 — SB7 MESSAGING STRUCTURE (applies to every page)

Before designing any page, verify it answers these three questions in the first viewport:

1. **Who is the hero?** (The customer and their goal — never the brand)
2. **What is the problem?** (Named explicitly or implied by the design story)
3. **What is the action?** (One primary CTA, visible without scrolling)

**Full SB7 mapping for HORO:**

| SB7 Element | HORO Expression | Visual Location |
|------------|----------------|-----------------|
| 1. Character (customer wants something) | Wants clothing that says something real about identity | Hero headline, product "For the one who…" |
| 2. Problem | "Nothing says what I'm thinking" | The Feeling section, ad copy |
| 3. Guide (brand = empathy + authority) | "We know that feeling" + artist curation + quality proof | Trust strip, artist credit, testimonials |
| 4. Plan | Step 1: Find your vibe → Step 2: Pick your design → Step 3: It arrives at your door | Homepage arc, checkout progress |
| 5. CTA | "Explore the Collection" / "Add to Cart" | One primary per viewport; transitional CTAs secondary |
| 6. Stakes (failure) | Stuck in generic tees that say nothing; giving forgettable gifts | Implied in problem framing — never as dark-pattern urgency |
| 7. Success | "Where'd you get that?" The ownership moment. | Post-purchase, customer stories |

---

## PART 3 — 3-ACT SCREEN STRUCTURE (applies to every page)

Every page is a miniature story: setup → confrontation → resolution.

| Page | Setup | Confrontation | Resolution |
|------|-------|---------------|------------|
| Homepage | "Wear What You Mean" | 5 vibes: which one is you? | Explore CTA |
| Collection | You chose Bold & Loud | 24 designs — which one? | Add to Cart / Quick View |
| Product Detail | "For the one who…" + artist | Can I trust this? (size, quality, delivery) | Select size → Add to Cart |
| Cart | You chose well | Is the total right? | Proceed to Checkout |
| Checkout | Almost done | Payment trust, COD clarity | Place Order |
| Confirmation | "You completed this design" | (No tension — pure resolution) | Track order + Tag us |

**Design rule:** If a screen has confrontation but no resolution (CTA), the user is stranded. If it has no confrontation, it is either unnecessary or misplaced.

---

## PART 4 — PAGES (Design each at 1440px desktop + 390px mobile)

### PAGE 1: HOMEPAGE (7-Section Scroll Storytelling)

**SECTION 1 — Hero (full viewport)**
- SB7 elements in first viewport: Character (1), Problem (2 implied), CTA (5)
- Full-bleed dark background: warm Cairo street, golden-hour illustration photography
- Headline: "Wear What You Mean" — Space Grotesk 700, 56px desktop / 36px mobile, White
- Subline: "Original illustration. Real identity. Made in Egypt." — Inter 400, 20px, Stone
- CTA: "Explore the Collection" — `btn-ember-dark` (White text on Ember — approved on dark bg), centered
- Scroll indicator: animated down-arrow, Stone at 60% opacity
- Interaction note: cursor-reactive parallax (text at one depth, background at another); split-text reveal on load

**SECTION 2 — "The Feeling" (text-only, Papyrus background)**
- SB7 element: Problem (2) — name it explicitly
- Headline: "You know that feeling?" — Space Grotesk 600, 48px / 32px, Obsidian
- Body: "When nothing in your closet says what you're thinking…" — Inter 400, 20px, Warm Charcoal, max-width 640px
- No images, no cards — just words and whitespace. This section breathes.
- Interaction note: kinetic typography on scroll — words assemble word-by-word. "yours" highlights in Ember.

**SECTION 3 — "The Vibes" (primary navigation — 3-act: setup = label, confrontation = choice, resolution = click)**
- Label: "FIND YOUR VIBE" — Label Brown #876749, 12px, tracking 0.1em, centered
- Grid: 5 vibe cards, asymmetric layout (2-col span for first card)
- Each card: aspect 4:5, full-bleed image, dark gradient overlay from bottom, vibe accent dot (10px), name in Space Grotesk 600 28px White, tagline in Inter 14px Stone/80%, hover-reveal "Explore →"
- **Navigation congruence note:** These 5 vibes are a starting hypothesis. After card-sorting with 15–20 users, they may become 6–7. Design the grid to accommodate 5–7 cards without breaking.
- Vibes: Bold & Loud (Ember dot), Soft & Thoughtful (Violet), Proud & Rooted (Nile Dark), Weird & Wonderful (Deep Teal), Cosmic (Kohl Gold Bright)

**SECTION 4 — "The Proof" (trust — SB7 element 3: Guide authority)**
- Obsidian background
- Label: "WHY HORO?" — Desert Sand (valid on dark: 6.51:1)
- 4 glassmorphic badges (Frost Blue at 6–8% on Obsidian): icon (24px, Desert Sand) + text (Inter 500, 14px, Stone)
- Badges: "premium cotton Premium Cotton" (Shield) / "Licensed Original Artwork" (Palette) / "Free Exchange · 14 Days" (RefreshCw) / "Cash on Delivery Available" (Truck)
- Interaction note: counters animate on scroll — "220" counts from 0, "14" counts from 0

**SECTION 5 — "Real Stories" (social proof — SB7 element 7: Success vision)**
- Papyrus background
- Label: "REAL STORIES" — Label Brown
- 3 customer quote cards: Warm Glow glassmorphism, quote mark (Desert Sand 40%), quote in Inter 400 17px Obsidian, avatar + name
- Interaction note: draggable carousel on mobile; parallax between photo and text layers
- Copy must be specific and verifiable: name + city. Never generic "Happy customer" text.

**SECTION 6 — "Latest Drop" (product grid — SB7 element 5: CTA)**
- Papyrus background
- Header: "LATEST DROP" label left / "View All →" Deep Teal right
- 4-column grid (2 on mobile), product cards per component spec below
- Each card is a mini direct-response unit: offer (design), support (artist + story), response (Quick View pill)
- Interaction note: magnetic cursor on hover; staggered fade-in on scroll

**SECTION 7 — "The Invite" (closing CTA — SB7 element 5 + 7)**
- Papyrus background, generous whitespace
- Headline: "Find your word." — Space Grotesk 600, 48px, Obsidian
- Body: "Every design is a word…" — Inter 400, 18px, Warm Charcoal
- CTA: "Explore the Collection" — `btn-ember` (Obsidian text on Ember — light bg)

---

### PAGE 2: COLLECTION / VIBE PAGE

**3-act structure:** Setup (you chose this vibe) → Confrontation (which design is yours?) → Resolution (Add to Cart)

- Hero banner: 40vh, vibe background image, dark gradient
  - Accent dot (12px) + Vibe name (Space Grotesk 600, 40px, White) + Tagline (Inter 400, 18px, Stone) + "24 designs" count
- Filter bar: glassmorphic pills (Label Brown text, Stone border, 12px radius). Active filter: Ember border, Ember/5% bg.
- **One upsell max:** If this is an occasion page (e.g. "Gift Something Real"), show one gift-bundle callout above the grid — Warm Glow glass card, bundle preview + price + CTA. Never two competing promotions.
- Product grid: 3 columns desktop / 2 mobile
- Sort dropdown: right-aligned, Inter 500 13px

---

### PAGE 3: PRODUCT DETAIL PAGE

**3-act structure:** Setup ("For the one who…") → Confrontation (can I trust this?) → Resolution (select size → add to cart)
**Direct-response triad:** Offer (this design at 799 EGP) + Support (5 images, size guide, artist, specs) + Response (Add to Cart)

**Left column (55%) — Image Gallery:**
- Main image: 3:4 aspect, 24px radius. 5 mandatory shots with thumbnails below.
- Active thumbnail: 2px Ember border. Inactive: transparent, hover Desert Sand/50%.
- Shots: 1) Flat lay on warm surface 2) On-body front 3) Lifestyle street 4) Print close-up macro 5) Size reference with model measurements

**Right column (45%, sticky) — Info Panel:**
- Artist credit: 32px avatar + "Illustrated by" (Inter 400, 13px, Clay Earth) + artist name (Inter 500, 15px, Obsidian)
- Design name: Space Grotesk 600, 28px, Obsidian
- Price: Space Grotesk 600, 28px, Obsidian — "799 EGP"
- Design story card: **Soft Violet glassmorphism**, padding 20px
  - "For the one who…" label: Dusk Violet, Inter 500, 13px (6.12:1 on glass — passes)
  - Story text: Inter 400, 15px, Obsidian
- Size selector: S / M / L / XL / XXL buttons. Default: Stone/50% border. Selected: 2px Ember border + Ember/5% bg. Out of stock: diagonal strikethrough.
- "Size Guide" link: Deep Teal + Ruler icon → expands **inline** (not modal — test showed inline reduces exit rate)
- **Add to Cart:** Full-width, Ember bg, Obsidian text, ShoppingBag icon. Disabled at 60% opacity when no size selected.
- **Trust strip below CTA:** Horizontal row: "premium cotton" • "Artist: [name]" • "Free Exchange · 14 Days" • "COD Available" — Inter 500, 14px, Clay Earth

**Mobile sticky CTA bar:** Fixed bottom, glass-nav background (85%), full-width Ember button: "Add to Cart — 799 EGP" in Obsidian text.

**Scarcity (only if real):** If inventory < 5, show "Only [n] left" below price in Ember. Never fake. No countdown timers without a credible, stated reason.

---

### PAGE 4: CART

**3-act:** Setup (you chose well) → Confrontation (is the total right?) → Resolution (Proceed to Checkout)

- Page title: "Your Cart" — Space Grotesk 600, 28px, Obsidian
- Cart items: product thumbnail (80px, 12px radius) + design name + size + artist + price + quantity selector (- / n / +) + remove (X)
- **One upsell only:** Gift bundle upgrade ("Add story card + gift wrap for +200 EGP") OR bundle discount ("Add a 3rd, save 100 EGP"). One button. Never both. Never a "you might also like" grid competing with checkout CTA.
- Order summary: Warm Glow glass card. Subtotal, Shipping, Total — Inter for labels, Space Grotesk 600 for amounts.
  - **Shipping cost visible here, before checkout.** This is the #1 abandonment driver globally. Never hide it.
- "Proceed to Checkout" — full-width Ember CTA (Obsidian text)
- "Continue Shopping" — Ghost button below
- Empty cart: centered message, "Your cart is empty" + CTA to browse

---

### PAGE 5: CHECKOUT (v2.2 — new page spec)

**3-act:** Setup (almost done) → Confrontation (payment trust, delivery clarity) → Resolution (place order)
**Direct-response triad:** Offer (your order) + Support (summary, trust, delivery date) + Response (Place Order)

**Mandatory checkout elements (non-negotiable):**

- **Guest checkout available.** No forced account creation. "Create account" is optional post-purchase.
- **Progress indicator:** "Step 1: Shipping → Step 2: Payment → Step 3: Confirm" — horizontal bar, Space Grotesk 500, active step in Obsidian, inactive in Stone.
- **Order summary with product image** visible at every step — right column on desktop, collapsible top section on mobile.
- **COD as default payment option.** Toggle between "Cash on Delivery" (default, pre-selected) and "Pay with Card" (Paymob). Prepaid incentive: "Save 30 EGP with card payment" — Deep Teal text, subtle, not aggressive.
- **Shipping form:** single column, large fields (48px height), labels above fields (never placeholder-only — WCAG 2.1). Autofill-friendly name attributes.
- **Delivery estimate:** "Estimated delivery: 3–5 business days to Cairo" — visible before Place Order.
- **Exchange policy link:** "Free exchange within 14 days" with link to full policy — visible on payment step.
- **Place Order button:** Full-width Ember with Obsidian text. Below it: "Your data is safe" in Arabic + SSL badge icon — Clay Earth, 13px.
- **No glassmorphism on form fields.** Checkout needs maximum clarity. Use Clean White background for form areas, Papyrus for summary panels. Stone borders on inputs.

**Mobile checkout:** Single column only. Sticky "Place Order" bar at bottom (glass-nav style). No horizontal scrolling.

---

### PAGE 6: ORDER CONFIRMATION (v2.2 — new page spec)

**3-act:** Pure resolution. No tension.
- SB7 element 7: Success — "You completed this design by choosing it."
- Mint Frost glassmorphic card: order number, items with images, estimated delivery, tracking link
- WhatsApp confirmation prompt: "Get delivery updates on WhatsApp" with phone input
- "Tag us in your first wear" — Instagram CTA with @horo.egypt handle
- No upsells on confirmation page. This is the ownership moment, not a sales surface.

---

### PAGE 7: ARTIST PROFILE

- Header: artist avatar (120px circle, Kohl Gold Bright ring) + name (Space Grotesk 600, 32px) + style description (Inter 400, 16px, Clay Earth) + bio (2–3 lines) + portfolio link (Deep Teal)
- Grid of designs by this artist (product card component)
- Label: "DESIGNS BY [NAME]" — Label Brown

---

### PAGE 8: ABOUT / OUR STORY

- Editorial single column, max-width 720px
- Section 1: Brand mantra origin
- Section 2: "The Idea" — what HORO is (SB7 guide introduction: empathy + authority)
- Section 3: "For Who?" — customer as hero (SB7 character)
- Section 4: Artist horizontal scroll
- Full-bleed warm photography between text blocks

---

## PART 5 — REUSABLE COMPONENTS

### Product Card
- Image: 3:4, 16px top radius, Stone/20% placeholder
- Hover: card lifts 4px, glassmorphic "Quick View" pill slides up
- **Text hierarchy (critical — fixed for contrast in v2.1):**
  - Artist: Inter 400, 13px, Clay Earth #816A4F (4.51:1 ✅)
  - Name: Space Grotesk 600, 16px, Obsidian (clearly heavier — visual anchor)
  - Story teaser: Inter 400, 14px, Clay Earth, 1-line truncate
  - **Gap: 8px between story and price** (groups content vs commerce)
  - Price: Space Grotesk 600, 17px, Obsidian
- **Direct-response:** offer (design), support (artist + story), response (Quick View)

### Navigation Bar
- Fixed top, 64px height
- Before scroll: transparent. After scroll: glass-nav (Papyrus 85%, blur 20px)
- Left: "HORO" — Space Grotesk 700, 22px, Obsidian
- Center (desktop): nav links — Inter 500, 13px, Label Brown #876749 (4.55:1 ✅). Hover: Obsidian.
- Right: Search icon + Language pill (glass, Globe icon + "العربية") + Cart icon (ShoppingBag) with Ember badge (Obsidian text)
- **Max ~5–7 nav items.** If testing reveals more vibes needed, nav adapts. Navigation congruence > arbitrary limits.

### Size Selector
- Row of equal buttons, 48px height
- Default: Stone/50% border, Warm Charcoal text, 12px radius
- Selected: 2px Ember border, Ember/5% bg, Ember text
- Out of stock: Stone text, diagonal strikethrough, pointer-events disabled
- **Color is never the only indicator.** Selected uses border + background + text change (WCAG 2.1).

### Trust Strip
- Horizontal row of inline badges
- Light bg version: icon (Lucide, 16px, Deep Teal) + text (Inter 500, 14px, Clay Earth)
- Dark bg version (proof section): icon (Desert Sand) + text (Stone, Inter 500, 14px)

### Checkout Progress Indicator
- Horizontal 3-step bar: "Shipping" → "Payment" → "Confirm"
- Active step: Obsidian text, Ember underline (2px)
- Completed step: Deep Teal text, checkmark icon
- Upcoming step: Stone text

---

## PART 6 — ACCESSIBILITY REQUIREMENTS (WCAG 2.1 AA)

These are mandatory design QA checks, not suggestions:

1. **Contrast:** All text passes 4.5:1 (body) or 3:1 (large ≥18px bold). v2.1 palette enforces this — use only approved pairings.
2. **Focus indicators:** All interactive elements have 2px visible focus ring on keyboard navigation. Never rely on color-only hover.
3. **Alt text:** Every product image has descriptive alt: "HORO 'The Weight of Light' t-shirt, flat lay on linen surface" — not "product image."
4. **Form labels:** Always above fields, always visible. Never placeholder-only.
5. **Touch targets:** 48px minimum on mobile. Verify size selector, nav links, thumbnails.
6. **RTL:** Arabic layout tested on real devices. All directional elements (arrows, padding, alignment) flip correctly.
7. **Reduced motion:** All animations respect `prefers-reduced-motion`. Design a static fallback for every animation.
8. **Color independence:** Selected/active states never communicated by color alone. Size selector, active filter, active nav link all use border/weight/bg changes alongside color.

---

## PART 7 — INTERACTION & MOTION ANNOTATIONS

Mark these in the Figma file as prototype notes:

**Homepage:**
- Hero: cursor-reactive parallax (text and bg at different depths). Split-text reveal on tagline.
- "The Feeling" section: kinetic typography — words assemble on scroll. "yours" highlights in Ember.
- Vibes grid: staggered entrance from bottom, 120ms delay per card. Hover: 102% scale + "Explore →" fade-in.
- Proof badges: counter animation on viewport entry (0 → 220, 0 → 14).
- Customer stories: draggable carousel, internal parallax on quote cards.
- Product grid: magnetic cursor effect. Staggered fade-in, 80ms delay.
- "Find your word": particle text assembly on scroll entry.
- Between sections: SVG line-art drawing animations (stroke-dashoffset on scroll).
- Global: 2px Ember scroll-progress line at very top of viewport.

**All pages:**
- Nav: transparent → glassmorphic crossfade over 300ms on scroll
- CTA buttons: scale(0.98) on press, spring back
- Product gallery: 300ms crossfade between active images
- Modal enter: scale from 95% + opacity from 0, 300ms ease-out
- Mobile menu: slide-down 300ms, links stagger 50ms each
- Cart add: product image shrinks + flies to cart icon, badge bounces, toast slides up
- All animations: check `prefers-reduced-motion` — if active, show static state instantly

**Mobile-specific:**
- Gyroscope parallax on hero (tilt-to-shift)
- Haptic feedback on CTA press (Vibration API, iOS)
- Swipeable product gallery as horizontal carousel

---

## PART 8 — PHOTOGRAPHY DIRECTION

- All photography: warm color temperature (+200K, golden hour feel)
- Flat lays: warm textured surfaces (concrete, linen, raw wood) in Papyrus/Stone/Clay tones. NEVER white cyclorama.
- On-body: real Cairo locations, natural light. Models 20–30, urban diversity. Candid expression — mid-thought, not posing.
- Detail shots: macro close-ups of DTF print texture for quality proof.
- Unisex: same design on different body types.
- Placeholder labels in Figma: describe what each image must contain and its aspect ratio.

**Never photograph:** stock photography, hanger-on-white-wall, heavy retouching, luxury staging (yachts/cars), designs near religious imagery.

---

## PART 9 — SCARCITY & URGENCY RULES

- ✅ "Only 3 left" — acceptable if inventory count is real
- ✅ "Ramadan collection ends March 30" — credible seasonal reason
- ❌ "24-hour flash sale" without explanation — triggers skepticism
- ❌ Fake countdown timers
- ❌ "5 people viewing this" unless real-time tracked
- ❌ "Bestseller" without criteria
- ✅ "142 sold this month" — acceptable if tracked
- ✅ Customer photos with real names + city

---

## PART 10 — TESTING ANNOTATIONS

Mark these in the Figma file as "TEST THIS" annotations on the relevant component:

| Location | What to Test | Why |
|----------|-------------|-----|
| Vibe cards | 5 vs 6–7 categories | Congruence — mental model may not match 5 vibes |
| Product card | Price visible vs hidden | Clarity vs curiosity — test which converts |
| PDP CTA text | "Add to Cart" vs "Get This Design" | Ownership language may convert higher |
| PDP trust strip | Above fold vs below gallery | Position determines DM question volume |
| PDP social proof | Photos vs text quotes | Fashion = visual — but test it |
| PDP size guide | Modal vs inline expandable | Inline may reduce exit rate |
| Checkout | Multi-step vs single page | Multi-step may build COD trust |
| Cart upsell | Gift bundle vs bundle discount | Which lifts AOV without hurting conversion |

**No test ships without:** (1) written hypothesis, (2) single primary metric, (3) minimum 200 paid orders per variant, (4) predetermined decision rule.

---

## DESIGN PRINCIPLES (the final filter)

1. **The illustration is always the hero.** UI frames it, never competes.
2. **Customer is the hero, brand is the guide.** (SB7 + narrative arc aligned)
3. **Every screen answers one dramatic question.** Setup → Confrontation → Resolution.
4. **Trust before story on the product page.** Quality proof = equal priority to narrative.
5. **One primary CTA per viewport.** Transitional CTAs are secondary in hierarchy.
6. **One upsell per cart view.** Never five competing modules.
7. **Shipping cost before checkout.** The #1 abandonment driver, eliminated.
8. **Warm, not cold.** Every surface trends Papyrus. Never clinical blue-white.
9. **Beautiful AND stable.** Page load < 3s on Egyptian 4G. No broken images. SSL visible.
10. **Test everything marked "hypothesis."** Experiments over assumptions.
