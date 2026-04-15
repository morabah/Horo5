import { imgUrl } from '../images';

describe('imgUrl', () => {
  it('appends Unsplash-style params only for Unsplash hosts', () => {
    const unsplash = 'https://images.unsplash.com/photo-1';
    expect(imgUrl(unsplash, 800)).toContain('w=800');
    expect(imgUrl(unsplash, 800)).toContain('fit=crop');
  });

  it('returns Medusa or generic HTTPS URLs unchanged', () => {
    const medusa = 'https://cdn.example.com/files/prod_123.jpg';
    expect(imgUrl(medusa, 800)).toBe(medusa);
  });

  it('returns relative local paths unchanged', () => {
    const local = '/images/tees/bg_tee_white_front.png';
    expect(imgUrl(local, 400)).toBe(local);
  });

  it('appends params for unsplash.com root host', () => {
    const u = 'https://unsplash.com/photos/abc';
    expect(imgUrl(u, 200)).toContain('w=200');
  });
});
