# HORO UX/UI Audit — Part 2
## Navigation, Visual Merchandising, PDP, Trust, Incentives

---

# 5. Navigation and Information Architecture Review

## Current Navigation Structure

**Homepage/Footer nav:**
- Shop: Shop All, Feelings, Occasions
- Help: Delivery & returns, Size guide, FAQ
- Contact: About, Contact/WhatsApp, Search

**Inner pages top nav:**
- Shop All, Feelings, Gifts, About

**Feelings sub-navigation:**
- Mood → I Care, I Don't Care, Overthinking, Numb
- Exciting (no sub-categories visible)
- Zodiac → Fire Sign (likely more)
- Trends → Streetwear (likely more)
- Career → Ambition (likely more)
- Fiction → Sci-Fi (likely more)

**Occasions sub-navigation:**
- Gift Something Real
- Graduation Season
- Eid & Ramadan
- Birthday Pick
- Just Because

## Navigation Model Assessment

| Model | Clarity | Speed | Emotional Relevance | Discoverability | Cognitive Load | SEO Value |
|-------|---------|-------|---------------------|-----------------|---------------|-----------|
| **Theme-first (current Feelings)** | 7/10 | 6/10 | 9/10 | 7/10 | Medium | Good — "mood tees", "zodiac tees" |
| **Artist-first** | 5/10 | 4/10 | 6/10 | 5/10 | High — users don't know artists yet | Poor for SEO |
| **Style-first** | 6/10 | 7/10 | 5/10 | 8/10 | Low | Good — "oversized tees", "graphic tees" |
| **Occasion-first (current Occasions)** | 8/10 | 8/10 | 8/10 | 9/10 | Low | Excellent — "birthday gift tee Egypt" |
| **Hybrid (recommended)** | 8/10 | 8/10 | 9/10 | 9/10 | Low-Medium | Excellent |

## Recommended Navigation Model: Hybrid (Feeling + Occasion + Browse)

HORO serves two distinct buyer intents: **self-expression** ("I want something that feels like me") and **gifting** ("I want to give something meaningful"). The navigation should serve both without forcing either.

### Recommended Top Navigation Labels

**Desktop:**
```
[HORO Logo]  Shop All  |  Feelings  |  Gifts  |  About  [Search] [Cart]
```

**Mobile hamburger menu:**
```
Shop All
Feelings
  → Mood
  → Zodiac  
  → Trends
  → Career
  → Fiction
  → Exciting
Gifts & Occasions
  → Gift Something Real
  → Birthday
  → Graduation
  → Eid & Ramadan
  → Just Because
About HORO
Size Guide
Delivery & Exchange
FAQ
Contact via WhatsApp
```

### Recommended Homepage Category Blocks

```
[Hero: Product image + "Wear What You Feel" + "Shop Now"]
[Trust Strip: Artist-Made | COD | Free Exchange 14d | Premium Cotton]

[3-column grid:]
  "Shop by Feeling"     "Find a Gift"      "Shop All (35 designs)"
  [Mood card]           [Gift card]         [Grid preview]

[Featured Products: 4-6 product cards with images]

[Artist Spotlight: Small section with artist name + 2 products]

[Why HORO: 3 icons — Artist-Made / Premium Print / Exchange Guarantee]
```

### Recommended Product Filters

For "Shop All" and Search:
- **Feeling**: Mood, Zodiac, Trends, Career, Fiction, Exciting
- **Occasion**: Gift, Birthday, Graduation, Eid, Everyday
- **Price**: Under 800 EGP, 800–900 EGP, 900+ EGP
- **Fit**: Regular, Oversized
- **Size**: S, M, L, XL (with stock indication)

### Recommended Search Suggestions

Pre-populated suggestions when search is focused:
- Popular: "mood", "zodiac", "gift"
- Feelings: "overthinking", "numb", "confident"
- Occasions: "birthday gift", "graduation", "eid"
- Trending: "oversized", "career"

### Collection Naming Rules

1. Use emotional, descriptive names — not generic ones
2. Every collection must have a 1-sentence description
3. Show product count on every collection card
4. Use format: "[Feeling Name] — [1-line hook]"
5. Avoid internal/technical names in customer-facing UI (e.g., "I Care" → could be clearer)

---

# 6. Visual Merchandising Review

> [!WARNING]
> **Limitation**: Visual audit is based on HTML content structure analysis. I could not visually inspect images, colors, typography, or layout rendering because the browser automation tool was unavailable. The following assessment is based on content structure, image tag presence/absence in SSR, and inferred visual behavior.

## Hero Image
- **Observed**: No `<img>` tag or background image reference in homepage SSR HTML
- **Risk**: If the hero relies on client-side rendering, users on slow networks see no visual hook
- **Recommendation**: SSR a high-quality hero image (product on model, editorial style). Optimize with `next/image` for responsive loading. Use WebP format.

## Product Photography (Inferred from PDP Structure)
- **Product images**: Not visible in SSR HTML for product cards or PDP gallery. Likely loaded via Medusa API + client-side rendering.
- **Recommendation**: Each product should have minimum 4 images:
  1. Front on-body (model wearing)
  2. Back on-body
  3. Flat-lay (full garment)
  4. Print close-up (detail shot showing DTF quality)

## Product Cards
- **Content confirmed**: Product name, artist name, feeling/subcategory, price, fit badge (Regular/Oversized)
- **Missing in SSR**: Product thumbnail image, hover state, quick-add
- **Recommendation**: SSR product card images. Add hover/tap to show back view. Include size availability dots.

## Art/Story Visibility
- **Confirmed**: Artist name on every product card and PDP
- **Missing**: Artist photo, artist bio, artist portfolio link, "How this design was made" content
- **Recommendation**: Add a small artist avatar next to the credit. Create artist profile pages. Add "The story behind this design" expandable section on PDP.

## Gift Visuals
- **Confirmed in copy**: "Artist story card included", "Gift wrap add-on at checkout", "No price on the package"
- **Missing**: Photo of the gift packaging, photo of the artist story card, unboxing visual
- **Recommendation**: Add a gift packaging photo to the "Gift Something Real" collection header and to the PDP gift section. This is critical — gift buyers need to see what the recipient will receive.

## Trust Visuals
- **Missing from homepage**: No trust badges, no quality proof images, no print close-ups, no fabric detail shots
- **Present on PDP**: Text-based trust signals (premium cotton, DTF print, exchange policy, COD)
- **Recommendation**: Add visual trust signals — photo of print detail, fabric texture, packaging. Create a "Quality Promise" section with real photos.

## Overall Visual Merchandising Verdict

The site's visual merchandising is **structurally sound but execution-dependent on client-side rendering**. The content architecture (artist credit, feeling categories, gift options, trust signals) is well-designed. However, if product images don't load fast or don't exist in sufficient variety, the visual selling power is severely limited. The priority is:

1. Ensure all product images SSR
2. Add 4-image minimum per product
3. Add gift packaging photos
4. Add trust/quality proof photos
5. Add artist visual content

---

# 7. Product Page Review

## Current PDP Content (Observed from Quiet Revolt & Midnight Compass)

| Element | Present? | Quality |
|---------|----------|---------|
| Product name | ✅ | Strong — evocative names like "Quiet Revolt", "Midnight Compass" |
| Emotional hook | ✅ | "For the one who speaks softly and still moves rooms" — excellent |
| Artwork meaning | ⚠️ | Implied through name + hook but no explicit design story |
| Artist credit | ✅ | "Illustrated by [Name]" — clear and consistent |
| Price | ✅ | "899 EGP" — clear, no cents |
| Size selector | ⚠️ | "Selected size M" shown but no visible selector buttons in SSR |
| Size chart | ⚠️ | Flat measurements shown inline but no table/chart |
| Model size reference | ✅ | "178 cm / 5'10", wearing size M — regular fit" |
| Material/GSM | ⚠️ | "premium cotton" but no GSM number |
| Print durability | ✅ | "High-fidelity DTF", "wash-fast color", "hand stays soft after repeat wears" |
| Delivery estimate | ✅ | Real dates shown: "1 May – 7 May" for standard |
| Express shipping | ✅ | "2–4 business days" option shown |
| COD availability | ✅ | "COD available" in trust badges |
| Exchange policy | ✅ | "Free exchange 14d", "14-day hassle-free returns" |
| WhatsApp support | ❌ | Not on PDP; broken on support pages |
| Gift option | ✅ | "Make it a gift they'll keep" section with details |
| Sticky mobile CTA | ⚠️ | Footer bar shows "product name + size + badges" — may be sticky but can't confirm |
| Reviews/social proof | ❌ | No reviews section |
| Product image gallery | ⚠️ | Not visible in SSR HTML |
| Scarcity | ✅ (one product) | "Only 2 left" on Midnight Compass |
| Cross-sell | ✅ | "More from this feeling" with 3 related products |

## Recommended Ideal PDP Structure (Top to Bottom)

```
┌─────────────────────────────────────────────┐
│ BREADCRUMB: Home > Feelings > Mood          │
├─────────────────────────────────────────────┤
│ [IMAGE GALLERY]          │ PRODUCT NAME     │
│ 1. Front on-body         │ Emotional hook   │
│ 2. Back on-body          │ ─────────────    │
│ 3. Flat lay              │ PRICE: 899 EGP   │
│ 4. Print close-up        │                  │
│                          │ SIZE: [S][M][L]  │
│                          │ "Model is 178cm, │
│                          │  wearing M"      │
│                          │ [Size guide →]   │
│                          │                  │
│                          │ FIT: Oversized   │
│                          │                  │
│                          │ ═══════════════  │
│                          │ [ADD TO BAG]     │
│                          │  899 EGP         │
│                          │ ═══════════════  │
│                          │                  │
│                          │ ✓ COD available  │
│                          │ ✓ Free exchange  │
│                          │   14 days        │
│                          │ ✓ Ships in 3-7   │
│                          │   business days  │
│                          │ 💬 WhatsApp help │
├─────────────────────────────────────────────┤
│ ARTIST SECTION                              │
│ [Photo] Illustrated by Layla Farid          │
│ "1-line artist bio"                         │
│ [See all by this artist →]                  │
├─────────────────────────────────────────────┤
│ DETAILS (accordion or tabs)                 │
│ ▸ What goes into your piece                 │
│   Cotton tee · DTF print · Unisex fit       │
│ ▸ Delivery & shipping                       │
│   Standard 3-7 days · Express 2-4 days      │
│ ▸ Exchange & returns                        │
│   14-day free exchange · WhatsApp support   │
├─────────────────────────────────────────────┤
│ GIFT SECTION                                │
│ "Make it a gift they'll keep"               │
│ [Gift packaging photo]                      │
│ ✓ Artist story card · ✓ Gift wrap           │
│ ✓ No price on package                       │
├─────────────────────────────────────────────┤
│ MORE FROM THIS FEELING                      │
│ [Product card] [Product card] [Product card]│
├─────────────────────────────────────────────┤
│ STICKY MOBILE CTA (fixed bottom)            │
│ [Add to Bag — 899 EGP]                      │
└─────────────────────────────────────────────┘
```

---

# 8. Trust and Risk Reduction Review

## Risk Matrix with Fixes

### 1. Unknown Brand Risk
- **Current state**: "HORO" is unfamiliar. No press mentions, no social proof, no customer count, no Instagram embed.
- **Gap severity**: 🔴 Critical
- **Fix**: 
  - Add "Trusted by X customers in Egypt" counter (even "100+ pieces sold" for early stage)
  - Embed Instagram feed or UGC section on homepage
  - Add "Featured in" press bar (even if self-published content)
  - Add founder photo/video on About page
  - WhatsApp link for instant human contact

### 2. Quality Risk
- **Current state**: PDP mentions "premium cotton", "High-fidelity DTF print", "wash-fast color". But no GSM number, no fabric close-up photo, no print durability proof.
- **Gap severity**: 🟡 High
- **Fix**:
  - Add fabric GSM: "220 GSM premium cotton"
  - Add print close-up photos showing detail and texture
  - Add "after 10 washes" comparison photo (powerful trust signal)
  - Add video of the printing process (even 15 seconds)

### 3. Fit Risk
- **Current state**: Model measurements provided, flat measurements for M, "Size up — exchange free for 14 days". Good but incomplete.
- **Gap severity**: 🟡 Medium
- **Fix**:
  - Add visual size chart table (S through XL)
  - Add second model reference (different body type)
  - Add "How it fits" video or 360° view
  - Add fit comparison: "Regular fits like standard Zara M" (cultural reference)

### 4. Payment Risk
- **Current state**: "COD available" on PDP trust badges. No details on online payment options.
- **Gap severity**: 🟡 Medium
- **Fix**:
  - Show payment method icons (COD, Visa, Mastercard, Fawry, InstaPay)
  - Mention COD in the homepage trust strip
  - Add "Pay on delivery — no risk" messaging
  - Consider prepaid discount incentive

### 5. Delivery Risk
- **Current state**: Delivery estimates with real dates shown on PDP. "Next-day shipping available within Cairo & Giza." Express and standard options visible.
- **Gap severity**: 🟢 Low (well-handled on PDP)
- **Fix**:
  - Surface delivery estimate on product cards ("Delivers by May 7")
  - Add delivery timeline to cart page
  - Add tracking info to confirmation page
  - Show "Same-day Cairo" badge where applicable

### 6. Exchange Risk
- **Current state**: "Free exchange 14d" on PDP. Exchange policy page exists with clear terms. "Unsure? Size up — exchange free for 14 days" — excellent micro-copy.
- **Gap severity**: 🟢 Low (well-handled)
- **Fix**:
  - Add exchange policy reminder on cart page
  - Add exchange policy reminder near checkout payment button
  - Make the exchange process 1-click via WhatsApp

### 7. Gift Risk
- **Current state**: "Gift Something Real" collection exists. "Artist story card included", "Gift wrap add-on at checkout", "No price on the package" — all good signals.
- **Gap severity**: 🟡 Medium
- **Fix**:
  - Add gift packaging photo (critical — gift buyers need to see the unboxing)
  - Add "Gift exchange guarantee" — if the recipient needs a different size, make it easy
  - Add gift message option at checkout
  - Show delivery date guarantee for gifts ("Order by May 1, arrives by May 5")

### 8. Artist Authenticity Risk
- **Current state**: Artist names (Layla Farid, Nada Ibrahim, Omar Hassan) credited on every product. "Licensed art" badge. "Artist story card included" for gifts.
- **Gap severity**: 🟡 Medium
- **Fix**:
  - Add artist photos and 1-paragraph bios
  - Create artist profile pages with their full collection
  - Add "The story behind this design" section on PDP
  - Show the illustration process (sketch → final)
  - State explicitly: "Original artwork, not AI-generated"

---

# 9. Incentives and Behavioral Economics Review

## Current Incentives Audit

| Incentive | Present? | Where? | Assessment |
|-----------|----------|--------|------------|
| Free shipping threshold | ❌ | Nowhere visible | Missing |
| Bundle pricing | ⚠️ | "from 999 EGP (bundle)" on Gift collection only | Barely visible |
| First-order offer | ❌ | Nowhere | Missing |
| Gift wrap upsell | ✅ | PDP gift section, mentioned in Gift collection | Good but not in cart |
| Prepaid payment incentive | ❌ | Nowhere | Missing |
| COD reassurance | ✅ | PDP trust badges | Good |
| Limited drop messaging | ❌ | No drops/limited editions visible | Missing |
| Referral/gift incentive | ❌ | Nowhere | Missing |
| Cart upsell | ❌ | Cart is empty in SSR | Missing |
| Post-purchase incentive | ❌ | Can't access confirmation | Unknown |

## Incentive Recommendations

### 1. Free Shipping Threshold
- **Should HORO use it?** Yes — highest-impact incentive in Egyptian e-commerce
- **Where?** Announcement bar (top of every page), cart page (progress bar), product cards
- **Why it works**: Mental accounting — users perceive shipping as a "penalty" separate from product cost. A threshold reframes shipping cost as avoidable. Loss aversion makes the threshold more motivating than a flat discount.
- **Suggested implementation**: "Free shipping on orders over 1,500 EGP" (approximately 2 tees). Show progress bar in cart: "Add 601 EGP for free shipping"
- **Risk**: If shipping costs are high, the threshold must be high enough to maintain margin. Test before committing.
- **Test**: A/B test 1,200 vs 1,500 EGP threshold against no threshold. Measure AOV and conversion rate.

### 2. Bundle Pricing (2-Tee Discount)
- **Should HORO use it?** Yes — drives AOV and solves the "one tee isn't enough" hesitation
- **Where?** Product page ("Buy 2, save 100 EGP"), cart page, gift collection
- **Why it works**: Mental accounting — the second item feels "discounted" rather than the order being "bigger". Reciprocity — the brand gives value, the user reciprocates with higher spend.
- **Suggested implementation**: "2 for 1,399 EGP" (save ~100–200 EGP). Show bundle suggestion on PDP: "Add [related product] and save 100 EGP"
- **Risk**: Discounting too early can anchor the brand as "discount brand." Keep the savings modest and frame as "bundle benefit" not "sale."
- **Test**: Show bundle suggestion on PDP vs. no bundle. Measure items-per-order and AOV.

### 3. First-Order Offer
- **Should HORO use it?** Yes, but carefully — HORO is mid-premium and shouldn't look desperate
- **Where?** Exit-intent popup, email capture, welcome bar
- **Why it works**: Reciprocity + endowment effect. A small benefit makes the first purchase feel less risky.
- **Suggested implementation**: "First order? Get free shipping + artist story card" (not a percentage discount — it would cheapen the brand)
- **Risk**: If the offer is too generous, it attracts bargain hunters, not brand-aligned customers.
- **Test**: Free shipping first order vs. 10% off first order vs. no offer. Measure repeat purchase rate, not just first conversion.

### 4. Gift Wrap Upsell
- **Should HORO use it?** Already partially implemented — strengthen placement
- **Where?** Cart page (before checkout), PDP gift section, checkout page
- **Why it works**: Low marginal cost to HORO, high perceived value to buyer. Mental accounting — "50 EGP for premium packaging" feels separate from the product price.
- **Suggested implementation**: "Add artist gift wrap — 79 EGP" with photo of the packaging. Toggle in cart with one tap.
- **Risk**: If gift wrap quality is low, it backfires. Must look premium in photos and in reality.
- **Test**: Measure gift-wrap attach rate. Target 15-25% of orders.

### 5. Prepaid Payment Incentive
- **Should HORO use it?** Yes — reduces COD costs and failed deliveries
- **Where?** Checkout payment selection, cart page
- **Why it works**: Loss aversion — "Save 50 EGP by paying now" makes COD feel like a penalty. Reduces HORO's operational costs.
- **Suggested implementation**: "Pay online and save 50 EGP" or "Free express shipping when you pay online"
- **Risk**: If too aggressive, it undermines COD trust (which is essential for new brand adoption in Egypt).
- **Test**: A/B test: "Pay online, save 50 EGP" vs "COD available (+ 50 EGP handling fee)" vs no differential.

### 6. Limited Drop Messaging
- **Should HORO use it?** Only if real — never fake scarcity
- **Where?** New collection launches, seasonal capsules (Eid, Ramadan)
- **Why it works**: Scarcity + FOMO — but only when authentic. "Eid capsule: 50 pieces, artist-numbered" creates real urgency.
- **Risk**: Fake scarcity destroys trust permanently. Only use for genuinely limited runs.
- **Test**: Launch one genuinely limited collection (30-50 pieces) and measure sell-through speed and social sharing.

### 7. Post-Purchase Incentive
- **Should HORO use it?** Yes — drives repeat purchase
- **Where?** Order confirmation page, order confirmation email, package insert
- **Why it works**: Reciprocity at peak satisfaction moment. "Your next piece, 10% off" or "Share your HORO on Instagram and get 100 EGP off your next order."
- **Suggested implementation**: Package insert with QR code to a referral page.
- **Risk**: Low risk. Don't over-discount — keep it modest and brand-aligned.
- **Test**: A/B test package insert with vs without incentive. Measure repeat purchase rate at 30/60/90 days.
