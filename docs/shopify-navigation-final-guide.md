# HORO Shopify Navigation Final Guide

## Recommended Main Menu (Header)

Keep the top navigation short and shop-led. These are the pages that drive discovery and conversion.

| Link | Destination | Rationale |
|------|------------|-----------|
| **Home** | `/` | Anchor return path |
| **Shop** | `/collections/all` | Direct catalog access |
| **Feelings** | `/pages/feelings` | Core brand navigation — browse by mood/zodiac/attitude |
| **Gifts** | `/pages/gifts` | Gifting use case with curated selections |
| **About** | `/pages/about` | Brand story, artist info, FAQ link |

**Why not more?**
- A long header competes with the hero and primary routes.
- Support pages (FAQ, Size Guide, Exchange) are better placed in the footer where users look for them after browsing.
- The "Feelings" page already surfaces the full taxonomy, so sub-links (Zodiac, Mood) are redundant in the header.

## Recommended Footer Menu

Group footer links into logical columns.

### Column: Support
- FAQ (`/pages/faq`)
- Exchange (`/pages/exchange`)
- Size Guide (`/pages/size-guide`)
- Contact (`/pages/contact`)

### Column: Shop
- All Products (`/collections/all`)
- Shop by Feeling (`/pages/feelings`)
- Shop by Occasion (`/pages/occasions`)
- Gift by Meaning (`/pages/gifts`)

### Column: Brand
- About HORO (`/pages/about`)
- Artists (`/pages/artists`)
- Shipping (`/pages/shipping`)

## Testing Menu vs Final Menu

During development and pre-launch QA, it is useful to expose every page in a temporary **Testing** menu so the team can reach any page quickly.

**Testing menu** (temporary):
- Include all pages, collections, and utility pages.
- Can be a separate menu handle (e.g. `testing-menu`) rendered only in a dev/staging theme.
- Remove or hide before launch.

**Final customer menu** (production):
- Only the five header links above.
- Support links relegated to footer.
- Do not include every collection in the header — the Feelings page is the gateway.

## Menu Setup in Shopify Admin

1. Go to **Online Store > Navigation**.
2. Create or edit the **Main menu**.
3. Add links matching the table above.
4. Create a **Footer** menu with the support links.
5. (Optional) Create a **Testing** menu for internal use; do not link it in the live theme.

## RTL Consideration

When the storefront is viewed in Arabic:
- The same five links should be mirrored in the **RTL** menu.
- Footer columns reorder automatically via logical CSS (`margin-inline-start`, etc.).
- Ensure menu labels in Arabic are concise: ابدأ, تسوق, مشاعر, هدايا, من نحن.
