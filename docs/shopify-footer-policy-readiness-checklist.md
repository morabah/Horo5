# HORO Shopify Footer & Policy Readiness Checklist

## Policy pages

- [ ] **Privacy policy**
  - Path: `/pages/privacy-policy` (or similar)
  - Status: Shopify page exists; content must be populated in Shopify Admin
  - Recommendation: Add merchant-specific privacy details (contact, data handling, cookies)

- [ ] **Terms of service**
  - Path: `/pages/terms-of-service` (or similar)
  - Status: Shopify page exists; content must be populated
  - Recommendation: Add local Egypt commerce terms, returns/exchange references, and contact info

- [ ] **Shipping policy**
  - Path: `/pages/shipping-policy` (or similar)
  - Status: Shopify page exists; content must be populated
  - Recommendation: Include governorates, typical timelines, COD eligibility, and tracking info

- [ ] **Exchange policy**
  - Path: `/pages/exchange-policy-horo`
  - Status: Page template exists and was cleaned up in Phase 1.6e
  - Recommendation: Confirm final wording with merchant before launch

- [ ] **Contact page**
  - Path: `/pages/contact`
  - Status: Template exists with contact form
  - Recommendation: Verify form recipients and auto-reply in Shopify Admin

- [ ] **FAQ page**
  - Path: `/pages/faq-horo`
  - Status: Template exists with collapsible FAQ items + support CTA added in Phase 1.6e
  - Recommendation: Populate merchant-specific answers in theme customizer or via metaobjects

- [ ] **Size guide page**
  - Path: `/pages/size-guide`
  - Status: Template exists with measurement table
  ️ Recommendation: Verify measurements against actual product specs

## Menu structure

### Main menu (header)

Recommended order:

1. Home → `/`
2. Shop → `/collections/all`
3. Feelings → `/pages/feelings`
4. Gifts → `/pages/gifts`
5. About → `/pages/about-horo`

Notes:
- Keep main menu short to avoid crowding on mobile.
- Occasions can be nested under Shop or linked from the Occasions hub if needed.

### Footer menu

Recommended links (single footer menu or split into two columns):

- FAQ → `/pages/faq-horo`
- Exchange → `/pages/exchange-policy-horo`
- Size Guide → `/pages/size-guide`
- Contact → `/pages/contact`
- Privacy → `/pages/privacy-policy`
- Terms → `/pages/terms-of-service`
- Shipping Policy → `/pages/shipping-policy`

Notes:
- Ensure every linked page exists and has content before launch.
- If using Shopify’s native policy pages, sync footer links to those exact handles.

## Pre-launch verification

- [ ] All policy pages have final merchant-approved copy
- [ ] Footer menu links resolve without 404s
- [ ] Main menu links resolve without 404s
- [ ] Contact form sends to the correct email
- [ ] Exchange policy wording is merchant-approved
- [ ] Shipping policy includes Cairo/Giza and other governorate timelines
- [ ] Privacy policy mentions Shopify as the platform and any third-party apps
