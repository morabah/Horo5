# Shopify Navigation & Footer — Final Checklist

## Main Menu (Header)

Recommended links for customer launch:
- Home
- Shop (`/collections/all`)
- Feelings (`/pages/feelings`)
- Gifts (`/pages/gifts`)

**During testing:** All pages can remain in the menu (including Occasions, About, FAQ).

**Before customer launch:** Move support and policy pages to the footer. Keep the main menu minimal and conversion-focused.

## Footer Menu

Recommended footer link groups:

**Shop**
- All products
- Feelings
- Occasions
- Gifts

**Support**
- FAQ (`/pages/faq-horo`)
- Exchange policy (`/pages/exchange-policy-horo`)
- Size guide (`/pages/size-guide`)
- Contact (`/pages/contact`)

**Legal**
- Privacy policy
- Terms of service
- Shipping policy

## Important Notes

1. **Gifts page readiness:** The Gifts hub depends on `occasion` metaobjects with `is_gift_occasion: true`. If these metaobjects do not exist, the page will show an empty grid. Hide "Gifts" from the main menu until the metaobjects are populated.

2. **Feelings/Occasions hub readiness:** These pages depend on `feeling` and `occasion` metaobjects. They will show editor-only placeholders if empty. You can keep them in the menu during testing, but ensure metaobjects are populated before launch.

3. **Contact page:** Verify that `/pages/contact` exists and the contact form is configured in Shopify Admin.

4. **Policy pages:** Privacy, Terms, and Shipping policy pages must be created in Shopify Admin under Settings > Policies and linked in the footer.

## Pre-Launch Checklist

- [ ] Main menu has max 4–5 items
- [ ] Footer has Shop, Support, and Legal groups
- [ ] Gifts link is hidden if gift metaobjects are not ready
- [ ] Contact page exists and works
- [ ] Policy pages are created and linked
- [ ] No broken links in navigation
