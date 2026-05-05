# HORO Shopify — Final Admin Readiness Before Launch

## Pre-launch checklist

### 1. Hero image & cinematic mode
- [ ] Upload a high-quality hero image in Theme Editor (Home Hero section)
- [ ] Test hero readability with the chosen image
- [ ] Only enable **Cinematic mode** after confirming the image works well
- [ ] Verify CTA is readable on both desktop and mobile
- [ ] Adjust overlay opacity if needed (default: 30%)

### 2. Feeling expression cards
- [ ] Upload card images for the 3 expression cards (Mood, Sign, Attitude)
- [ ] Verify cards look good with images
- [ ] Verify cards still look acceptable without images (text-only fallback)
- [ ] Check that copy is not repetitive with Story Plan and Feeling Grid

### 3. Featured collection
- [ ] Confirm the featured collection has products
- [ ] Verify "Just Dropped" heading makes sense, or change in Theme Editor
- [ ] Check that product cards render correctly with real products
- [ ] Verify mobile 2-column grid readability

### 4. Product metafields
Populate these metafields for richer product cards:
- [ ] `custom.subfeeling` — shows as chip on product card
- [ ] `custom.fit_note` — fallback chip text (e.g. "220 GSM cotton")
- [ ] `custom.artist` — shows artist credit below product name

If metafields are not populated, cards will show the fallback "220 GSM cotton" chip.

### 5. Collection metafields
Populate these for collection pages:
- [ ] `custom.feeling` — enables feeling hero with image and accent color
- [ ] `custom.occasion` — enables occasion hero
- [ ] `custom.editorial_heading` — overrides default editorial proof heading
- [ ] `custom.editorial_text` — overrides default editorial proof text
- [ ] `custom.editorial_image` — adds editorial image

### 6. Testimonials
- [ ] Replace sample testimonials with real quotes, OR
- [ ] Disable "Show as sample copy" and populate real names/cities
- [ ] If keeping sample copy: verify labels ("For self-expression", etc.) read well
- [ ] Ensure no fake names/cities show on live storefront when sample mode is on

### 7. Exchange policy wording
- [ ] Confirm exchange policy page content at `/pages/exchange-policy-horo`
- [ ] Verify all "14-day exchange" references include "— terms apply"
- [ ] Do not promise refunds unless confirmed by merchant
- [ ] Test exchange policy page on mobile

### 8. Footer & navigation
- [ ] Configure main menu links in Shopify Admin > Navigation
- [ ] Configure footer menu links
- [ ] Add links to: Feelings hub, Occasions hub, Gifts hub, About, FAQ, Exchange policy, Size guide
- [ ] Verify footer links work on mobile

### 9. Payment & checkout testing
- [ ] Test COD checkout flow end-to-end
- [ ] Test Instapay/manual payment checkout flow
- [ ] Verify order confirmation emails
- [ ] Test cart quantity update and item removal
- [ ] Verify free shipping progress bar (if enabled)

### 10. Mobile testing
- [ ] Test homepage on 375px width (iPhone SE/similar)
- [ ] Verify hero CTA is visible and tappable
- [ ] Verify product cards in 2-column grid are readable
- [ ] Verify navigation menu works
- [ ] Test cart drawer or page on mobile
- [ ] Verify footer links are tappable (min 44px touch targets)

### 11. RTL / Arabic quick pass
- [ ] Switch storefront to Arabic (if available)
- [ ] Verify text direction is correct
- [ ] Check that logical CSS properties work (padding-inline, margin-inline, inset-inline)
- [ ] Verify no text overlaps or truncation issues

### 12. Content pages
- [ ] Verify About page content at `/pages/about-horo`
- [ ] Verify FAQ page content at `/pages/faq-horo`
- [ ] Verify Size guide page at `/pages/size-guide`
- [ ] Verify Exchange policy page at `/pages/exchange-policy-horo`

### 13. Hub pages
- [ ] Verify Feelings hub (`/pages/feelings`) shows metaobjects
- [ ] Verify Occasions hub (`/pages/occasions`) shows metaobjects
- [ ] Verify Gifts hub (`/pages/gifts`) shows gift occasions
- [ ] Add feeling/occasion metaobjects in Shopify Admin if hubs are empty

### 14. Theme Editor safety
- [ ] Open Theme Editor and verify no broken sections
- [ ] Check that all sections have valid presets
- [ ] Verify section reordering works
- [ ] Confirm no console errors in Theme Editor preview

### 15. Final Shopify validation
- [ ] Run `shopify theme check` — confirm 0 new errors
- [ ] Push theme to Shopify — confirm successful
- [ ] Verify live theme loads without console errors
- [ ] Check favicon and meta tags
- [ ] Verify social sharing images (OG image)
