import { collectPdpProofItems } from '../pdpProof';
import type { Product } from '../catalog-types';

describe('collectPdpProofItems', () => {
  it('returns branded proof cards when gallery has no proof tags', () => {
    const items = collectPdpProofItems({
      slug: 'test',
      name: 'Test',
      priceEgp: 799,
      media: { main: '/images/hero/horo_vectorized_v2.svg', gallery: [] },
    } as unknown as Product);

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.tag)).toEqual(['proof_print', 'proof_fabric', 'proof_wash']);
  });

  it('prefers tagged gallery proof over fallbacks', () => {
    const items = collectPdpProofItems({
      slug: 'test',
      name: 'Test',
      priceEgp: 799,
      media: {
        gallery: [{ url: 'https://cdn.test/fabric.jpg', tag: 'proof_fabric' }],
      },
    } as unknown as Product);

    expect(items[0]?.url).toBe('https://cdn.test/fabric.jpg');
    expect(items.length).toBeGreaterThan(1);
  });
});
