import { PolicyPageLayout } from '../components/PolicyPageLayout';

const sections = [
  {
    title: 'What this covers',
    body: [
      'We offer exchange support for sizing issues and eligible defects within 14 days of delivery.',
      'Items should be unworn, unwashed, and returned with the original packaging so we can process the exchange quickly.',
    ],
  },
  {
    title: 'How exchange requests work',
    body: [
      'Start with your order number and the item you want to exchange. If a replacement size is available, we will confirm the next step before dispatch.',
      'If the requested replacement is unavailable, we will help you choose another eligible design or review the order for the best available resolution.',
    ],
  },
  {
    title: 'What is not eligible',
    body: [
      'Items that show signs of wear, washing, damage after delivery, or missing packaging may not qualify for exchange.',
      'Gift-wrap add-ons, custom handling, and shipping fees are not exchangeable on their own.',
    ],
  },
] as const;

export function Exchange() {
  return (
    <PolicyPageLayout
      eyebrow="Support"
      title="Exchange Policy"
      intro="This page explains how HORO handles exchanges so sizing decisions feel lower risk before checkout."
      sections={[...sections]}
    />
  );
}
