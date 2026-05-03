# Step 26 — Phase 1 Acceptance Test

> **Status**: Complete. Automated checks + manual storefront testing done. Verdict: PASS WITH ISSUES.  
> **Rule**: No theme modifications unless a critical bug is found. No code changes required — all issues are Shopify Admin configuration tasks.

---

## Test environment

| Field | Value |
|---|---|
| Store | horo-9109.myshopify.com |
| Theme | Dawn v15.4.1 + HORO custom sections (medusa branch) |
| Live theme handle | `elegant-textures` |
| Date | 2026-05-03 |
| Tester | — |
| Browser | — |
| Device sizes tested | — |

---

## Automated / code-level checks completed

| Check | Result | Notes |
|---|---|---|
| Theme file integrity (`shopify theme check`) | **PASS** | 198 files inspected. 26 total offenses (2 errors, 24 warnings) across 11 files — **identical to pre-Step 20 baseline**. Zero new HORO errors or warnings introduced. |
| JSON template validity | **PASS** | All 19 `.json` templates parse successfully, including HORO additions: `page.about-horo.json`, `page.faq-horo.json`, `page.exchange-policy-horo.json`, `page.feelings-hub.json`, `page.occasions-hub.json`, `page.gifts-hub.json`, `page.size-guide.json`. |
| Liquid section schemas | **PASS** | All HORO sections (`page-about-horo`, `page-faq-horo`, `page-exchange-policy-horo`, `product-trust-strip`, `product-gift-wrap-upsell`, `product-delivery-payment`, `product-size-guide`, `feelings-hub`, `occasions-hub`, `gifts-hub`) contain valid schema with `block_order` in presets. No SchemaPresetsBlockOrder warnings on HORO files. |
| CSS asset references | **PASS** | Verified: `component-horo-pages.css`, `component-product-trust-strip.css`, `component-size-guide.css`, `component-delivery-payment.css`, `component-product-story.css`, `component-product-artist-card.css`, `component-gift-wrap.css`, `component-home-hero.css`, `component-home-feeling-grid.css`, `component-home-occasion-grid.css`, `component-home-primary-routes.css` all exist in `assets/`. |
| JavaScript integrity | **PASS** | `gift-wrap.js` passes all checks: `dataset.giftWrapBound` guard present, `window.routes.cart_add_url` dynamic URL with `'/cart/add.js'` fallback. No other HORO custom JS files. |
| No Dawn protected files modified in Steps 20–23 | PASS | Confirmed via git diff and `shopify theme check` baseline. |

---

## Summary verdict

**PASS WITH ISSUES** — Theme code is sound. All issues are configuration/content items resolvable via Shopify Admin. No code changes required.

- ~~PASS~~ / **PASS WITH ISSUES** / ~~FAIL~~

---

## Acceptance checklist

> Fill in after manual testing on the live storefront (`horo-9109.myshopify.com`, theme `elegant-textures`).

| Area | Result | Notes |
|---|---|---|
| Homepage | **PASS WITH ISSUES** | Hero, trust ribbon, route cards, featured collection render correctly. Lower sections (rich_text, collage, video, multicolumn) are nearly invisible because they use default Dawn color scheme with no configured content. These should be hidden in the theme editor until content is added. |
| Hub pages | **PASS WITH ISSUES** | `/pages/feelings`, `/pages/occasions`, `/pages/about`, `/pages/faq`, `/pages/exchange`, `/pages/size-guide` render correctly with Dawn header/footer. `/pages/gifts` returns **404** — page does not exist in Admin. |
| Collections | **PASS** | `/collections/all` and custom collections render correctly. Product grid, filters, sorting work. Custom hero sections only appear when metaobject data exists. No empty custom heroes on normal collections. |
| Product page | **PASS** | Images, variant picker, quantity, add-to-cart, buy-it-now work. Product story, artist card, delivery/payment cards, size guide, gift wrap upsell, trust strip, related products all render correctly where data exists. |
| Cart | **PASS** | Product appears, quantity +/- works, remove works. Gift wrap adds once, no duplicate, removable with Dawn native remove. Subtotal updates correctly. |
| COD checkout | **PASS** | Test COD order placed successfully. Shipping rate appeared. Order visible in Admin. Test order cancelled after verification. |
| Instapay checkout | **PASS WITH ISSUES** | Test manual/Instapay order placed successfully. Order visible in Admin. **Note**: Tax behavior differed between COD and manual payment totals — see Tax/shipping notes below. Test order cancelled after verification. |
| Mobile 375px | **PASS** | No horizontal overflow. Buttons readable. Images render correctly. Size guide table scrolls safely. Cart and checkout usable. |
| Arabic RTL | **NOT TESTED** | Arabic storefront not yet enabled. Test after language setup. |
| Console errors | **PASS** | No red JavaScript errors caused by HORO custom code on homepage, product page, cart, or collection pages. |
| Performance quick check | **NOT TESTED** | Lighthouse audit not run. Recommend running before soft launch. |

---

## Issues found

| Severity | Issue | Page / Area | Recommended action |
|---|---|---|---|
| **High** | `/pages/gifts` returns 404 | Hub pages | **Create the Gifts page in Shopify Admin** (see admin steps below). Assign template `page.gifts-hub`. |
| **Medium** | Homepage lower sections nearly invisible | Homepage | **Hide unused Dawn default sections** in the theme editor: rich_text, collage, video, multicolumn. Or configure them with real content and matching color scheme. |
| **Medium** | Main navigation missing hub/support links | Site-wide | **Update Main menu in Shopify Admin** (see admin steps below) to include Feelings, Occasions, Gifts, About, FAQ, Exchange, Size Guide. |
| **Medium** | Tax behavior inconsistent between COD and manual payment | Checkout | **Review tax settings in Admin** (Settings → Taxes and duties). COD and Instapay/manual may apply tax differently. Verify tax is configured consistently for all payment methods before launch. |
| **Low** | Lighthouse performance not tested | Site-wide | Run Lighthouse on homepage, product page, and collection page before soft launch. |
| **Low** | Arabic RTL not tested | Site-wide | Enable Arabic language and test `/ar` paths after content is ready. |

**Severity definitions:**
- **Critical**: blocks purchase or checkout
- **High**: breaks product / cart / collection experience
- **Medium**: hurts clarity or trust
- **Low**: cosmetic / content improvement

---

## Payment result

| Method | Result | Notes |
|---|---|---|
| COD | **PASS** | Test order placed, shipping rate appeared, order visible in Admin, cancelled after verification. |
| Instapay / manual | **PASS** | Test order placed via manual payment instructions, order visible in Admin, cancelled after verification. |
| Card payments | **Not configured** | No third-party card gateway (Paymob, PayTabs, Telr, etc.) connected. Card payments not available at checkout. **Pre-launch requirement** if card payments are desired. |

**Tax discrepancy observed**: COD and manual/Instapay checkout totals showed different tax behavior. This is likely a tax configuration issue in Admin, not a theme bug. Verify Settings → Taxes and duties before launch.

---

## Tax / shipping notes

| Area | Status | Required decision before launch |
|---|---|---|
| Shipping rates configured for Egypt | **Verified working** | Shipping rates appeared during checkout for both COD and manual payment tests. |
| Taxes configured | **Needs review** | Tax behavior differed between COD and manual/Instapay checkout totals. Review Settings → Taxes and duties to ensure consistent tax application across all payment methods. |
| Currency = EGP | **Assumed EGP** | Verify in Admin → Settings → Store details → Store currency is set to EGP. |

---

## Known limitations / acceptable warnings

The following are expected and do **not** block Phase 1 acceptance:

1. **Metaobject-dependent sections show empty when data is missing** — e.g., feeling grid, occasion grid, product story, artist card. This is by design; sections conditionally render only when metaobjects / metafields exist.
2. **Pre-existing Dawn theme-check warnings** — 24 warnings and 2 errors in baseline. These are in Dawn core snippets and were present before HORO customizations.
3. **Google Fonts RemoteAsset warning** — If `Cairo` Arabic font is loaded from Google Fonts, this is an expected Shopify theme-check info item.
4. **Shopify Payments unavailable in Egypt** — Confirmed Shopify fact. Card payments require a third-party gateway (Paymob, PayTabs, Telr, etc.).
5. **Gift wrap upsell requires a configured gift-wrap product** — The section dynamically checks for a `gift-wrap` product handle. If none exists, the section silently does not render. This is the intended behavior.

---

## Final recommendation

- **Verdict**: **PASS WITH ISSUES** — Theme code is production-ready. Remaining items are Shopify Admin configuration tasks, not code bugs.
- **Ready for soft launch**: **Yes, after completing the admin setup steps below.**
- **Do not proceed to Phase 2** until admin setup is complete and `/pages/gifts` resolves.

### Required fixes before launch (all via Admin, no code changes)

1. **Create `/pages/gifts` page** (high severity — 404 on live site)
   - Online Store → Pages → Add page
   - Title: `Gifts`
   - Handle: `gifts`
   - Template: `page.gifts-hub`
   - Save and verify at `horo-9109.myshopify.com/pages/gifts`

2. **Update Main menu navigation** (medium severity — broken discoverability)
   - Online Store → Navigation → Main menu
   - Add links:
     - Feelings → `/pages/feelings`
     - Occasions → `/pages/occasions`
     - Gifts → `/pages/gifts`
     - About → `/pages/about`
     - FAQ → `/pages/faq`
     - Exchange → `/pages/exchange`
     - Size Guide → `/pages/size-guide`
   - Remove or reorder any placeholder/default menu items.

3. **Hide or configure unused Dawn homepage sections** (medium severity — invisible/empty sections)
   - Customize theme → Homepage
   - Find sections: `rich_text`, `collage`, `video`, `multicolumn`
   - For each: either add real content + matching color scheme, or click the eye icon to **hide** the section.
   - Only sections with configured content should remain visible.

4. **Review tax settings** (medium severity — inconsistent checkout totals)
   - Settings → Taxes and duties
   - Verify tax is configured consistently for all payment methods (COD and manual/Instapay).
   - Check if "Include tax in price" is set consistently.
   - Verify Egypt VAT rules if applicable.

5. **Verify store currency = EGP**
   - Settings → Store details → Store currency
   - Confirm EGP is selected.

### Optional improvements after launch

1. **Run Lighthouse audit** on homepage, product page, and collection page. Target: Performance > 60, LCP < 2.5s, CLS < 0.1.
2. **Enable Arabic language** and test RTL layout on `/ar` paths.
3. **Connect a card payment gateway** (Paymob, PayTabs, Telr) if card payments are required.
4. **Add real content** to the hidden Dawn sections (rich_text, collage, video, multicolumn) when content is ready, then unhide them.

---

## Admin setup quick reference

| Task | Path in Shopify Admin |
|---|---|
| Create Gifts page | Online Store → Pages → Add page |
| Update navigation | Online Store → Navigation → Main menu |
| Hide homepage sections | Online Store → Themes → Customize → Homepage → Section visibility (eye icon) |
| Review tax settings | Settings → Taxes and duties |
| Verify currency | Settings → Store details → Store currency |
| Add card gateway | Settings → Payments → Add payment method |

---

> No theme code changes were required for any of the issues found. All are Shopify Admin configuration tasks. Do not proceed to Phase 2 until the Required fixes above are completed.
