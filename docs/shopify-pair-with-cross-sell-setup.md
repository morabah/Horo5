# HORO Pair With Cross-Sell Setup Guide

## Overview

The `product-pair-with.liquid` section allows customers to add multiple companion products to the cart in one click from the product detail page (PDP).

---

## Data source options

### Option 1: Product metafield (recommended)

Use the `custom.pair_with_products` metafield to link companion products.

1. **Shopify Admin → Settings → Custom data → Products**
2. Add a metafield definition:
   - Namespace: `custom`
   - Key: `pair_with_products`
   - Type: **List of products** (`list.product_reference`)
3. Go to a product in Admin
4. Under **Metafields**, select companion products
5. Save

### Option 2: Manual section blocks

If metafields are not available, use the section's built-in product blocks:

1. Open **Theme Editor → Product page**
2. Find the **Product pair with** section
3. Click **Add block** and select products manually

---

## Behavior

- **Single-variant products:** Show a checkbox. Checked items are added via one click.
- **Multi-variant products:** Show a "Choose options" link instead of a checkbox. This avoids adding an unintended default variant.
- **Sold-out products:** Automatically hidden.
- **Current product:** Optionally included via the section setting **Include current product**.

---

## Section settings

| Setting | Default | Description |
|---------|---------|-------------|
| Heading | "Style it with" | Section title |
| Include current product | false | Adds the main product as a selectable item |
| Preselect items | true | Checkboxes are checked by default |
| Redirect to cart | false | Redirects to /cart after successful add |

---

## Manual test scenarios

1. **Single-variant companion:**
   - PDP loads with companion product visible.
   - Checkbox is checked.
   - Click "Add selected pieces."
   - Page refreshes and both products are in cart.

2. **Multi-variant companion:**
   - PDP loads with companion product visible.
   - "Choose options" link is shown instead of checkbox.
   - Clicking link goes to companion PDP.

3. **Sold-out companion:**
   - Companion product is hidden from the list.

4. **No companions configured:**
   - Section does not render (unless in Theme Editor, where a placeholder is shown).

---

## Technical notes

- Uses `POST /cart/add.js` with `items: [{id, quantity}, ...]`
- Button is disabled while the request is in flight.
- Status messages are announced via `aria-live="polite"`.
- Page reloads on success to keep the Dawn cart in sync.
