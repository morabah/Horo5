import type { Metadata } from 'next';

import { ComparisonFaqPage } from '@/storefront/pages/ComparisonFaqPage';

export const metadata: Metadata = {
  title: 'Why HORO, not a normal printed T-shirt? | HORO Egypt',
  description:
    'Compare HORO artist-made tees with cheap print, custom print shops, fashion brands, gift shops, and marketplace sellers.',
};

export default function Page() {
  return <ComparisonFaqPage />;
}
