import {
  isImageOverlayPresentation,
  parseHomepagePresentation,
} from '../parseHomepagePresentation';

describe('parseHomepagePresentation', () => {
  it('reads presentation from payload', () => {
    expect(
      parseHomepagePresentation({
        presentation: {
          layout: 'image_overlay',
          showBody: false,
          overlayOpacity: 0.5,
        },
      }),
    ).toMatchObject({
      layout: 'image_overlay',
      showBody: false,
      overlayOpacity: 0.5,
    });
  });

  it('maps legacy editorial layout to image_overlay', () => {
    expect(parseHomepagePresentation({ layout: 'editorial' }).layout).toBe('image_overlay');
  });

  it('detects image overlay mode', () => {
    expect(
      isImageOverlayPresentation({
        presentation: { layout: 'image_overlay' },
      }),
    ).toBe(true);
  });
});
