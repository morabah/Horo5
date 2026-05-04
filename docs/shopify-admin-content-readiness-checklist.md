# Shopify Admin Content Readiness Checklist

## 1. Homepage

- [ ] **Hero image** uploaded to `home-hero` section
- [ ] **Route card images** uploaded to `primary_routes` section blocks (3 cards)
- [ ] **Featured collection** has products (currently set to collection "all")
- [ ] **Feeling cards** populated via `feeling` metaobjects with images and active status
- [ ] **Occasion cards** populated via `occasion` metaobjects with images and active status
- [ ] **Gift block** link verified (`/pages/gifts`)
- [ ] **Testimonials** replaced with real quotes or section hidden before launch

## 2. Products

For every product, verify:
- [ ] Title
- [ ] Price
- [ ] Variants / sizes
- [ ] Inventory tracked
- [ ] Images (minimum: front, detail, lifestyle if available)
- [ ] Description

**Product metafields** (namespace: `custom`):
- [ ] `feeling` — links product to a feeling metaobject
- [ ] `subfeeling` — links to a subfeeling metaobject
- [ ] `story` — short design story text
- [ ] `story_description` — longer story text
- [ ] `design_story` — design background
- [ ] `fit_note` — sizing/fit guidance
- [ ] `materials` — fabric/material info
- [ ] `care_instructions` — washing/care info
- [ ] `features` — product features list
- [ ] `trust_chips` — trust badge text
- [ ] `whatsapp_help_url` — support link
- [ ] `artist` — links to artist metaobject
- [ ] `size_fit_note` — size-specific guidance
- [ ] `size_table` — links to size_table metaobject

## 3. Metaobjects

Create and populate the following metaobject definitions:
- [ ] `feeling` — name, handle, image, active, description
- [ ] `subfeeling` — name, handle, parent feeling, image, active
- [ ] `occasion` — name, handle, image, active, is_gift_occasion
- [ ] `artist` — name, bio, image, handle
- [ ] `size_table` — label, chest, length, shoulder, sleeve (one row per size)

## 4. Collections

Verify these collections exist and have products:
- [ ] `all` — default collection with all products
- [ ] `feeling-zodiac` — zodiac-themed products
- [ ] `feeling-zodiac-cancer` — Cancer-specific products
- [ ] `feeling-mood` — mood-themed products
- [ ] `feeling-attitude` — attitude-themed products
- [ ] `gifts` — gift-appropriate products
- [ ] `occasions` — occasion-themed products

**Collection metafields** (namespace: `custom`):
- [ ] `editorial_heading` — optional heading for collection editorial section
- [ ] `editorial_text` — optional description text
- [ ] `editorial_image` — optional editorial image

## 5. Policies

Create in Shopify Admin (Settings > Policies):
- [ ] Exchange / Return policy
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Shipping policy
- [ ] Contact page (`/pages/contact`)

## 6. Gift Wrap Product

- [ ] Gift wrap product exists and is active
- [ ] Gift wrap product is configured in the theme's gift wrap settings
- [ ] Price is set correctly

## 7. Free Shipping

- [ ] Shipping rate with free shipping threshold configured in Shopify Admin
- [ ] Threshold amount matches `cart_free_shipping_progress` section setting (default: 1500 EGP)
- [ ] Section enabled (`enable_free_shipping_progress: true`)

## 8. Delivery Estimate

- [ ] `horo_delivery_estimate` section enabled (`show_delivery_estimate: true`)
- [ ] Exact date range enabled if desired (`show_exact_date_range: true`)
- [ ] Standard and express min/max days configured correctly
- [ ] Cutoff hour and timezone match your operations

## 9. Full Path Test

Test the complete customer journey:

**Path A — COD:**
1. [ ] Homepage loads
2. [ ] Navigate to Feelings hub
3. [ ] Select Zodiac category
4. [ ] Select Cancer collection
5. [ ] Click a product
6. [ ] Select size variant
7. [ ] Add to cart
8. [ ] Cart page loads with correct items
9. [ ] Proceed to checkout
10. [ ] Select Cash on Delivery
11. [ ] Complete order

**Path B — Instapay / Manual:**
1. [ ] Homepage loads
2. [ ] Navigate to Feelings hub
3. [ ] Select Zodiac category
4. [ ] Select Cancer collection
5. [ ] Click a product
6. [ ] Select size variant
7. [ ] Add to cart
8. [ ] Cart page loads with correct items
9. [ ] Proceed to checkout
10. [ ] Select Bank Transfer / Instapay
11. [ ] Complete order and receive confirmation

**Path C — Search:**
1. [ ] Search for "Cancer"
2. [ ] Search results show relevant products
3. [ ] Search fallback page shows support links

## 10. Mobile & RTL Checks

- [ ] Homepage scrolls smoothly on iPhone SE (375px width)
- [ ] Product page variant selector works on mobile
- [ ] Cart quantity controls are tappable
- [ ] Quick view modal opens and closes on mobile
- [ ] Sticky mobile ATC bar appears and is tappable
- [ ] RTL layout checked (if targeting Arabic-speaking customers)
