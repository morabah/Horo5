# Step 24 — Payment Verification

> **Status**: Pending user-provided Shopify Admin findings. This is a verification/documentation step only — no theme files were modified.

## Store

| Field | Value |
|---|---|
| Store domain | horo-9109.myshopify.com |
| Store country | Egypt (assumed from context) |
| Store currency | EGP (assumed from context) |
| Current theme tested | Dawn v15.4.1 + HORO custom sections (medusa branch) |
| Date checked | 2026-05-03 |

---

## Public Shopify facts for Egypt (pre-verified)

| Item | Status | Source |
|---|---|---|
| Shopify Payments | **Unavailable** in Egypt | Shopify docs: Shopify Payments is supported in ~22 countries; Egypt is not on the list. |
| EGP currency | **Supported** for selling | Shopify supports EGP as a selling currency. |
| Third-party payment gateways for Egypt | **Required** | Paymob, PayTabs, Telr, and others offer Shopify-integrated gateways for Egypt. |
| Cash on Delivery (COD) | **Available** as a manual payment method in any Shopify store. |
| Manual payment methods | **Available** — bank transfer, cash on delivery, custom instructions. |
| Instapay | **Not a native Shopify payment method** — must be implemented via manual payment instructions or a third-party gateway. |
| Fawry / Meeza | **Not native Shopify methods** — require a gateway provider (e.g., Paymob) that supports them. |

---

## Payment methods checked

> **Awaiting Shopify Admin inspection.** Fill in the table below after checking:
> **Settings → Payments** in the Shopify Admin for `horo-9109.myshopify.com`.

| Method | Status | Notes | Action needed |
|---|---|---|---|
| Cash on Delivery | **Needs admin check** | Available as manual payment in all plans, but must be explicitly enabled. | Verify it is active in Admin → Settings → Payments |
| Bank transfer | **Needs admin check** | Available as manual payment; can add instructions. | Verify it is active and instructions are set |
| Instapay manual instructions | **Needs admin check** | Can be added as a "Custom payment method" or within bank transfer instructions. | Verify if listed under manual payments or custom methods |
| Card gateway | **Needs admin check** | Requires a third-party provider (PayTabs, Paymob, Telr, etc.) since Shopify Payments is unavailable in Egypt. | Check if any card gateway is already connected |
| Fawry / Meeza | **Needs admin check** | Requires a gateway provider that supports them (e.g., Paymob). | Check if visible in the gateway list or connected provider settings |

---

## Checkout copy risk

> **Awaiting admin verification.** Below is the current theme copy and whether it aligns with known Shopify Egypt capabilities.

| Theme claim | Supported by setup? | Notes | Action before launch |
|---|---|---|---|
| "Cash on Delivery available at checkout" | **Unknown** — needs admin check | COD is *possible* on any plan but must be explicitly enabled. If not enabled, this claim is false. | **Verify COD is active in Admin → Payments before launch.** If not active, either enable it or remove the claim. |
| "Manual confirmation may be required" | **Yes — inherently true** | Bank transfer / Instapay as manual payments always require manual confirmation. | Safe to keep as-is. |
| "Delivery window depends on your area" | **Yes — inherently true** | Shipping rates and delivery windows are location-dependent. | Safe to keep as-is. |
| "14-day exchange — see policy" | **Policy content matter, not payment** | This is a store policy claim, not a payment capability. | Verify the exchange policy page content matches actual operations. |

---

## What the user must verify in Shopify Admin

Please open `horo-9109.myshopify.com/admin` and check the following, then reply with findings or screenshots:

### 1. Settings → Payments
- Is **Cash on Delivery** listed under "Manual payment methods"? Is it active?
- Is **Bank transfer** listed under "Manual payment methods"? Is it active?
- Is there a **Custom payment method** for Instapay? Is it active?
- Under **Supported payment methods**, is any card gateway connected (e.g., PayTabs, Paymob, Telr, 2Checkout)?
- What does the "Add payment method" dropdown show? Screenshot if possible.

### 2. Settings → Markets
- Is the primary market set to Egypt?
- Is EGP the store currency?
- Is there any currency conversion or multi-currency setup?

### 3. Settings → Shipping and delivery
- Are shipping rates configured for Egypt governorates?
- Is there a shipping profile that limits COD by location?

### 4. Settings → Taxes and duties
- Are taxes configured for Egypt?
- Is the store set to include or exclude tax in prices?

### 5. Online Store → Themes
- Is the current active theme the one with HORO sections (medusa branch)?
- Are there any unpublished changes that need to be published before checkout testing?

---

## Blockers before Step 25

> **To be updated after user provides admin findings.**

| # | Blocker | Severity |
|---|---|---|
| 1 | COD not enabled in Admin (if claim remains in theme) | High |
| 2 | No card gateway configured — checkout will only show manual payments | Medium |
| 3 | Shipping rates not set — checkout may fail or show "no shipping available" | High |
| 4 | Taxes not configured — checkout totals may be incorrect | Medium |
| 5 | EGP currency not set — prices may display in wrong currency | High |

---

## Preliminary recommendation

**Do not proceed to Step 25 until the following are confirmed:**

1. **Store currency is EGP** (Settings → Store details → Store currency).
2. **Shipping rates are configured** for at least one zone covering Egypt (Settings → Shipping and delivery).
3. **At least one payment method is active** — either COD (manual) or a connected card gateway.
4. **Theme copy matches actual payment setup** — if COD is not enabled, remove "Cash on Delivery available at checkout" from the theme or enable it first.

If all the above are confirmed, **proceed to Step 25**. If any are missing, address the blocker first.

---

## How to complete this report

Reply to this message with findings from each Admin section listed above, or attach screenshots of:
- Settings → Payments
- Settings → Markets
- Settings → Shipping and delivery
- Settings → Taxes and duties

I will update this file with the findings and give a final proceed / do-not-proceed recommendation for Step 25.
