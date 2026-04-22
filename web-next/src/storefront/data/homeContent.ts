/** Trust strip on home — short titles for dark factual badges */
export const HOME_TRUST_BADGES = [
  {
    key: 'premiumCotton',
  },
  {
    key: 'printedEgypt',
  },
  {
    key: 'codExchange',
  },
] as const;

export const HOME_PRIMARY_ROUTES = [
  {
    key: 'feeling',
    href: '/feelings',
    accent: '#B77A67',
  },
  {
    key: 'occasion',
    href: '/occasions',
    accent: '#556F73',
  },
] as const;

export const HOME_WHY_HORO_BLOCKS = [
  {
    key: 'localArtists',
  },
  {
    key: 'heavyweightQuality',
  },
  {
    key: 'personalMeaning',
  },
] as const;

export const HOME_FEATURED_ARTIST = null as
  | null
  | {
      artistSlug: string;
      imageSrc: string;
      imageAlt: string;
      line: string;
    };

export const HOME_SEEN_ON_YOU: {
  imageSrc: string;
  imageAlt: string;
  handle?: string;
}[] = [];
