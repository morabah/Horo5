import { productMeaningLine } from '../productMeaningLine';

describe('productMeaningLine', () => {
  it('prefers useCase when set', () => {
    expect(
      productMeaningLine({
        name: 'Quiet Revolt',
        useCase: 'For everyday confidence.',
        story: 'For the one who speaks softly.',
      }),
    ).toBe('For everyday confidence.');
  });

  it('uses story when it starts with For the one who', () => {
    expect(
      productMeaningLine({
        name: 'The Weight of Light',
        story: 'For the one who carries every feeling. Still walks toward the light.',
      }),
    ).toBe('For the one who carries every feeling');
  });

  it('returns undefined when no copy', () => {
    expect(productMeaningLine({ name: 'Test', story: '' })).toBeUndefined();
  });
});
