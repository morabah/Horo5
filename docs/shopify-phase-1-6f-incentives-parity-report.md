# HORO Shopify Phase 1.6f — Incentives & Extended Features Parity Report

## Objective

Compare incentive and extended buying-support features in the custom Medusa/web implementation with the Shopify Dawn-based HORO implementation, then implement only low-risk, Shopify-safe incentive gaps.

## Incentives audit summary

Audited 11 incentive categories across Medusa/web vs. Shopify:

1. **PDP trust and risk reducers** — Mostly implemented; one default wording fix needed
2. **Gift wrap and gifting incentives** — Implemented; needs merchant setup guide
3. **Bundle/AOV incentives** — Missing informational nudge; safe to add
4. **Urgency/stock incentives** — Low-stock metafield ready; live counters deferred
5. **Reviews/social proof** — Not implemented; deferred to apps
6. **Delivery/payment incentives** — Implemented via `product-delivery-payment`
7. **Search/discovery incentives** — Basic Dawn search + support links from 1.6e
8. **Occasion/gift page incentives** — Grid implemented; editorial guide deferred
9. **Cart incentives** — Trust explainer from 1.6e; bundle nudge added now
10. **Policy/support reassurance** — FAQ CTA from 1.6e; exchange page cleaned

## Files created

| File | Purpose |
|------|---------|
| `docs/shopify-incentives-parity-audit.md` | Full incentives parity audit |
| `shopify-theme/sections/cart-bundle-nudge.liquid` | Informational cart AOV nudge |
| `shopify-theme/assets/component-cart-bundle-nudge.css` | Styles for cart bundle nudge |
| `docs/shopify-gifting-incentives-guide.md` | Gift wrap setup + safe copy guide |
| `docs/shopify-discount-incentives-setup.md` | Admin discount setup instructions |
| `docs/shopify-phase-1-6f-incentives-parity-report.md` | This report |

## Files changed

| File | Change |
|------|--------|
| `shopify-theme/sections/product-purchase-context.liquid` | Updated default trust chip: "14-day exchange" → "14-day exchange — terms apply" |
| `shopify-theme/templates/cart.json` | Added `cart-bundle-nudge` section after `cart-trust-explainer`, disabled by default |

## Implemented safe incentives

| # | Incentive | Implementation |
|---|-----------|----------------|
| 1 | PDP trust chip cautious wording | Updated default fallback text to include "terms apply" |
| 2 | Cart bundle nudge | New `cart-bundle-nudge.liquid` — disabled by default, editable heading/text/button, optional discount code display. No cart quantity calculation, no automatic discount logic. |

## Incentives needing Shopify Admin setup

| Incentive | Action required |
|-----------|-----------------|
| Gift wrap product | Ensure product exists, priced, and published |
| Gift wrap upsell | Verify `cart-gift-wrap-upsell` section is enabled in cart.json |
| Low-stock messages | Populate `custom.low_stock_message` metafields per product |
| WhatsApp help URL | Populate `custom.whatsapp_help_url` metafields per product |
| Bundle discount | Create in Shopify Admin (automatic or code) before enabling `cart-bundle-nudge` |
| Delivery estimates | Customize `product-delivery-payment` card bodies in theme customizer |

## Incentives intentionally deferred

| Incentive | Why deferred |
|-----------|------------|
| Free shipping progress bar | Requires cart JS for dynamic calculation |
| Live stock count / "Only X left" | Requires JS + inventory API |
| Notify-me restock form | Requires backend (Klaviyo / Back in Stock app) |
| Reviews / social proof | No real data; use Shopify Product Reviews or Judge.me |
| "Popular" badges / fake social proof | Would require fabricated claims |
| Search suggestions / fuzzy search | JS-heavy rebuild of Dawn search |
| Recently viewed strip | Requires localStorage / JS |
| Gift-ready PDP banner | Can add later with metafield-driven section |
| Gifts hub editorial guide | Same pattern as feelings hub; deferred for merchant priority |

## Copy risk review

| Location | Before | After |
|----------|--------|-------|
| `product-purchase-context` default chip | "14-day exchange" | "14-day exchange — terms apply" |

No other risky claims found in Shopify theme defaults. All existing sections use cautious phrasing:
- "See policy for details"
- "Available at checkout"
- "Delivery window depends on your area"
- "Manual confirmation may be required"

## Safety notes

- No checkout logic changed.
- No cart item logic, quantity, or remove logic changed.
- No product form, variant picker, buy buttons, or price logic changed.
- No payment or shipping settings changed.
- No JavaScript added. All changes are Liquid + CSS only.
- Cart bundle nudge is disabled by default and contains no automatic discount calculation.
- Discount code text is only displayed if explicitly entered by merchant in section settings.
- No fake reviews, fake stock counts, or fake social proof implemented.

## Theme check result

Command: `shopify theme check --path shopify-theme`

- **0 new HORO errors** from Phase 1.6f changes.
- **0 new HORO warnings** from Phase 1.6f changes.
- Baseline pre-existing warnings remain unchanged (26 total offenses across 11 files — gift-wrap variable naming, orphaned snippets, undefined objects in existing sections).

## Manual test checklist

- [ ] Product page trust/feature chips render correctly
- [ ] Product page low-stock message renders when metafield is set
- [ ] Product page WhatsApp URL renders when metafield is set
- [ ] Cart gift wrap upsell shows when cart has items
- [ ] Cart trust explainer renders with 4 cards
- [ ] Cart bundle nudge stays hidden when `enable_bundle_message` is false
- [ ] Cart bundle nudge renders when `enable_bundle_message` is true (test in customizer)
- [ ] Cart bundle nudge shows discount code text when field is filled
- [ ] Checkout still works after all changes
- [ ] Mobile 375px — no layout breakage on cart
- [ ] RTL quick check — logical CSS properties hold up
