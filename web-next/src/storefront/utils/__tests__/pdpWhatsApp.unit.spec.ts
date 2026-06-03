import { buildPdpWhatsAppSupportMessage, buildPdpWhatsAppSupportUrl } from '../pdpWhatsApp';

describe('pdpWhatsApp', () => {
  it('builds English message with product and size', () => {
    const message = buildPdpWhatsAppSupportMessage({
      productName: 'The Weight of Light',
      size: 'M',
      locale: 'en',
    });
    expect(message).toContain('The Weight of Light');
    expect(message).toContain('size M');
  });

  it('appends text query param to support URL', () => {
    const url = buildPdpWhatsAppSupportUrl('https://wa.me/201234567890', {
      productName: 'Quiet Revolt',
      size: 'L',
      locale: 'en',
    });
    expect(url).toContain('text=');
    expect(url).toContain('Quiet');
  });

  it('returns null for invalid base URL', () => {
    expect(
      buildPdpWhatsAppSupportUrl('not-a-url', { productName: 'Test', locale: 'en' }),
    ).toBeNull();
  });
});
