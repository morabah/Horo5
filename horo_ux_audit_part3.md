# HORO UX/UI Audit — Part 3
## Mobile, Checkout, Implementation Backlog, Experiments, Action Plan

---

# 10. Mobile-First Review

## Assessment Summary

| Dimension | Assessment | Evidence Type |
|-----------|-----------|---------------|
| **Content density** | Moderate — PDP has high info density with measurements, delivery, artist, gift sections. May require excessive scrolling. | Inferred from content structure |
| **Image prominence** | Unknown — images are client-rendered. If they load large and fast, good. If they lazy-load below fold, bad. | Needs testing |
| **Readability** | Copy is well-written and concise. Product hooks are 1 sentence. Trust badges use bullet format. | Observed |
| **CTA visibility** | No "Add to Bag" button in SSR. If it's below the fold on mobile, critical issue. | Observed |
| **Sticky CTA** | Footer bar shows product name + size + badges. May be sticky but not confirmed. No explicit sticky "Add to Bag" button. | Inferred |
| **Scrolling burden** | PDP contains: hero, name, description, artist, price, size, measurements, exchange note, trust badges, artist section, quality details, delivery estimate, delivery details, trust list, gift section, cross-sell, sticky footer — that's ~12 sections. | Observed — heavy |
| **Menu behavior** | Mobile nav shows hamburger-style (Shop All, Feelings, Gifts, About). Unknown if it's slide-out or full-screen. | Inferred |
| **Tap target size** | Unknown — cannot measure pixel sizes from HTML. Size selector buttons need minimum 48×48px. | Needs testing |
| **Page speed** | Heavy JS dependency (entire pages empty without JS). Next.js with Medusa backend = potentially heavy initial bundle. | Inferred — likely slow on 3G |
| **Image loading** | Images are likely served via Medusa/CDN. If using `next/image` with proper sizing, acceptable. If not, oversized images on mobile. | Needs testing |
| **Layout shift** | Client-rendered content = high CLS risk. Products loading after initial paint cause visible layout shifts. | Inferred — likely high CLS |
| **Accessibility** | Skip-to-content links exist ("Skip to main content", "Skip to collection"). Breadcrumbs present. Semantic headings used. | Observed — basics covered |

## Critical Mobile Issues

1. **No sticky "Add to Bag" CTA**: On a PDP with 12+ sections, the buy button must follow the user. If it's only at a fixed position, mobile users scrolling through delivery details and artist info will lose the CTA.

2. **Heavy JS dependency = blank mobile pages**: On Egyptian 3G/4G networks (average 10-15 Mbps, often less), a JS-dependent page can take 5-10 seconds to render. Users see nothing and leave.

3. **Size selector not confirmed as mobile-friendly**: Size buttons must be minimum 48×48px with 8px gaps. If they're small text links, mobile users will mis-tap.

4. **No floating WhatsApp button**: Egyptian mobile users expect WhatsApp access from any page. A floating button (bottom-right, above the sticky CTA) is standard.

## Mobile Recommendations

1. Add a sticky bottom CTA bar: `[Add to Bag — 899 EGP]` fixed to the bottom on all PDP scroll positions
2. SSR critical content to eliminate blank-page risk on slow networks
3. Ensure size selector buttons are 48×48px minimum with clear selected state
4. Add floating WhatsApp button
5. Optimize images for mobile viewport (use `next/image` with `sizes` prop)
6. Lazy-load below-fold sections (artist detail, cross-sell) but SSR above-fold content
7. Test with Chrome DevTools throttling to 3G to simulate Egyptian mobile experience

---

# 11. Checkout and Conversion Flow

## Current State

| Element | Present? | Evidence |
|---------|----------|---------|
| Cart page | ⚠️ | Shows "Loading your bag…" only |
| Checkout steps | ⚠️ | Breadcrumb shows 3 steps (Home → Cart → Checkout) but no form visible |
| Guest checkout | ❓ | Unknown — no form visible |
| COD visibility | ❌ at checkout | Only visible on PDP |
| Prepaid option | ❓ | Unknown |
| Shipping cost | ❌ | "Final speed and shipping cost are confirmed at checkout" — not shown before |
| Delivery estimate | ❌ at checkout | Only on PDP |
| Progress indicator | ⚠️ | Breadcrumb serves as progress but no step indicator (1 of 3, etc.) |
| Form validation | ❓ | Unknown |
| Error recovery | ❓ | Unknown |
| Order summary | ❌ | Not visible in checkout SSR |
| Exchange policy | ❌ at checkout | Not visible near payment |
| WhatsApp help | ❌ | Broken sitewide |
| Confirmation page | ❓ | Cannot access without order |

## Checkout Recommendations

### What to remove:
- Account creation requirement (if present) — force guest checkout first
- Any marketing opt-in that blocks checkout flow
- Unnecessary address fields (apartment, building name — make optional)

### What to combine:
- Contact + Shipping into one form step
- Payment + Confirmation into one step
- **Ideal: 2-step checkout (Info → Pay)**

### What to delay:
- Account creation → offer after purchase
- Email marketing opt-in → offer after purchase
- Upsell suggestions → show in cart, not checkout

### What to prefill:
- City from phone number area code (Egyptian numbers)
- Cairo/Giza as default shipping region
- COD as default payment method (most trusted for first-time buyers)

### What to simplify:
- Phone field: accept any Egyptian format (+20, 010, 011, 012, 015)
- Address: single free-text field + city dropdown + governorate dropdown
- Name: single "Full name" field, not first/last

### What reassurance to add:
- "COD available — pay when it arrives" above payment selector
- "Free exchange within 14 days" near the "Place Order" button
- "Need help? WhatsApp us" link near the form
- Order summary with product image + size + price visible throughout
- "Your order is secure" badge near payment
- Delivery estimate shown in checkout: "Arrives May 1–7"

### Recommended Checkout Flow

```
Step 1: Your Info
├── Full name
├── Phone number (with Egyptian format hint)
├── City / Area (dropdown)
├── Delivery address (free text)
├── [Optional: Apartment/Floor/Building]
├── Gift wrap toggle (79 EGP)
├── Gift message (if gift wrap selected)
└── [Continue to Payment →]

Step 2: Pay & Confirm
├── Order summary (image + name + size + price)
├── Delivery estimate: "Arrives May 1–7"
├── Shipping cost: "XX EGP" (or "FREE" if above threshold)
├── Payment method:
│   ├── ● COD — Pay on delivery
│   ├── ○ Card (Visa/Mastercard)
│   └── ○ Digital wallet (Fawry/InstaPay)
├── Total: XXXX EGP
├── "Free exchange within 14 days"
├── "Need help? WhatsApp us"
└── [Place Order — XXXX EGP]
```

---

# 12. Implementation Backlog

## Quick Wins (Low Effort, High Impact)

### QW-1: Activate WhatsApp Support Link
- **Component**: Footer, FAQ, Exchange, Size Guide, PDP
- **Change**: Replace "Live support links appear here as soon as they are activated for this build" with actual WhatsApp link: `https://wa.me/20XXXXXXXXXX?text=Hi%20HORO`
- **Expected impact**: +15-25% trust signal; reduces support-seeking abandonment
- **Effort**: Low (1 hour)
- **Priority**: P0 — Fix immediately
- **Dependencies**: WhatsApp Business number
- **Acceptance criteria**: Every "Contact HORO" section links to WhatsApp. Floating WhatsApp button on mobile. Link works and opens WhatsApp with pre-filled message.

### QW-2: Add Trust Strip to Homepage
- **Component**: Homepage layout, above or below hero
- **Change**: Add horizontal strip with 4 items: "Artist-Made Designs" | "COD Available" | "Free Exchange 14 Days" | "Premium Cotton"
- **Expected impact**: +10-15% homepage engagement; reduces bounce rate
- **Effort**: Low (2-3 hours)
- **Priority**: P0
- **Dependencies**: None
- **Acceptance criteria**: Trust strip visible in SSR. Visible in first viewport on mobile. Uses icon + text format.

### QW-3: Fix Navigation Consistency
- **Component**: Header navigation across all pages
- **Change**: Standardize all pages to: "Shop All | Feelings | Gifts | About". Remove "Occasions" from footer nav or alias it to "Gifts & Occasions".
- **Expected impact**: Reduces navigation confusion; marginal conversion lift
- **Effort**: Low (1-2 hours)
- **Priority**: P1
- **Dependencies**: None
- **Acceptance criteria**: Same nav labels on every page. No mismatch between "Gifts" and "Occasions".

### QW-4: Add GSM to Material Description
- **Component**: PDP quality section
- **Change**: Change "premium cotton" to "220 GSM premium cotton" (or actual GSM). Change "Cotton tee" to "220 GSM cotton tee".
- **Expected impact**: Increases quality perception; reduces "is this cheap?" doubt
- **Effort**: Low (30 minutes)
- **Priority**: P1
- **Dependencies**: Actual GSM data from manufacturer
- **Acceptance criteria**: GSM number visible on every PDP in the material section.

### QW-5: Fix Dimensions Data on Midnight Compass
- **Component**: PDP for Midnight Compass (`/products/midnight-compass`)
- **Change**: Remove or fix "Weight: 12" and "Dimensions (L × W × H): 15 × 20 × 120" — these are nonsensical for a T-shirt and look like shipping data leaking into product info.
- **Expected impact**: Removes unprofessional appearance
- **Effort**: Low (15 minutes)
- **Priority**: P1
- **Dependencies**: Medusa product data update
- **Acceptance criteria**: No shipping dimensions shown as product specs. Only garment measurements shown.

### QW-6: Add Floating WhatsApp Button (Mobile)
- **Component**: Global layout
- **Change**: Add a floating green WhatsApp icon button, fixed to bottom-right of viewport (above sticky CTA if present), 56px diameter, with `wa.me` link.
- **Expected impact**: +5-10% WhatsApp inquiries → higher conversion for hesitant buyers
- **Effort**: Low (1-2 hours)
- **Priority**: P0
- **Dependencies**: QW-1 (WhatsApp number)
- **Acceptance criteria**: Button visible on all pages on mobile. Does not overlap CTA. Opens WhatsApp with pre-filled message.

## Medium-Effort Improvements

### ME-1: SSR Product Cards on Homepage
- **Component**: Homepage, product card components
- **Change**: Fetch product data server-side (via Medusa API in `getServerSideProps` or RSC) and render 6-8 product cards with images, names, artists, prices in the initial HTML.
- **Expected impact**: +20-30% homepage engagement; eliminates blank-page risk on slow networks; major SEO improvement
- **Effort**: Medium (1-2 days)
- **Priority**: P0
- **Dependencies**: Medusa API access from SSR, image optimization pipeline
- **Acceptance criteria**: Homepage HTML contains at least 6 product cards with `<img>` tags, product names, prices. Page renders meaningfully without JS. Google can index product content.

### ME-2: SSR Add-to-Bag Button on PDP
- **Component**: PDP buy section
- **Change**: Server-render the "Add to Bag — [price] EGP" button. It can be non-interactive initially (hydrated with JS for actual cart functionality), but must be visible in HTML.
- **Expected impact**: +15-20% add-to-cart rate on slow connections
- **Effort**: Medium (4-8 hours)
- **Priority**: P0
- **Dependencies**: None
- **Acceptance criteria**: "Add to Bag" button text and price visible in page HTML. Button is styled and positioned correctly before JS loads.

### ME-3: Add Sticky Mobile CTA on PDP
- **Component**: PDP layout
- **Change**: Add a fixed-bottom bar on mobile that shows: `[Add to Bag — 899 EGP]` and stays visible while scrolling through product details.
- **Expected impact**: +10-20% mobile add-to-cart rate
- **Effort**: Medium (4-8 hours)
- **Priority**: P0
- **Dependencies**: ME-2
- **Acceptance criteria**: Sticky bar visible on mobile at all scroll positions. Does not overlap content. Shows price. Tap target ≥ 48px height. Hides on scroll-up to reduce visual clutter.

### ME-4: Add Visual Size Chart Table
- **Component**: Size guide page + PDP inline size guide
- **Change**: Create an HTML table with S/M/L/XL columns and Chest/Length/Shoulder/Sleeve rows. Add a "Size Guide" modal/drawer accessible from PDP size selector.
- **Expected impact**: -15-25% size-related abandonment; -20-30% size exchange rate
- **Effort**: Medium (1 day)
- **Priority**: P1
- **Dependencies**: Measurement data for all sizes
- **Acceptance criteria**: Size chart table renders in SSR. Accessible via modal from PDP. Shows model reference photo. Responsive on mobile.

### ME-5: Add Sort/Filter to Collection Pages
- **Component**: Collection listing pages (`/feelings/mood`, `/occasions/gift-something-real`, `/products`)
- **Change**: Add sort dropdown (Featured / Price Low-High / Price High-Low / Newest). Add filter panel for Shop All (Feeling, Price, Fit, Size).
- **Expected impact**: +10-15% product-to-PDP click-through rate
- **Effort**: Medium (2-3 days)
- **Priority**: P1
- **Dependencies**: Product metadata (price, date, stock)
- **Acceptance criteria**: Sort works without page reload. Filters are collapsible on mobile. URL params update for shareable filtered views.

### ME-6: SSR Cart Page Content
- **Component**: Cart page (`/cart`)
- **Change**: Server-render cart items with images, names, sizes, prices, quantities. Show subtotal, estimated shipping, gift-wrap option, and "Proceed to Checkout" CTA.
- **Expected impact**: Eliminates "Loading your bag…" dead state; reduces cart abandonment
- **Effort**: Medium (1-2 days)
- **Priority**: P0
- **Dependencies**: Cart API server-side access
- **Acceptance criteria**: Cart page shows items without requiring JS. Empty cart shows "Your bag is empty" + "Shop Now" CTA. Filled cart shows item details + subtotal.

### ME-7: Create Artist Profile Pages
- **Component**: New page: `/artists/[name]`
- **Change**: Create pages for Layla Farid, Nada Ibrahim, Omar Hassan. Show artist photo, bio, all products by this artist.
- **Expected impact**: +5-10% time on site for art lovers; strengthens "artist-made" differentiation
- **Effort**: Medium (1-2 days)
- **Priority**: P2
- **Dependencies**: Artist bios and photos
- **Acceptance criteria**: Each artist has a page. PDP artist section links to profile. Profile shows all products. SSR for SEO.

## Major Redesign Priorities

### MR-1: Homepage Redesign with SSR Content Architecture
- **Component**: Entire homepage
- **Change**: Redesign homepage with server-rendered sections:
  1. Hero with product image + "Wear What You Feel" + "Shop Now"
  2. Trust strip (4 icons)
  3. "Shop by Feeling" section (3 category cards with images)
  4. Featured products grid (6-8 products)
  5. "Gifts & Occasions" section (3 occasion cards)
  6. "Why HORO" section (artist-made, quality, exchange)
  7. Artist spotlight (1 featured artist + products)
  8. Instagram/UGC section
- **Expected impact**: +30-50% homepage conversion to product click; major SEO improvement; reduced bounce rate
- **Effort**: High (1-2 weeks)
- **Priority**: P0
- **Dependencies**: All product images optimized, hero image created, content written
- **Acceptance criteria**: Homepage renders complete content without JS. All sections contain real product data from Medusa. Page scores 90+ on Lighthouse performance. Mobile-first responsive design.

### MR-2: Checkout Flow Rebuild
- **Component**: `/cart` and `/checkout`
- **Change**: Build a 2-step checkout with SSR form structure:
  - Step 1: Contact + Shipping (name, phone, city, address)
  - Step 2: Payment + Confirm (COD default, card option, order summary)
  - Gift wrap toggle in Step 1
  - Trust signals near payment button
- **Expected impact**: +20-30% checkout completion rate
- **Effort**: High (1-2 weeks)
- **Priority**: P0
- **Dependencies**: Payment gateway integration, shipping rate API
- **Acceptance criteria**: Checkout works without JS for basic form display. COD is default and prominent. Guest checkout (no account). 2 steps maximum. Mobile-optimized forms. WhatsApp help link visible.

### MR-3: Product Image Pipeline
- **Component**: All product pages, product cards
- **Change**: Ensure every product has 4 images (front on-body, back, flat-lay, print close-up). Optimize for responsive delivery. SSR in product cards.
- **Expected impact**: +20-40% visual merchandising effectiveness; +15-25% conversion on PDP
- **Effort**: High (photography + implementation: 2-4 weeks)
- **Priority**: P1
- **Dependencies**: Product photography, image CDN setup
- **Acceptance criteria**: Every product has 4+ images. Images SSR in product cards. Gallery swipeable on mobile. Print close-up shows DTF quality. All images WebP optimized.

---

# 13. Experiment and Measurement Plan

## Experiment 1: Homepage Trust Strip
- **Hypothesis**: Adding a 4-icon trust strip below the hero will increase homepage → product click-through by 15%
- **Change**: Add trust strip: "Artist-Made | COD | Free Exchange 14d | Premium Cotton"
- **Success metric**: Homepage → product page click-through rate
- **Guardrail**: Bounce rate should not increase
- **Minimum data**: 1,000 homepage sessions per variant
- **Mechanism**: Cognitive fluency + trust anchoring

## Experiment 2: Sticky Mobile CTA on PDP
- **Hypothesis**: A sticky "Add to Bag" button on mobile PDP will increase add-to-cart rate by 20%
- **Change**: Fixed bottom bar with "Add to Bag — [price] EGP"
- **Success metric**: Add-to-cart rate on mobile PDP
- **Guardrail**: PDP bounce rate should not increase (ensures users aren't accidentally tapping)
- **Minimum data**: 500 mobile PDP views per variant
- **Mechanism**: Fitts's Law — reducing distance to CTA increases click probability

## Experiment 3: COD-First vs Card-First Payment Default
- **Hypothesis**: Defaulting to COD as the first payment option will increase checkout completion by 15% for first-time buyers
- **Change**: COD pre-selected as default payment method
- **Success metric**: Checkout completion rate
- **Guardrail**: Prepaid payment share should not drop below 20%
- **Minimum data**: 200 checkouts per variant
- **Mechanism**: Default effect — people tend to accept pre-selected options

## Experiment 4: Free Shipping Threshold
- **Hypothesis**: A "Free shipping over 1,500 EGP" bar will increase AOV by 10%
- **Change**: Announcement bar + cart progress bar showing distance to free shipping
- **Success metric**: Average order value
- **Guardrail**: Conversion rate should not drop (ensure threshold isn't too high)
- **Minimum data**: 300 orders per variant
- **Mechanism**: Loss aversion + goal gradient — users accelerate spending as they approach the threshold

## Experiment 5: Gift Packaging Photo on PDP
- **Hypothesis**: Adding a gift packaging photo to the PDP gift section will increase gift-wrap attach rate by 25%
- **Change**: Add product photo of gift-wrapped package with artist story card
- **Success metric**: Gift-wrap attach rate
- **Guardrail**: PDP conversion rate should not decrease
- **Minimum data**: 500 PDP views per variant
- **Mechanism**: Visual proof reduces uncertainty about gift quality

## Key Metrics to Track

| Metric | Current Baseline | Target |
|--------|-----------------|--------|
| Homepage CTA click-through rate | Unknown | 15%+ |
| Product card click-through rate | Unknown | 8-12% |
| Add-to-cart rate | Unknown | 8-12% |
| Size selection rate | Unknown | 90%+ of add-to-carts |
| Cart-to-checkout rate | Unknown | 60%+ |
| Checkout completion rate | Unknown | 50%+ |
| COD vs prepaid split | Unknown | 70/30 initially, target 50/50 |
| Gift-wrap attach rate | Unknown | 15-25% |
| Average order value | ~800-900 EGP (single tee) | 1,200+ EGP |
| Return/exchange rate | Unknown | <10% |
| WhatsApp help clicks | 0 (broken) | Track from activation |
| Core Web Vitals (LCP) | Unknown (likely >4s) | <2.5s |
| Product-page scroll depth | Unknown | 70%+ reach CTA |

---

# 14. Final Priority Action Plan

## 🔴 Fix Now (This Week)

| # | Action | Impact | Effort | Why |
|---|--------|--------|--------|-----|
| 1 | **Activate WhatsApp support** | High | Low | #1 trust gap. Egyptian buyers need human contact. Currently broken sitewide. |
| 2 | **Add homepage trust strip** | High | Low | First impression trust anchoring. Currently zero trust signals on homepage. |
| 3 | **SSR "Add to Bag" button on PDP** | Critical | Medium | The primary conversion action is invisible without JS. |
| 4 | **Fix nav consistency** (Gifts vs Occasions) | Medium | Low | Prevents navigation confusion. 1-hour fix. |
| 5 | **Fix dimension data** on Midnight Compass | Low | Low | Removes unprofessional appearance. 15-minute fix. |
| 6 | **Add floating WhatsApp button** | High | Low | Standard Egyptian e-commerce pattern. |

## 🟡 Fix Next (Next 2 Weeks)

| # | Action | Impact | Effort | Why |
|---|--------|--------|--------|-----|
| 7 | **SSR homepage product content** | Critical | High | Homepage renders blank without JS — major SEO and mobile issue. |
| 8 | **SSR cart page** | High | Medium | "Loading your bag…" kills high-intent users. |
| 9 | **Add sticky mobile CTA on PDP** | High | Medium | Mobile users lose the buy button after scrolling. |
| 10 | **Build visual size chart** | High | Medium | Size uncertainty is #1 fashion e-commerce abandonment reason. |
| 11 | **Add GSM to material specs** | Medium | Low | Tangible quality proof for skeptical buyers. |
| 12 | **Rebuild checkout flow** | Critical | High | Currently non-functional in SSR. 2-step flow with COD default. |

## 🟢 Fix Later (Month 2+, Post-Launch Data)

| # | Action | Impact | Effort | Why |
|---|--------|--------|--------|-----|
| 13 | **Add sort/filter to collections** | Medium | Medium | Small catalog (35 products) makes this manageable without filters for now. |
| 14 | **Create artist profile pages** | Medium | Medium | Strengthens brand story; not conversion-critical at launch. |
| 15 | **Add product image pipeline** (4 images per product) | High | High | Requires photography investment. Plan and execute systematically. |
| 16 | **Implement free shipping threshold** | Medium | Medium | Needs traffic data to set optimal threshold. |
| 17 | **Add bundle pricing** | Medium | Medium | Needs AOV data to calibrate bundle discount. |
| 18 | **Add Instagram/UGC section** | Medium | Medium | Needs customer content to populate. |
| 19 | **Implement post-purchase referral** | Medium | Medium | Needs baseline repeat purchase data. |
| 20 | **A/B test suite** | High | High | Needs minimum traffic volume (1000+ sessions/week). |

---

# 15. The Single Most Important Change

> **Activate WhatsApp support now.** 
> 
> Every support-facing page on the site currently says: *"Live support links appear here as soon as they are activated for this build."*
> 
> For an Egyptian buyer discovering HORO for the first time — an unknown brand selling 800 EGP T-shirts online — the ability to message a real person on WhatsApp is the difference between "I'll risk it" and "I'll close this tab." 
>
> This is a 15-minute fix that addresses the single largest trust barrier on the entire site. Everything else — SSR, sticky CTAs, size charts, checkout rebuilds — matters less than this one broken link.
>
> Fix it today.
