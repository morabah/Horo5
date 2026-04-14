import { getFeelingEditorialImagery } from './images';
import { getFeeling, getFeelings, type Feeling } from './site.ts';

/** Editorial blocks — one per feeling pillar, resolved from runtime taxonomy. */
export type EditorialDetailLayout = 'square' | 'video' | 'portrait';

export type FeelingEditorialBlock = {
  feeling: Feeling;
  kicker: string;
  body: string;
  manifesto?: string;
  cta: string;
  wideSrc: string;
  wideAlt: string;
  detailSrc: string;
  detailAlt: string;
  detailCaption: string;
  detailLayout: EditorialDetailLayout;
};

/** @deprecated Use FeelingEditorialBlock */
export type VibeEditorialBlock = FeelingEditorialBlock;

const DEFAULT_EDITORIAL_COPY: Record<
  string,
  {
    kicker: string;
    body: string;
    detailCaption: string;
    detailLayout: EditorialDetailLayout;
  }
> = {
  mood: {
    kicker: 'Name the feeling',
    body: 'Emotion-led graphics for quieter days, louder nights, and the moods in between.',
    detailCaption: 'Print detail',
    detailLayout: 'square',
  },
  zodiac: {
    kicker: 'Personal signs, bigger energy',
    body: 'Cosmic references and sign language that feel specific instead of generic.',
    detailCaption: 'Texture',
    detailLayout: 'portrait',
  },
  trends: {
    kicker: 'Current without being empty',
    body: 'Streetwear cues, statement graphics, and visuals built to land fast.',
    detailCaption: 'Drop detail',
    detailLayout: 'square',
  },
  career: {
    kicker: 'Work mode, with personality',
    body: 'Ambition, burnout, and office humor translated into wearable graphics.',
    detailCaption: 'City context',
    detailLayout: 'video',
  },
  fiction: {
    kicker: 'Character, not costume',
    body: 'Fandoms, imagined worlds, and references that feel owned instead of borrowed.',
    detailCaption: 'Line and ink',
    detailLayout: 'portrait',
  },
};

export function getFeelingEditorialBlocks(): FeelingEditorialBlock[] {
  return getFeelings().map((feeling) => {
    const imagery = getFeelingEditorialImagery(feeling.slug);
    const copy = DEFAULT_EDITORIAL_COPY[feeling.slug] ?? {
      kicker: `Explore ${feeling.name}`,
      body: feeling.blurb || `Discover the ${feeling.name} collection.`,
      detailCaption: 'Detail view',
      detailLayout: 'square' as const,
    };

    return {
      feeling,
      kicker: copy.kicker,
      body: feeling.blurb || copy.body,
      manifesto: feeling.manifesto,
      cta: `Explore ${feeling.name}`,
      wideSrc: imagery.wide,
      wideAlt: `${feeling.name} editorial image`,
      detailSrc: imagery.detail,
      detailAlt: `${feeling.name} detail image`,
      detailCaption: copy.detailCaption,
      detailLayout: copy.detailLayout,
    };
  });
}

export const feelingEditorialBlocks = getFeelingEditorialBlocks();

/** @deprecated Use getFeelingEditorialBlocks */
export const vibeEditorialBlocks = getFeelingEditorialBlocks().map((block) => ({
  ...block,
  vibe: block.feeling,
}));

export function getEditorialBlockByFeelingSlug(slug: string): FeelingEditorialBlock | undefined {
  const resolved = getFeeling(slug)?.slug ?? slug;
  return getFeelingEditorialBlocks().find((block) => block.feeling.slug === resolved);
}

/** @deprecated Use getEditorialBlockByFeelingSlug */
export function getEditorialBlockByVibeSlug(slug: string): FeelingEditorialBlock | undefined {
  return getEditorialBlockByFeelingSlug(slug);
}
