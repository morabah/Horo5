import { buildGiftHubWhatsAppMessage, buildGiftHubWhatsAppUrl } from '../giftWhatsApp';

describe('giftWhatsApp', () => {
  it('builds English gift hub message with optional occasion', () => {
    expect(buildGiftHubWhatsAppMessage('en')).toContain('buying a gift');
    expect(buildGiftHubWhatsAppMessage('en', 'Birthday')).toContain('Birthday');
  });

  it('returns null when WhatsApp base URL is not configured', () => {
    expect(buildGiftHubWhatsAppUrl(null, 'en')).toBeNull();
    expect(buildGiftHubWhatsAppUrl('', 'en')).toBeNull();
  });

  it('appends prefilled text to a valid WhatsApp URL', () => {
    const url = buildGiftHubWhatsAppUrl('https://wa.me/201234567890', 'ar');
    expect(url).toMatch(/^https:\/\/wa\.me\/201234567890/);
    expect(url).toContain('text=');
    expect(decodeURIComponent(url ?? '')).toContain('هدية');
  });
});
