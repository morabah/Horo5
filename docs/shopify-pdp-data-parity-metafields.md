# HORO Shopify PDP — Data Model & Metafields Reference

## Objective
Define the product metafield schema required to achieve data parity between the Shopify Dawn PDP and the custom Medusa/web PDP.

---

## Required product metafields (namespace: `custom`)

| Metafield key | Type | Purpose | Example value | Required for MVP |
|---------------|------|---------|---------------|------------------|
| `feeling` | `metaobject_reference` → `feeling` | Primary feeling/vibe tag | `feeling:confidence` | Recommended |
| `subfeeling` | `metaobject_reference` → `subfeeling` | Sub-feeling refinement | `subfeeling:boldness` | Optional |
| `story` | `multi_line_text_field` | Emotional short story (rendered in product-story) | "Born from a late-night sketch…" | Yes |
| `story_description` | `rich_text_field` or `multi_line_text_field` | Longer design narrative (collapsible) | "The artist spent three weeks…" | Yes |
| `design_story` | `rich_text_field` | Design process / inspiration note | "Inspired by Cairo street art…" | Recommended |
| `fit_note` | `multi_line_text_field` | Model fit / sizing guidance | "Oversized fit. Model is 180cm wearing L." | Yes |
| `materials` | `rich_text_field` | Fabric and print material details | "100% Egyptian cotton, 220 GSM…" | Recommended |
| `care_instructions` | `rich_text_field` | Washing and care guidance | "Machine wash cold, hang dry…" | Recommended |
| `dimensions_note` | `rich_text_field` | Physical dimensions / weight | "Unisex cut. Chest 56cm (M)." | Optional |
| `shipping_returns_note` | `rich_text_field` | Product-specific delivery info | "Ships within 2–4 business days…" | Optional |
| `features` | `list.single_line_text_field` | Product feature chips | `["220 GSM cotton", "Screen printed", "Pre-shrunk"]` | Recommended |
| `trust_chips` | `list.single_line_text_field` | Trust/social-proof chips | `["Printed in Egypt", "COD available"]` | Optional |
| `whatsapp_help_url` | `url` | Direct WhatsApp support link | `https://wa.me/201xxxx` | Optional |
| `low_stock_message` | `single_line_text_field` | Urgency copy when stock is low | "Only 3 left — selling fast" | Optional |
| `size_fit_note` | `multi_line_text_field` | Existing: size/fit guidance | Same as `fit_note` (legacy) | Existing |
| `size_table` | `metaobject_reference` → `size_table` | Existing: size chart data | `size_table:horo-unisex` | Existing |
| `artist` | `metaobject_reference` → `artist` | Existing: artist attribution | `artist:ahmed-raafat` | Existing |

---

## Optional metaobjects referenced

| Metaobject | Fields (suggested) | Used by |
|------------|-------------------|---------|
| `artist` | `name` (single_line_text), `bio` (multi_line_text), `avatar` (file_reference) | `product.artist` → product-story, artist-card |
| `feeling` | `name` (single_line_text), `slug` (single_line_text), `color` (color) | `product.feeling` → purchase-context pill |
| `subfeeling` | `name` (single_line_text), `parent_feeling` (metaobject_reference → feeling) | `product.subfeeling` → purchase-context pill |
| `size_table` | `name`, `rows` (json / list of measurements) | `product.size_table` → size-guide section |

---

## Shopify Admin setup instructions

1. **Settings → Custom data → Metafields → Products**
2. Add each metafield above with the correct type.
3. For `metaobject_reference` types, create the metaobject definition first (e.g., `feeling`, `artist`), then add the product metafield that references it.
4. For `list.single_line_text_field`, select **List of values** → **Single line text**.
5. Populate metafields on a test product first, then verify each new section renders correctly.

---

## Migration from Medusa/web fields

| Medusa/web field | Shopify metafield | Notes |
|------------------|-------------------|-------|
| `product.primaryFeelingSlug` | `custom.feeling` (metaobject) | Convert slug to metaobject reference |
| `product.feelingSlug` | `custom.feeling` (fallback) | Same as above |
| `product.artistDisplay.name` | `custom.artist` (metaobject) + `artist.name` | Use metaobject name field |
| `product.storyDescription` | `custom.story_description` | Rich text preferred |
| `product.story` | `custom.story` | Plain multi-line text |
| `product.fitLabel` | `custom.fit_note` | Single guidance line |
| `product.physicalAttributes.material` | `custom.materials` | Rich text for formatting |
| `product.physicalAttributes.weight` | `custom.dimensions_note` | Include in dimensions accordion |
| `product.trustBadges` | `custom.trust_chips` | List of single-line text |
| `product.pdpTagLabels` | `custom.features` | List of single-line text |
| `HORO_SUPPORT_CHANNELS.whatsappSupportUrl` | `custom.whatsapp_help_url` | Per-product override optional |
| `inventoryHintBySize` / stock status | `custom.low_stock_message` | Manual copy; auto-stock integration later |

---

## Sections that read these metafields

| Section | Metafields consumed |
|---------|---------------------|
| `product-story` | `custom.story`, `custom.story_description` |
| `product-artist-card` | `custom.artist` (metaobject) |
| `product-size-guide` | `custom.size_table` (metaobject), `custom.size_fit_note` |
| `product-purchase-context` (new) | `custom.feeling`, `custom.subfeeling`, `custom.fit_note`, `custom.low_stock_message`, `custom.whatsapp_help_url`, `custom.trust_chips`, `custom.features` |
| `product-details-accordions` (new) | `custom.materials`, `custom.design_story`, `custom.care_instructions`, `custom.dimensions_note`, `custom.shipping_returns_note`, `custom.fit_note` |
| `product-trust-strip` | Static section settings (not metafield-driven) |
| `product-delivery-payment` | Static section settings (not metafield-driven) |

---

## Backwards compatibility

- All new metafields are **optional**.
- Sections use defensive Liquid (`!= blank`) and render nothing if data is missing.
- Theme editor placeholders are shown only in `request.design_mode`.
- Existing `custom.story`, `custom.story_description`, `custom.artist`, `custom.size_fit_note`, `custom.size_table` continue to work unchanged.
