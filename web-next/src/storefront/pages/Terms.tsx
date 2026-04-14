import { PolicyPageLayout } from '../components/PolicyPageLayout';

const sections = [
  {
    title: 'Using the store',
    body: [
      'By placing an order with HORO, you confirm that the information you provide at checkout is accurate and complete enough to fulfill the purchase.',
      'Product availability, launch timing, and pricing can change without notice before an order is confirmed.',
    ],
  },
  {
    title: 'Orders and fulfillment',
    body: [
      'Orders are accepted after checkout submission and fulfillment review. Shipping speed, payment method, and item availability affect delivery timing.',
      'If we cannot fulfill an order as requested, we may contact you through the live support channels available on the site to resolve the issue.',
    ],
  },
  {
    title: 'Policies connected to your order',
    body: [
      'Exchange handling is governed by the HORO Exchange Policy, which should be reviewed alongside these terms before purchase.',
      'Continued use of the site means you accept the current version of these terms and any linked storefront policies.',
    ],
  },
] as const;

export function Terms() {
  return (
    <PolicyPageLayout
      eyebrow="Policy"
      title="Terms of Service"
      intro="These terms set the basic rules for browsing, ordering, and using HORO’s storefront."
      sections={[...sections]}
    />
  );
}
