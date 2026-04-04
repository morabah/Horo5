# HORO Website Update — Cursor Implementation Prompt

> Paste this entire prompt into Cursor. It maps directly to findings from a FACTUM 25 academic review of the HORO brand concept and a secondary Egypt market research report.

---

## Context & Constraints

You are working on the HORO fashion website (`horo-fashion.vercel.app`), a Next.js/React e-commerce brand selling artist-made wearable art printed on Egyptian cotton t-shirts, targeted at Egyptian consumers aged 18–35.

**Core brand positioning:** Artist-led, identity-expression apparel. Buyers don't buy a t-shirt — they buy a chapter of their story.

**Market reality:** Egyptian e-commerce is COD-dominant (98%+), social-commerce first (Facebook/Instagram/WhatsApp account for 93% of purchases), high price-sensitivity, trust-sensitive. The website is a trust asset and catalog, not the primary transaction layer.

**Do not change:** Pricing structure, collection names, artist names, product names, the overall dark aesthetic, or the site's routing structure unless explicitly instructed below.

---

## CHANGE 1 — Replace All Stock Photography References

### Problem
Every product image currently uses Unsplash URLs (`images.unsplash.com`). This destroys brand credibility. The brand verbally promises "we show close-ups and fabric details" while showing generic stock photos — a direct contradiction that signals inauthenticity.

### What to Build
Create a **placeholder photography system** that makes it visually obvious that real product photos need to be inserted, while making the site look intentional and on-brand in the interim.

```
1. Create a component: /components/ProductImagePlaceholder.tsx
   - Displays a dark-background card with the product name, theme tag, and a 
     centered text: "Photography coming soon — [Product Name]"
   - Style: matte black (#111) background, subtle grain texture overlay via CSS,
     product name in large serif or condensed sans-serif, theme tag in accent color
   - Include a small camera icon (lucide-react: Camera) in top-right corner
   - Aspect ratio: maintain the same as current product images (3:4 portrait)

2. Add a data attribute `data-needs-photo="true"` to every product card that 
   still uses an Unsplash source, so the team can easily find and replace them.

3. Create a /components/PhotoGuide.tsx component (visible only in dev mode via 
   process.env.NODE_ENV === 'development') that renders a checklist overlay:
   - Lists every product SKU
   - Shows a red dot next to any still using placeholder/Unsplash
   - Shows a green dot when a real local image is used
   - Position: fixed bottom-right, collapsible

4. Update the image data model to accept: 
   { src: string | null, alt: string, isPlaceholder: boolean }
   If isPlaceholder is true, render ProductImagePlaceholder instead of <Image/>
```

### Photography Brief to Add (as a comment in the data file)
```
// PHOTOGRAPHY REQUIREMENTS PER PRODUCT:
// Shot 1: Full garment flat-lay on matte black surface, natural light
// Shot 2: Garment on model (male or female), waist-up, neutral background
// Shot 3: Macro print close-up showing ink texture and fabric weave (min 800px crop)
// Shot 4: Fabric corner fold showing GSM weight and fabric hand
// Shot 5: Packaged product in gift box (for gift-eligible items)
// Shot 6: Back of garment
// All shots: 2400x3200px minimum, sRGB, exported as WebP
```

---

## CHANGE 2 — Populate the Three-Act Narrative (Act I / II / III)

### Problem
The homepage has three animated section labels — "Act I — The Call", "Act II — The Journey", "Act III — The Return" — but no content under any of them. This is an incomplete brand promise.

### What to Build

**Act I — The Call (Brand Manifesto)**
```
Section layout: Full-width dark section, large editorial typography

Add this copy (editable via a constants file at /lib/brand-copy.ts):

HEADLINE: "Most tees die in the wash. Ours start conversations."

BODY (3 short paragraphs):
Para 1: "Egypt has always had artists. What it has lacked is a 
  system that puts their work on your body instead of on a gallery wall 
  that 90% of people will never enter."

Para 2: "HORO was built on one idea: the art you wear every day 
  should mean something. Not a brand logo. Not a slogan. 
  A piece made by a real person, with a real story, that matches 
  something real inside of you."

Para 3: "Every drop is a collaboration. Every theme is an invitation. 
  Every piece is a chapter waiting to be lived."

VISUAL: Use a split layout — copy on left (60%), right side (40%) shows 
a looping abstract animation or a high-contrast black/white graphic. 
If no animation asset exists, use a CSS animated gradient in brand colors.
```

**Act II — The Journey (Artist Process)**
```
Section layout: Alternating left-right rows, one per artist

For each artist (Amira Youssef, Omar Tarek, Laila Nader):
- Artist name in large type
- Their existing 1-line bio
- Add a "Process Note" field to the artist data model:
  Amira: "Sacred geometry starts with a single point. Amira builds 
    outward from there — every line intentional, every angle calculated 
    to map the invisible architecture of identity."
  Omar: "Cairo has a specific kind of chaos — layered, loud, and 
    alive. Omar reduces it to monochrome. What's left is the city's 
    skeleton, pressed onto cotton."
  Laila: "Laila works at the edge of what the eye can hold — images 
    that feel like memories of places you have never been."
- A "Process Steps" visual: 3 numbered steps per artist
  Step 1: "Concept" (icon: Lightbulb)
  Step 2: "Design" (icon: Pen)  
  Step 3: "Print" (icon: Layers)
- CTA: "View [Artist Name]'s Drops →" linking to /shop?artist=[slug]

Also add a new field to the artist data model: 
  instagramHandle: string (e.g., "@amira.creates") — placeholder for now,
  real handles to be filled in before launch.
```

**Act III — The Return (Community)**
```
Section layout: Grid of "buyer story" cards + email capture

Add a ReviewCard component with these fields:
  - buyerInitial: string (e.g., "S.M.")
  - location: string (e.g., "Cairo")  
  - theme: string (e.g., "Career")
  - productName: string
  - quote: string (max 120 chars)
  - rating: 1-5

Seed with 6 placeholder review cards using this data:
[
  { buyerInitial: "S.M.", location: "Cairo", theme: "Career",
    productName: "The Hustler", rating: 5,
    quote: "Wore it to my first big client meeting. Three people asked where I got it." },
  { buyerInitial: "N.K.", location: "Alexandria", theme: "Mood",
    productName: "Inner Calm", rating: 5,
    quote: "It's the first piece of clothing I've bought that actually says something about me." },
  { buyerInitial: "R.A.", location: "Cairo", theme: "Horoscope",
    productName: "Aries Fire", rating: 4,
    quote: "The print quality is unlike anything I've seen at this price. Real weight to it." },
  { buyerInitial: "D.F.", location: "Giza", theme: "Couple",
    productName: "Twin Flame (Left)", rating: 5,
    quote: "Gifted the pair to my partner. The unboxing alone was worth it." },
  { buyerInitial: "Y.H.", location: "Cairo", theme: "Events",
    productName: "Graduation 2026", rating: 5,
    quote: "Everyone at graduation wanted to know where this came from. Sent them here." },
  { buyerInitial: "M.T.", location: "Heliopolis", theme: "Places",
    productName: "Midnight Cairo", rating: 5,
    quote: "Cairo on a shirt. Omar's detail work is insane up close." },
]

Style review cards: dark card (#1a1a1a), quote in italic, 
star rating in accent color, theme tag styled as pill.

Below the review grid, add:
- A "Share your chapter" CTA (opens mailto or links to WhatsApp)
- Email capture: "Get early access to new drops"
  Input + button, store email in a simple API route or link to Mailchimp
```

---

## CHANGE 3 — Deepen Artist Profiles

### Problem
Each artist has a one-sentence bio and "1 edition / View drops" — nowhere near enough to establish the maker authenticity the brand's premium positioning requires.

### What to Build

**Update /artists page and individual artist sections:**

```
Expand the Artist data model to include:
{
  name: string,
  slug: string,
  location: string,           // e.g., "Cairo, Egypt"
  bio: string,                // existing 1-liner
  extendedBio: string,        // NEW: 80-100 word artist statement
  medium: string,             // e.g., "Digital illustration, Sacred geometry"
  instagramHandle: string,    // e.g., "@amira.creates" — placeholder
  processNote: string,        // NEW: how they approach the HORO collaboration
  editionCount: number,
  avatar: string | null,      // real photo path (placeholder for now)
  coverImage: string | null,  // banner image path (placeholder for now)
}

Extended bios to add to /lib/artists.ts (or equivalent data file):

Amira Youssef extendedBio:
"Amira grew up tracing the geometry of mashrabiya screens onto notebook paper. 
Trained in graphic design in Cairo, she now builds digital illustrations from 
mathematical first principles — every shape derived, never decorative. 
Her HORO collaboration, Aries Fire, is the first time her work has appeared 
on a wearable object. It will not be the last."

Omar Tarek extendedBio:
"Omar shoots and draws Cairo simultaneously — his monochrome street work 
appears across Egyptian editorial and has been exhibited twice in Zamalek. 
For HORO, he translated his photographic eye into line art: Midnight Cairo 
is a compression of the city's visual noise into something you can carry 
on your back."

Laila Nader extendedBio:
"Laila's practice lives at the border of illustration and surrealism. 
Her digital works — layered, textured, unsettling in the best way — 
have accumulated a following in Cairo's independent art community. 
Abstract Thoughts is her answer to a simple question: what does 
a thought actually look like?"

processNote for each (add to data model):
Amira: "I treat each HORO brief like an architecture project. 
  The theme is the site. The design is the building."
Omar: "I start with what the city does to light. Then I remove the light."
Laila: "Every piece starts as a feeling I can't name yet."
```

**On the artist card and artist page:**
```
- Show location tag (e.g., "Cairo, Egypt")
- Show medium tag (e.g., "Sacred geometry · Digital")  
- Show Instagram handle as a clickable link (greyed out with "coming soon" 
  state if not yet confirmed)
- Add a "Process" accordion that reveals the processNote on click
- Add a "Statement" section showing the extendedBio in editorial type
- Keep "View drops" CTA prominent
```

---

## CHANGE 4 — Add Identity Activation Mechanics

### Problem
The theme navigation correctly maps to consumer identity construction, but there's no way for buyers to activate or broadcast the identity they've chosen. The brand declares identity — it doesn't facilitate it.

### What to Build

**A. Theme Finder Quiz Component**
```
Create /components/ThemeFinder.tsx

A 3-question micro-quiz that routes users to their best-fit theme:

Q1: "Right now, you feel most like..."
  A) Someone building something → Career
  B) Someone searching for something → Mood  
  C) Someone celebrating something → Events
  D) Someone who wants to be understood → Horoscope

Q2: "The best gift you've ever received was..."
  A) Something that had a story behind it → Places / Events
  B) Something that matched exactly who you are → Mood / Horoscope
  C) Something you and someone else share → Couple
  D) Something timeless → Seasons / Other

Q3: "You want people to see you as..."
  A) Ambitious and driven → Career
  B) Calm and self-aware → Mood
  C) Connected and loving → Couple
  D) Someone with a sense of place → Places

Result screen:
- "Your chapter is: [Theme Name]"
- Theme description
- 2-3 product cards from that collection
- CTA: "Start your story →"

Embed on homepage between the product grid and the theme browse section.
Add as a floating "Find my theme" button on mobile (bottom-right, above WhatsApp chat).
```

**B. Social Share Prompt on Order Confirmation**
```
On the order success / confirmation page, add:

"Share your chapter"
- A pre-formatted Instagram story template text:
  "Just claimed my chapter. [Product Name] from @horo.egypt 
   Theme: [Theme] | horo-fashion.vercel.app"
- A "Copy caption" button
- Text: "Tag us @horo.egypt and we'll feature you in Act III"

Note: this is text-only for now. A future phase can generate 
a real shareable image card via a canvas element.
```

**C. "This piece matches..." micro-copy**
```
On each product page, add a short "Who this is for" section:

Format: "This piece is for the person who [identity statement]"

Add identityStatement field to product data:

The Hustler: "...wears their ambition before they talk about it"
Inner Calm: "...finds stillness not by escaping the noise, but by choosing it"
Aries Fire: "...already knows what they are. They just want it confirmed."
Twin Flame: "...believes showing up in matching energy is its own language"
Graduation 2026: "...understands that some moments deserve to be worn, not just photographed"
Midnight Cairo: "...carries the city wherever they go"
Abstract Thoughts: "...thinks in images before they think in words"

Display below the product description in italic, slightly smaller type.
```

---

## CHANGE 5 — Trust Architecture Upgrades

### Problem
COD-dominant Egyptian buyers require multiple trust signals before committing. Reviews are absent. Key policy information is buried.

### What to Build

**A. Sticky Trust Strip Enhancement**
```
Current strip: "Free shipping in Cairo & Alex on orders over 2000 EGP"

Update to a rotating 4-item trust strip (auto-rotates every 4s on mobile):
1. "COD available — Pay when it arrives"
2. "14-day exchanges — No questions asked"  
3. "100% Egyptian cotton — Real GSM, real weight"
4. "Artist-made editions — Not mass produced"

On desktop show all 4 simultaneously separated by · dividers.
On mobile show one at a time with a fade transition.
```

**B. Review Display on Product Pages**
```
Add a ReviewSection component below "How It Works" on each product page.

Display the 6 seeded review cards from Change 2 (Act III).
Filter to show only reviews matching the current product's theme first,
then fill with others.

Show aggregate rating: ★★★★★ (5.0 from 6 reviews) — placeholder 
until real reviews come in.

Add a "Leave a review" link that opens WhatsApp with a pre-filled message:
"Hi HORO, I want to leave a review for [Product Name]: "
(URL: https://wa.me/201XXXXXXXXX?text=Hi%20HORO%2C%20I%20want%20to%20leave%20a%20review...)
```

**C. Fabric Specification Block**
```
Add a FabricSpec component to every product page:

Display in a clean 2-column grid:
| Fabric      | 100% Egyptian Cotton          |
| Weight      | 220–240 GSM (heavy-weight)    |
| Print method| DTG / DTF High-Definition     |
| Fit         | Unisex relaxed, runs true     |
| Care        | Cold wash, hang dry           |
| Origin      | Printed & packed in Egypt     |

Style as a minimal table with thin borders, no background.
Position between product description and the size guide CTA.

This directly addresses the "Ask" friction identified in research — 
buyers need tactile reassurance they cannot get physically online.
```

**D. Fix the WhatsApp Number**
```
The current WhatsApp link in the footer points to wa.me/201000000000 
(obviously fake). 

1. Create an environment variable: NEXT_PUBLIC_WHATSAPP_NUMBER
2. Replace all hardcoded WhatsApp links with this variable
3. Update the floating chat button to use the same variable
4. Add a TODO comment: // TODO: Set NEXT_PUBLIC_WHATSAPP_NUMBER in .env.local
5. Default fallback: render the WhatsApp button as disabled/greyed 
   if the env var equals "201000000000" (the placeholder)
```

---

## CHANGE 6 — Social-Native Content Integration

### Problem
The website has no connection to the social channels where Egyptian buyers actually discover and validate brands. Social media is the primary trust and discovery channel — the website cannot pretend it operates independently.

### What to Build

**A. Instagram Feed Placeholder Section**
```
Add a section to the homepage between Act III and the footer:

Section heading: "Follow the story — @horo.egypt"

Display a 3×2 grid of placeholder tiles (12 total on desktop, 6 on mobile):
- Each tile: matte black background with a different HORO theme icon/label
- Tile labels cycle through: "New Drop", "Artist Story", "Behind the Scenes", 
  "Customer Chapter", "Process", "Limited"
- Each tile shows a subtle animated shimmer (CSS skeleton loader style)
- Center overlay text: "Photos coming — follow us for early access"
- CTA below grid: "Follow @horo.egypt on Instagram" → links to instagram.com/horo.egypt

When a real Instagram API token is available in env vars (INSTAGRAM_ACCESS_TOKEN),
replace placeholders with real embedded posts using the Instagram Basic Display API.
Design the component to support both states.
```

**B. WhatsApp Order Flow Entry Point**
```
Add a prominent WhatsApp CTA to each product page, positioned just below 
the "Add to Cart" / main CTA button:

"Prefer to order on WhatsApp? →"
Links to: https://wa.me/[NUMBER]?text=Hi%20HORO%2C%20I%27d%20like%20to%20order%3A%20[ProductName]%20-%20Size%3A%20

Pre-fills the message with the product name so the buyer doesn't have to type it.
Style as a ghost/outline button in WhatsApp green (#25D366) with the WhatsApp icon.

This is critical: Egyptian e-commerce research shows 31.8% of purchases 
happen via WhatsApp. The website must make this path easy, not hidden.
```

**C. "Drop Alert" Email + WhatsApp Capture**
```
Replace the current newsletter input in the footer with a dual-option capture:

Heading: "Don't miss the next drop"
Subheading: "Limited editions don't wait. Get notified first."

Option 1: Email input → "Notify me by email" button
Option 2: WhatsApp link → "Notify me on WhatsApp" 
  Links to: https://wa.me/[NUMBER]?text=Add%20me%20to%20HORO%20drop%20alerts

Style them as equal-weight options, not primary/secondary.
Store email submissions in a simple API route (/api/subscribe) 
that writes to a local JSON file or forwards to an email service.
```

---

## CHANGE 7 — Content Infrastructure (Drop Journal)

### Problem
The brand has no content output. Per academic research, a brand at this stage needs a consistent content cadence before scaling paid acquisition. The website needs the infrastructure to support this.

### What to Build

**A. Drop Journal / Blog System**
```
Create a minimal MDX or JSON-based content system at /content/journal/

Schema for each entry:
{
  slug: string,
  title: string,
  date: string,
  type: "artist-story" | "behind-scenes" | "drop-announcement" | "buyer-story",
  artistSlug?: string,
  productSlug?: string,
  coverImage: string | null,
  excerpt: string,            // max 160 chars for SEO
  body: string,               // MDX or markdown
  published: boolean
}

Create page: /journal — lists all published entries
Create page: /journal/[slug] — renders individual entry

Seed with 3 placeholder entries:
1. slug: "why-we-started"
   title: "Why HORO Exists (And What We're Fighting Against)"
   type: "behind-scenes"
   excerpt: "Every artist in Egypt is competing with a printer in Faisal 
     who can put anything on a shirt for 150 EGP. We think that's not good enough."
   body: "[Placeholder — founder to complete before launch]"
   published: false

2. slug: "amira-youssef-aries-fire"
   title: "How Amira Youssef Made Aries Fire"
   type: "artist-story"
   artistSlug: "amira-youssef"
   productSlug: "horo-001"
   excerpt: "Sacred geometry starts with a single point. Here is how it became a shirt."
   body: "[Placeholder — to be written with Amira before drop launch]"
   published: false

3. slug: "first-100-orders"
   title: "What We Learned from Our First 100 Orders"
   type: "behind-scenes"
   excerpt: "Sizing questions, gift packaging requests, and why COD is actually fine."
   body: "[Placeholder — to be written after first sales batch]"
   published: false

On the homepage, add a "From the Journal" section (shows max 3 latest published entries).
If no entries are published, hide this section entirely (don't show empty state).
```

**B. Upcoming Drop Teaser Component**
```
Create an UpcomingDrop component that can be placed on the homepage 
and on the /shop page.

Data model in /lib/upcoming-drops.ts:
{
  artistName: string,
  artistSlug: string,
  dropName: string,
  theme: string,
  releaseDate: string | null,    // ISO date string or null for "soon"
  teaserText: string,
  isActive: boolean
}

Seed with:
{
  artistName: "Laila Nader",
  dropName: "Abstract Thoughts II",
  theme: "Other",
  releaseDate: null,
  teaserText: "The sequel to her debut drop. More layers. Less resolution.",
  isActive: false
}

Display as a dark teaser card with:
- "Coming Soon" badge
- Artist name + drop name
- Countdown timer if releaseDate is set, otherwise "Drop date TBA"
- "Get notified" → WhatsApp link
- Blur/obscure the theme tag to create anticipation

Show on homepage only when isActive: true.
```

---

## CHANGE 8 — Arabic Language Foundation

### Problem
Egyptian e-commerce requires Arabic-language trust content. Consumer protection expectations include Arabic clarity on exchange policy and terms. The current EN toggle is non-functional.

### What to Build

```
1. Install next-intl or next-i18next (whichever is simpler given 
   the existing stack):
   npm install next-intl

2. Create translation files:
   /messages/en.json  — English (existing content)
   /messages/ar.json  — Arabic translations

3. Priority strings to translate (MVP scope — not full site):
   - All trust strip copy
   - Exchange policy text
   - FAQ answers  
   - COD explainer copy
   - Hero headline and subhead
   - CTA button labels (Shop, View, Collect)
   - Size guide labels

4. Arabic content for key strings:
   Trust strip COD: "الدفع عند الاستلام متاح"
   Trust strip exchange: "استبدال مجاني خلال 14 يوم"
   Trust strip quality: "قطن مصري 100% — جودة حقيقية"
   Hero headline: "فن حقيقي على قطن مصري"
   Hero subhead: "مصنوع بواسطة فنانين مصريين — لمن يستحق قصة حقيقية"
   Shop CTA: "تسوق الآن"
   Find fit CTA: "اكتشف مقاسك"

5. Make the EN / AR toggle in the header functional:
   - Switch all priority strings when AR is selected
   - Set dir="rtl" on the html element
   - Use a right-to-left aware layout for the hero and trust strip
   - Store preference in localStorage

6. Add RTL-aware CSS:
   For RTL mode, flip any left/right padding asymmetries.
   Nav items should flow right-to-left.
   Product cards: text alignment flips to right.

Note: Full Arabic translation of every string is not required in MVP.
Clearly mark untranslated strings with a TODO comment.
```

---

## CHANGE 9 — Navigation & UX Polish

### Problem
Several UX elements undermine the brand's premium positioning.

### Fixes

**A. Rename "Other" Collection**
```
In the navigation and on the /collection/other page:
Change display name from "Other" to "Studio Editions"
Change subtitle from "Uncategorized creative expression. Art for art's sake."
to "Works that resist categories. Pieces for collectors."

Update in both the nav dropdown and the collection page header.
The URL slug /collection/other can stay the same for now.
```

**B. Free Shipping Banner — Reframe**
```
Current: "Free shipping in Cairo & Alex on orders over 2000 EGP"
This reads as a barrier (you need to spend a lot to get free shipping).

Change to: "Ships to Cairo & Alex in 2–4 days · COD available"
This emphasizes speed and COD availability — both positive trust signals —
without highlighting the threshold that most first-time buyers won't hit.

Keep the free shipping threshold in the cart/checkout flow where it's relevant,
not in the persistent announcement bar.
```

**C. "Only X Left" Counter — Make Conditional**
```
The product cards show "Only 12 left" and "Only 5 left" counters.
These create urgency but only work if the numbers are accurate and updating.

Add a stock data model field: actualStock: number | null
If actualStock is null → don't show any counter
If actualStock <= 5 → show "Only [N] left — no restocks"
If actualStock <= 15 → show "Limited — [N] remaining"
If actualStock > 15 → show nothing

Default all current products to actualStock: null until real inventory is tracked.
This prevents the dishonest urgency that damages trust in price-sensitive markets.
```

**D. "Act I / II / III" Labels — Add Visible Content Anchors**
```
The animated section labels currently float above empty space.
Until the content from Change 2 is added, replace the label treatment:

Instead of large animated chapter markers that promise content and deliver nothing,
use subtle section dividers with minimal label text:

Style: A thin horizontal rule with the label centered in it 
(e.g., "— The Story —") in small caps, muted color.
This reads as a design detail rather than a broken content promise.

Once the content from Change 2 is implemented, restore the full 
animated chapter treatment.
```

---

## CHANGE 10 — SEO & Metadata Foundation

### Problem
Each page needs proper Arabic/Egyptian-targeted metadata, and product pages need structured data for rich search results.

### What to Build

```
1. Update /app/layout.tsx metadata:
   title: "HORO | Wearable Art on Egyptian Cotton"
   description: "Artist-made t-shirts printed on premium Egyptian cotton. 
     Limited editions. COD available. Ships across Egypt."
   keywords: ["horo", "Egyptian cotton tshirt", "artist tshirt egypt", 
     "wearable art egypt", "قميص فني مصر", "قطن مصري"]
   openGraph:
     title: "HORO — Artist-Made Wearable Art"
     description: "Not a print shop. A collaboration between 
       Egyptian artists and the people who wear their work."
     image: "/og-image.jpg"  (create a 1200x630 OG image placeholder)

2. Add JSON-LD structured data to each product page:
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "[Product Name]",
  "description": "[Product tagline]",
  "brand": { "@type": "Brand", "name": "HORO" },
  "offers": {
    "@type": "Offer",
    "price": "[price]",
    "priceCurrency": "EGP",
    "availability": "https://schema.org/InStock",
    "availableAtOrFrom": {
      "@type": "Place",
      "address": { "addressCountry": "EG" }
    }
  },
  "material": "100% Egyptian Cotton"
}

3. Add a sitemap.xml generator at /app/sitemap.ts
   Include: homepage, /shop, /artists, /gifts, all /product/[slug] pages, 
   all /collection/[theme] pages

4. Add robots.txt at /public/robots.txt:
   User-agent: *
   Allow: /
   Sitemap: https://horo-fashion.vercel.app/sitemap.xml
```

---

## Implementation Order (Recommended)

Execute in this sequence to maximize impact with each commit:

```
Phase 1 — Trust foundation (before any traffic):
  1. Change 5D — Fix WhatsApp number (5 min)
  2. Change 9B — Fix shipping banner copy (10 min)  
  3. Change 9C — Make stock counters conditional (30 min)
  4. Change 5A — Update trust strip to rotating 4-item strip (45 min)
  5. Change 5C — Add fabric specification block to product pages (1 hour)
  6. Change 5B — Add review section with seeded reviews (2 hours)
  7. Change 1  — Placeholder photo system (2 hours)

Phase 2 — Brand story and identity (before paid social):
  8. Change 2  — Populate Act I / II / III content (3 hours)
  9. Change 3  — Deepen artist profiles (2 hours)
  10. Change 4A — Theme Finder quiz (3 hours)
  11. Change 4C — "This piece matches..." micro-copy (1 hour)
  12. Change 9A — Rename "Other" → "Studio Editions" (15 min)
  13. Change 9D — Fix Act I/II/III labels interim state (30 min)

Phase 3 — Social and commerce integration:
  14. Change 5B — WhatsApp order flow on product pages (1 hour)
  15. Change 6C — Dual-option drop alert capture (1.5 hours)
  16. Change 6A — Instagram feed placeholder section (2 hours)
  17. Change 7  — Drop Journal system (4 hours)
  18. Change 4B — Order confirmation social share prompt (1 hour)

Phase 4 — Language and scale readiness:
  19. Change 8  — Arabic language foundation (4–6 hours)
  20. Change 10 — SEO and metadata (2 hours)
```

---

## Environment Variables Needed

Add these to `.env.local` and `.env.example`:

```env
# Required before launch
NEXT_PUBLIC_WHATSAPP_NUMBER=201XXXXXXXXX

# Required for Arabic toggle
NEXT_PUBLIC_DEFAULT_LOCALE=en

# Required for Instagram feed (Phase 3)
INSTAGRAM_ACCESS_TOKEN=

# Required for email capture (Phase 3)
SUBSCRIBE_EMAIL_ENDPOINT=

# Optional: analytics
NEXT_PUBLIC_GA_ID=
```

---

## Files to Create / Update Summary

```
NEW:
/components/ProductImagePlaceholder.tsx
/components/PhotoGuide.tsx        (dev-only)
/components/ThemeFinder.tsx
/components/ReviewCard.tsx
/components/ReviewSection.tsx
/components/FabricSpec.tsx
/components/UpcomingDrop.tsx
/components/TrustStrip.tsx        (replace current)
/components/DropJournalCard.tsx
/app/journal/page.tsx
/app/journal/[slug]/page.tsx
/content/journal/why-we-started.md
/content/journal/amira-youssef-aries-fire.md
/content/journal/first-100-orders.md
/lib/brand-copy.ts
/lib/upcoming-drops.ts
/lib/reviews.ts
/messages/en.json
/messages/ar.json
/app/sitemap.ts
/public/robots.txt

UPDATE:
/lib/artists.ts (or equivalent)   — extend data model
/lib/products.ts (or equivalent)  — add identityStatement, isPlaceholder
/app/layout.tsx                   — metadata, i18n setup
/app/page.tsx                     — integrate all new homepage sections
/app/product/[slug]/page.tsx      — fabric spec, reviews, WhatsApp CTA, identity copy
/app/artists/page.tsx             — expanded artist cards
/app/collection/other/page.tsx    — rename to Studio Editions
.env.example                      — document all env vars
```

---

*This prompt was generated from a FACTUM 25 (Fashion Communication in the Digital Age, Stockholm 2025) academic review of the HORO brand concept, cross-referenced with Egypt secondary market research. Every change maps to a specific finding in the source material.*
