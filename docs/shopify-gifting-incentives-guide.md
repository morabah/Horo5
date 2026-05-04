# HORO Shopify Gifting Incentives Guide

## Current gifting implementation

### Gift wrap product
- A real Shopify product exists for gift wrap.
- It is added to cart as a line item via `cart-gift-wrap-upsell.liquid`.
- Duplicate prevention is handled by `gift-wrap.js`.
- The gift wrap product should have:
  - A clear title (e.g., "Gift Wrap — HORO story card + wrapping")
  - A price set in Shopify Admin
  - Inventory tracking disabled (or managed as a service product)

### Gift wrap price consistency
- The price displayed in the upsell UI comes from the live product price.
- Ensure the product price in Admin matches any marketing copy.
- If the price changes, update the product in Admin — no code change needed.

### Cart gift wrap upsell
- `cart-gift-wrap-upsell.liquid` shows when the cart contains at least one product.
- It displays a preview image, heading, body text, and add/remove actions.
- The section is already in `templates/cart.json`.

### PDP gifting
- No dedicated "gift-ready" banner exists on the product page yet.
- If needed later, add a `custom.gift_ready` metafield (boolean or text) to products.
- Render conditionally in `product-purchase-context.liquid` or a new section.

## Gift page recommendation

### Gifts hub (`/pages/gifts`)
- Template: `page.gifts-hub.json`
- Section: `gifts-hub.liquid` — renders gift occasion metaobjects in a grid.
- **Missing:** An editorial guide section below the grid, similar to the feelings hub.
- **Action:** Add `feelings-editorial-guide.liquid` (or clone it as `gifts-editorial-guide.liquid`) to `page.gifts-hub.json` if the merchant wants introductory text.

### When to show "Gifts" in the main menu
- Show when the gifts hub has at least 3 populated metaobjects.
- Show when the merchant has set up the gift wrap product and priced it.
- Hide if the gift wrap product is out of stock or not configured.

## Safer copy for Egyptian MVP

Use this copy for all gifting-related touch points:

| Touch point | Safe copy |
|-------------|-----------|
| PDP gift wrap mention | "Gift wrap available — add it in cart" |
| Gift wrap upsell heading | "Make it a gift" |
| Gift wrap upsell body | "Add a HORO story card and gift wrap to your order. You can remove it any time before checkout." |
| Gifts hub eyebrow | "Gifts" |
| Gifts hub heading | "Find something they'll feel" |
| Gifts hub text | "HORO designs work as gifts because they start with a feeling. Choose a mood or moment that matches the person you're buying for." |
| Collection gift CTA | "Send something with meaning" |

## What not to claim

- Do not claim "free gift wrap" unless the gift wrap product price is 0 EGP in Admin.
- Do not claim "gift message included" unless a gift message feature is built.
- Do not claim "express gift delivery" unless the shipping policy supports it.
- Do not show gift wrap upsell if the gift wrap product is unpublished.

## Checklist for merchant

- [ ] Gift wrap product created and published
- [ ] Gift wrap product price set correctly
- [ ] Gift wrap product inventory policy set to "Don't track" (recommended)
- [ ] Gift wrap product image uploaded
- [ ] Gifts hub metaobjects populated (at least 3)
- [ ] "Gifts" link added to main menu if ready
- [ ] Gift wrap upsell text reviewed and approved
