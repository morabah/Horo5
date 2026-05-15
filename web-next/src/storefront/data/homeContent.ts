/** Trust strip on home — short titles for dark factual badges */
export const HOME_TRUST_BADGES = [
  {
    key: 'artistMade',
  },
  {
    key: 'printedEgypt',
  },
  {
    key: 'codAvailable',
  },
  {
    key: 'exchange14d',
  },
  {
    key: 'whatsappSupport',
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
  {
    key: 'gift',
    href: '/gifts',
    accent: '#D4A44E',
  },
] as const;

export const HOME_WHY_HORO_BLOCKS = [
  {
    key: 'localArtists',
  },
  {
    key: 'printedInEgypt',
  },
  {
    key: 'madeToFeelPersonal',
  },
  {
    key: 'clearFitDetails',
  },
  {
    key: 'codAndExchange',
  },
  {
    key: 'realProofOnly',
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
