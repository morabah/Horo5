import { PolicyPageLayout } from '../components/PolicyPageLayout';

const sections = [
  {
    title: 'What we collect',
    body: [
      'We collect the details needed to process and fulfill your order, such as your name, contact information, delivery address, and the products you purchase.',
      'We may also keep basic session and device information that helps the storefront function, remember your cart, and improve the shopping experience.',
    ],
  },
  {
    title: 'How we use it',
    body: [
      'Your information is used to confirm orders, coordinate delivery, share requested order updates, and provide customer support.',
      'We do not present support channels or follow-up promises that are not active on the site.',
    ],
  },
  {
    title: 'Your control',
    body: [
      'You can decide whether to opt into WhatsApp order updates during checkout when that option is shown.',
      'If you need help with a privacy question, use the live HORO support links shown below when they are available.',
    ],
  },
] as const;

export function Privacy() {
  return (
    <PolicyPageLayout
      eyebrow="Policy"
      title="Privacy Policy"
      intro="This summary explains what information HORO uses to run the storefront and support each order."
      sections={[...sections]}
    />
  );
}
