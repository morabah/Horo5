# HORO Shopify Data Readiness & Launch Checklist

**Phase:** 1.6k
**Date:** 2026-05-04
**Purpose:** Ensure all product data, metafields, metaobjects, collections, navigation, and content are ready for the HORO Shopify storefront.

---

## 1. Product data

Each product must have:

- [ ] **Title** — e.g. "Zodiac Cancer Tee"
- [ ] **Description** — product description body
- [ ] **Variants/sizes** — at least S, M, L, XL with prices
- [ ] **Price** — set per variant
- [ ] **Inventory** — stock tracked per variant
- [ ] **Images** — at least 1 product image; ideally front + back or detail
- [ ] **Product type** — e.g. "T-Shirt"
- [ ] **Vendor** — e.g. "HORO"
- [ ] **Collection assignment** — assigned to relevant collection(s)
- [ ] **Status** — `active` for live products

## 2. Product metafields

Create namespace `custom` for each field. Verify definition exists and is populated:

- [ ] `custom.feeling` — reference to feeling metaobject (e.g. "Zodiac")
- [ ] `custom.subfeeling` — reference to subfeeling metaobject (e.g. "Cancer")
- [ ] `custom.story` — rich text or string, the design story
- [ ] `custom.story_description` — shorter story description for accordion
- [ ] `custom.design_story` — design process narrative
- [ ] `custom.fit_note` — e.g. "Regular fit, order your usual size"
- [ ] `custom.materials` — e.g. "100% Egyptian cotton, 180 GSM"
- [ ] `custom.care_instructions` — e.g. "Machine wash cold, inside out"
- [ ] `custom.features` — e.g. "Digital print, pre-shrunk"
- [ ] `custom.trust_chips` — comma-separated trust labels
- [ ] `custom.whatsapp_help_url` — WhatsApp support link
- [ ] `custom.artist` — reference to artist metaobject
- [ ] `custom.size_fit_note` — fit guidance for size guide section
- [ ] `custom.size_table` — reference to size_table metaobject

### Collection metafields (for editorial proof section)

- [ ] `custom.editorial_heading` — editorial heading for collection
- [ ] `custom.editorial_text` — editorial body text for collection
- [ ] `custom.editorial_image` — editorial image for collection

## 3. Metaobjects

Create each metaobject definition in Shopify Admin → Content → Metaobjects:

### Artist
- [ ] Definition created with fields: `name`, `bio`, `avatar`, `instagram_url`
- [ ] At least 1 entry populated

### Feeling
- [ ] Definition created with fields: `name`, `slug`, `description`, `image`, `active`, `collection`
- [ ] Entries: Zodiac, Mood, Attitude (at minimum)

### Subfeeling
- [ ] Definition created with fields: `name`, `slug`, `feeling` (reference), `description`, `image`, `active`, `collection`
- [ ] Entries: Cancer, Leo, etc. (under Zodiac at minimum)

### Occasion
- [ ] Definition created with fields: `name`, `slug`, `description`, `image`, `active`, `is_gift_occasion`, `collection`
- [ ] At least 2 occasion entries, at least 1 with `is_gift_occasion = true`

### Size table
- [ ] Definition created with fields: `name`, `rows` (JSON or structured fields for measurements)
- [ ] At least 1 entry (unisex t-shirt sizes)

## 4. Collections

Create and configure:

- [ ] `all` — all products
- [ ] `feeling-zodiac` — products tagged with Zodiac feeling
- [ ] `feeling-zodiac-cancer` — products tagged with Cancer subfeeling
- [ ] `feeling-mood` — products tagged with Mood feeling
- [ ] `feeling-attitude` — products tagged with Attitude feeling
- [ ] `gifts` — products suitable as gifts (or occasion-based)
- [ ] `occasions` — products tagged with occasion metafield

Each collection:
- [ ] Has a title and description
- [ ] Has a featured image (for hero sections)
- [ ] Has sort order configured (e.g. best-selling, manual)
- [ ] Has conditions set (product tags, metafield values, or manual)

## 5. Navigation

### Main menu
- [ ] Home → `/`
- [ ] Shop → `/collections/all`
- [ ] Feelings → `/pages/feelings`
- [ ] Gifts → `/pages/gifts`
- [ ] About → `/pages/about`

### Footer menu
- [ ] FAQ → `/pages/faq`
- [ ] Exchange → `/pages/exchange-policy`
- [ ] Size Guide → `/pages/size-guide`
- [ ] Contact → `/pages/contact`
- [ ] Privacy → `/policies/privacy-policy`
- [ ] Terms → `/policies/terms-of-service`
- [ ] Shipping Policy → `/policies/shipping-policy`

## 6. End-to-end test paths

### Path 1: COD checkout
- [ ] Home → Feelings → Zodiac → Cancer → Product page → Add to cart → Cart → Checkout → Cash on Delivery
- Verify: product loads, variant picker works, add-to-cart succeeds, cart shows item, COD available at checkout

### Path 2: Instapay/manual checkout
- [ ] Home → Feelings → Zodiac → Cancer → Product page → Add to cart → Cart → Checkout → Instapay/manual payment
- Verify: same as above, manual/Instapay payment option available

### Additional checks
- [ ] Gift wrap add/remove works in cart
- [ ] Bundle nudge is disabled by default
- [ ] Free shipping progress bar is disabled by default
- [ ] Search returns results for "zodiac"
- [ ] Search support links navigate correctly
- [ ] 404 page renders

## 7. Content/image readiness

- [ ] Homepage hero image (desktop + mobile)
- [ ] Route card images (Feelings, Occasions, Gifts — 3 images)
- [ ] Collection hero images (Zodiac, Mood, Attitude, etc.)
- [ ] Product images (front, back, detail per product)
- [ ] Artist avatar image(s)
- [ ] About page hero image
- [ ] Gift wrap product image
- [ ] Occasion card images
- [ ] Feeling card images
- [ ] Favicon / logo

## 8. Theme settings verification

- [ ] Gift wrap product selected in theme settings
- [ ] Gift wrap variant exists and has a price
- [ ] Color schemes configured (scheme-1, scheme-2, scheme-3)
- [ ] Typography settings match brand
- [ ] Social media links populated
- [ ] Store name and logo set

## 9. Shipping & checkout configuration

- [ ] Shipping zones configured for Egypt
- [ ] Shipping rates set (standard, express if applicable)
- [ ] Free shipping rate created if enabling free-shipping progress bar
- [ ] Cash on Delivery payment method enabled
- [ ] Manual payment / bank transfer method configured (for Instapay)
- [ ] No automatic discounts that conflict with theme display logic
- [ ] Store currency set to EGP

## 10. Pre-launch sanity

- [ ] All pages render without Liquid errors
- [ ] No console errors on key pages
- [ ] Mobile layout works at 375px
- [ ] RTL quick check — no broken layout if Arabic content is added later
- [ ] Theme check passes: `shopify theme check --path shopify-theme`
- [ ] Gift wrap product is not visible in collections (tagged or excluded)
- [ ] Sample testimonials show "Sample copy" notice in editor only
- [ ] Bundle nudge section is disabled by default
- [ ] Free shipping progress is disabled by default
