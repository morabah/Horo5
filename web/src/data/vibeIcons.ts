/**
 * Material Symbols names for each vibe axis — graphical shorthand (§6.1 accent + icon language).
 * @see https://fonts.google.com/icons
 */
export const vibeMaterialIcon: Record<string, string> = {
  emotions: 'psychology',
  zodiac: 'nightlight',
  fictious: 'auto_stories',
  career: 'work',
  trends: 'whatshot',
};

export function getVibeMaterialIcon(slug: string): string {
  return vibeMaterialIcon[slug] ?? 'style';
}
