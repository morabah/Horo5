# HORO Shopify Phase 1.6d — PDP Data Parity Report

## Objective
Close the product-page information gap between the custom Medusa/web PDP and the Shopify Dawn-based HORO theme by adding metafield-driven sections that read product data dynamically, without touching commerce-critical files.

## Files created

- `docs/shopify-pdp-data-parity-metafields.md`
- `shopify-theme/sections/product-purchase-context.liquid`
- `shopify-theme/assets/component-product-purchase-context.css`
- `shopify-theme/sections/product-details-accordions.liquid`
- `shopify-theme/assets/component-product-details-accordions.css`
- `docs/shopify-phase-1-6d-pdp-data-parity-report.md`

## Files changed

- `shopify-theme/templates/product.json`

## Medusa/web PDP information mapped to Shopify

| Medusa/web concept | Shopify implementation | Status |
|-------------------|----------------------|--------|
| `product.primaryFeelingSlug` | `custom.feeling` (metaobject) → purchase-context pills | Done |
| `product.subfeeling` | `custom.subfeeling` (metaobject) → purchase-context pills | Done |
| `product.fitLabel` / model fit note | `custom.fit_note` → purchase-context + accordions | Done |
| `product.trustBadges` | `custom.trust_chips` (list) → purchase-context chips, fallback defaults | Done |
| `product.pdpTagLabels` / features | `custom.features` (list) → purchase-context chips | Done |
| `HORO_SUPPORT_CHANNELS.whatsappSupportUrl` | `custom.whatsapp_help_url` → purchase-context WhatsApp button | Done |
| Stock urgency hint | `custom.low_stock_message` → purchase-context urgency line | Done |
| `product.storyDescription` / design story | `custom.design_story` → dynamic accordions | Done |
| `product.physicalAttributes.material` | `custom.materials` → dynamic accordions | Done |
| Care instructions | `custom.care_instructions` → dynamic accordions | Done |
| Dimensions / weight | `custom.dimensions_note` → dynamic accordions | Done |
| Shipping & returns per product | `custom.shipping_returns_note` → dynamic accordions | Done |
| `product.story` | Already read by `product-story.liquid` | Existing |
| `product.artistDisplay.name` | Already read by `product-artist-card.liquid` | Existing |
| Size guide / size table | Already read by `product-size-guide.liquid` | Existing |
| Related products by feeling | Documented limitation; uses Shopify product-recommendations | Deferred |

## Product metafields required

See `docs/shopify-pdp-data-parity-metafields.md` for the full table. Key metafields used by the new sections:

| Metafield | Type | Used by |
|-----------|------|---------|
| `custom.feeling` | metaobject_reference → feeling | purchase-context (pill) |
| `custom.subfeeling` | metaobject_reference → subfeeling | purchase-context (pill) |
| `custom.fit_note` | multi_line_text_field | purchase-context + accordions |
| `custom.low_stock_message` | single_line_text_field | purchase-context (urgency) |
| `custom.whatsapp_help_url` | url | purchase-context (button) |
| `custom.trust_chips` | list.single_line_text_field | purchase-context (chips) |
| `custom.features` | list.single_line_text_field | purchase-context (chips) |
| `custom.design_story` | rich_text_field | accordions (Design story) |
| `custom.materials` | rich_text_field | accordions (Materials & print) |
| `custom.care_instructions` | rich_text_field | accordions (Care instructions) |
| `custom.dimensions_note` | rich_text_field | accordions (Dimensions & weight) |
| `custom.shipping_returns_note` | rich_text_field | accordions (Shipping & returns) |

## Purchase-context section

- Reads feeling, subfeeling, fit note, low stock message, WhatsApp URL, trust chips, and features from product metafields.
- Renders feeling/subfeeling as styled pills.
- Renders fit note as a plain text line.
- Renders product features as outline chips.
- Renders trust chips from metafield list; if empty and `show_default_trust_chips` is enabled, shows fallback chips: 220 GSM cotton, Printed in Egypt, COD available, 14-day exchange.
- Renders low-stock urgency line in sale color.
- Renders WhatsApp support button only when URL is set.
- No JavaScript.
- Defensive no-op: if no data and not `request.design_mode`, renders nothing.
- Theme editor placeholder lists required metafields when no data is present.
- Placed immediately after `main` in `product.json`.

## Dynamic accordions section

- Reads materials, design story, care instructions, dimensions note, shipping/returns note, and fit note from product metafields.
- Renders each populated field as a native `<details>/<summary>` accordion.
- Accordions render only when their metafield is non-empty.
- No JavaScript.
- If all metafields are empty and not in `request.design_mode`, renders nothing.
- Theme editor placeholder lists required metafields when no data is present.
- Optional section heading with configurable size.
- Placed after `product_artist_card` in `product.json`.

## What is now dynamic

- Feeling/subfeeling pills on the PDP (previously missing entirely).
- Product features and trust chips (previously static-only in `product-trust-strip`).
- WhatsApp help button (previously missing; only present as static link elsewhere).
- Low-stock urgency message (previously missing).
- Fit note near buy box (previously only in size-guide section).
- Design story, materials, care, dimensions, shipping/returns (previously empty Dawn collapsible rows).

## What remains static

- `product-delivery-payment` section: delivery and payment info is still section-level static settings.
- `product-trust-strip` section: still uses static badge settings (can be kept as backup or later migrated to metafield-driven).
- `product-size-guide`: still uses static `size_table` metaobject reference and `size_fit_note` metafield (already dynamic).

## What remains missing compared with web

- **Related products by feeling/subfeeling**: Shopify Dawn `related-products` uses Shopify's product-recommendations API, which is not guaranteed to return products from the same feeling. Recommendation: create manual collections (`/collections/feeling-zodiac`) and link to them, or use a third-party app for algorithmic same-feeling recommendations.
- **Sticky add-to-cart / mobile CTA bar**: Would require JavaScript and careful integration with the existing buy-buttons snippet. Deferred to Phase 1.7+.
- **Gallery lightbox / keyboard navigation**: Dawn's main-product gallery already has basic lightbox; advanced keyboard controls would require JS.
- **Live stock status per size**: Shopify's inventory API can be queried via AJAX, but this touches the product form. Deferred.
- **Color variant media switching**: Dawn's variant picker already handles this for color swatches; advanced gallery switching would require JS.

## Safety notes

- **No checkout logic changed.**
- **No cart logic changed.**
- **No payment/shipping logic changed.**
- **No Dawn product form changed.**
- `snippets/buy-buttons.liquid` untouched.
- `snippets/product-variant-picker.liquid` untouched.
- `sections/main-product.liquid` untouched.
- `sections/main-cart-items.liquid` untouched.
- `sections/main-cart-footer.liquid` untouched.
- `assets/gift-wrap.js` untouched.
- `sections/product-story.liquid` reviewed and confirmed adequate; no changes needed.
- Empty Dawn collapsible rows inside `main-product` (`collapsible-row-0` through `collapsible-row-3`) were left untouched. These can be hidden manually in the Theme Editor if the new accordions provide sufficient coverage.
- All new sections use Liquid + CSS only. No JavaScript. No external libraries.
- RTL-safe logical CSS properties preserved (`inline-size`, `block-size`, `padding-inline`, `padding-block`, `margin-block-start`, `margin-block-end`, `border-block`).
- Mobile-first behavior maintained.

## Theme check result

```
203 files inspected with 26 total offenses found across 11 files.
2 errors.
24 warnings.
```

- **0 new HORO errors.**
- **0 new HORO warnings.**
- All 26 offenses match the pre-existing baseline from Phase 1.6c.
- New files (`product-purchase-context.liquid`, `product-details-accordions.liquid`) produced zero offenses.

## Manual test checklist

- [ ] Product with all metafields populated — feeling pill, features, trust chips, fit note, WhatsApp button, low-stock message all render
- [ ] Product with no metafields — purchase-context and accordions render nothing (no broken layout)
- [ ] Product with only `custom.feeling` set — single pill renders, no other elements
- [ ] Product with `custom.trust_chips` empty but `show_default_trust_chips` enabled — fallback chips render
- [ ] Product with `custom.trust_chips` populated — metafield chips render, no fallback
- [ ] Artist present — `product-artist-card` still renders as before
- [ ] Size guide present — `product-size-guide` still renders as before
- [ ] Product story present — `product-story` still renders as before
- [ ] WhatsApp URL present — button renders and link works
- [ ] WhatsApp URL absent — button does not render
- [ ] Mobile 375px — pills wrap, chips wrap, accordions stack, no horizontal overflow
- [ ] Add to cart still works (Dawn form unchanged)
- [ ] Cart still works (items, quantities, removal)
- [ ] Checkout still works (from cart and from dynamic checkout)
- [ ] Theme editor — placeholder text visible for empty purchase-context and accordions
- [ ] RTL quick check — logical CSS holds, text alignment correct in accordions and pills

---
*Phase 1.6d complete. Do not proceed to Phase 1.7 without explicit direction.*
