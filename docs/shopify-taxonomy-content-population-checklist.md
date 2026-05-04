# HORO Shopify Taxonomy & Content Population Checklist

## Metaobject Definitions (Admin > Content > Metaobjects)

Create the following metaobject definitions to support feeling-based navigation.

### 1. `feeling`
- **Name**: Feeling
- **Fields**:
  - `title` (Single-line text) — e.g. "Mood", "Zodiac", "Attitude"
  - `handle` (Single-line text) — URL-safe handle
  - `description` (Multi-line text) — Optional editorial description
  - `image` (Media) — Card image for the feeling grid

### 2. `subfeeling`
- **Name**: Subfeeling
- **Fields**:
  - `title` (Single-line text) — e.g. "I Care", "I Don't Care", "Cancer", "Aries"
  - `handle` (Single-line text) — URL-safe handle
  - `parent_feeling` (Metaobject reference → `feeling`) — Links to parent
  - `description` (Multi-line text) — Optional

### 3. `occasion`
- **Name**: Occasion
- **Fields**:
  - `title` (Single-line text) — e.g. "Birthday", "Graduation"
  - `handle` (Single-line text)
  - `description` (Multi-line text)
  - `image` (Media)

### 4. `artist`
- **Name**: Artist
- **Fields**:
  - `name` (Single-line text)
  - `bio` (Multi-line text)
  - `avatar` (Media)
  - `portfolio_url` (URL)

## Collection Metafields

Define these under **Settings > Custom data > Collections**.

| Namespace | Key | Type | Purpose |
|-----------|-----|------|---------|
| `custom` | `feeling` | Metaobject reference (`feeling`) | Links collection to a feeling |
| `custom` | `occasion` | Metaobject reference (`occasion`) | Links collection to an occasion |

## Recommended MVP Taxonomy

### Feelings (parent)
- **Mood** (`feeling-mood`)
  - I Care (`feeling-mood-i-care`)
  - I Don't Care (`feeling-mood-i-dont-care`)
- **Zodiac** (`feeling-zodiac`)
  - Cancer (`feeling-zodiac-cancer`)
  - Aries (`feeling-zodiac-aries`)
- **Attitude** (`feeling-attitude`)
  - Calm (`feeling-attitude-calm`)
  - Confident (`feeling-attitude-confident`)

### Occasions
- Birthday (`occasion-birthday`)
- Graduation (`occasion-graduation`)
- Just because (`occasion-just-because`)

## Required Collections

Create Shopify collections with handles matching the taxonomy above.

| Handle | Title | Type | Metafield assignment |
|--------|-------|------|---------------------|
| `feeling-mood` | Mood | Manual | `custom.feeling` → Mood metaobject |
| `feeling-zodiac` | Zodiac | Manual | `custom.feeling` → Zodiac metaobject |
| `feeling-attitude` | Attitude | Manual | `custom.feeling` → Attitude metaobject |
| `feeling-mood-i-care` | I Care | Manual | `custom.feeling` → Mood metaobject |
| `feeling-zodiac-cancer` | Cancer | Manual | `custom.feeling` → Zodiac metaobject |
| `feeling-attitude-confident` | Confident | Manual | `custom.feeling` → Attitude metaobject |

**Rule**: Every product should belong to its parent feeling collection **plus** the specific subfeeling collection.

Example: A "Cancer" tee should be in:
- `feeling-zodiac`
- `feeling-zodiac-cancer`

## Image Checklist

Populate these image slots before launch.

| Slot | Dimensions | Notes |
|------|-----------|-------|
| Homepage hero | 1920×1080 or wider | Dark background preferred for white text |
| Primary routes (3 cards) | 800×800 or 4:5 | Feeling/Occasion/Gift imagery |
| Feeling cards | 600×800 | Portrait crop, emotional tone |
| Product images | 1200×1600 | Front on-body, back fit card, print proof, fabric/tag, flat lay, lifestyle |
| Artist avatar | 400×400 | Square, consistent crop |

## Manual Test Flow

Run through this flow on the live storefront after population.

1. **Homepage**
   - Hero loads with heading, subheading, CTA
   - Trust ribbon visible
   - Primary routes clickable
2. **Feelings page** (`/pages/feelings`)
   - Feeling grid loads
   - Each feeling card links to collection
3. **Zodiac collection** (`/collections/feeling-zodiac`)
   - Subfeeling filter or grid visible
4. **Cancer collection** (`/collections/feeling-zodiac-cancer`)
   - Products assigned to Cancer display
5. **Product page**
   - Images load, variants selectable
   - Add to cart works
6. **Cart**
   - Quantity editable, remove works
   - Gift wrap option appears
7. **Checkout**
   - Shipping rates load
   - COD option visible
   - Order completes

## Content Population Order

1. Create metaobject definitions
2. Create metaobject entries (feelings, subfeelings, occasions, artists)
3. Create collection metafield definitions
4. Create collections and assign metafields
5. Upload product images and assign to collections
6. Assign artist metaobject to products (via product metafield if used)
7. Populate homepage content (hero image, route images)
8. Test manual flow end-to-end
9. Replace testimonial sample copy with real quotes
