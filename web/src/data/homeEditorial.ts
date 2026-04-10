import { feelingEditorialImagery } from './images';
import { feelings } from './site';
import type { Feeling } from './site';

/** Editorial blocks — one per §6.1 feeling pillar */
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

export const feelingEditorialBlocks: FeelingEditorialBlock[] = [
  {
    feeling: feelings[0],
    kicker: 'Name the feeling',
    body:
      'For reflective moods and slower days — graphics that land without shouting. Heavyweight cotton and art you can place in real life.',
    manifesto: 'Quiet enough to live in. Clear enough to recognize.',
    cta: 'Explore Soft / Quiet',
    wideSrc: feelingEditorialImagery['soft-quiet'].wide,
    wideAlt: 'Model wearing a graphic tee — Soft / Quiet collection',
    detailSrc: feelingEditorialImagery['soft-quiet'].detail,
    detailAlt: 'Model in a tee, front view — Soft / Quiet',
    detailCaption: 'Print detail',
    detailLayout: 'square',
  },
  {
    feeling: feelings[1],
    kicker: 'Turn the volume up',
    body:
      'For going out and nights when the tee should read from across the room — without turning the site into a hype poster.',
    manifesto: 'Visible when you want it to be.',
    cta: 'Explore Bold / Electric',
    wideSrc: feelingEditorialImagery['bold-electric'].wide,
    wideAlt: 'Model in a bold graphic tee — Bold / Electric',
    detailSrc: feelingEditorialImagery['bold-electric'].detail,
    detailAlt: 'Model outdoors in a HORO tee — Bold / Electric',
    detailCaption: 'Drop detail',
    detailLayout: 'square',
  },
  {
    feeling: feelings[2],
    kicker: 'Chosen for someone you love',
    body:
      'Birthdays, Eid tables, and “I thought of you” moments — pieces that feel personal, with packaging and proof that respect gifting in Egypt.',
    manifesto: 'Gift-ready, not generic.',
    cta: 'Explore Warm / Romantic',
    wideSrc: feelingEditorialImagery['warm-romantic'].wide,
    wideAlt: 'Model wearing a HORO tee — Warm / Romantic',
    detailSrc: feelingEditorialImagery['warm-romantic'].detail,
    detailAlt: 'Relaxed-fit HORO tee — Warm / Romantic',
    detailCaption: 'Texture',
    detailLayout: 'portrait',
  },
  {
    feeling: feelings[3],
    kicker: 'Daily reset',
    body:
      'Coffee runs, creative work, and the pieces you reach for twice a week — easy to pair, easy to explain, built for repeat wear.',
    manifesto: 'Grounded, not boring.',
    cta: 'Explore Grounded / Everyday',
    wideSrc: feelingEditorialImagery['grounded-everyday'].wide,
    wideAlt: 'Model in a HORO tee — Grounded / Everyday',
    detailSrc: feelingEditorialImagery['grounded-everyday'].detail,
    detailAlt: 'Street context — Grounded / Everyday',
    detailCaption: 'City context',
    detailLayout: 'video',
  },
  {
    feeling: feelings[4],
    kicker: 'Character, not costume',
    body:
      'Niche references and expressive capsules — for the wearer who likes a story on the shirt and a normal conversation everywhere else.',
    manifesto: 'Specific beats random.',
    cta: 'Explore Playful / Offbeat',
    wideSrc: feelingEditorialImagery['playful-offbeat'].wide,
    wideAlt: 'Model in a story-led graphic tee — Playful / Offbeat',
    detailSrc: feelingEditorialImagery['playful-offbeat'].detail,
    detailAlt: 'Studio — Playful / Offbeat',
    detailCaption: 'Line and ink',
    detailLayout: 'portrait',
  },
];

/** @deprecated Use feelingEditorialBlocks */
export const vibeEditorialBlocks = feelingEditorialBlocks.map((b) => ({
  ...b,
  vibe: b.feeling,
}));

export function getEditorialBlockByFeelingSlug(slug: string): FeelingEditorialBlock | undefined {
  return feelingEditorialBlocks.find((b) => b.feeling.slug === slug);
}

/** @deprecated Use getEditorialBlockByFeelingSlug */
export function getEditorialBlockByVibeSlug(slug: string): FeelingEditorialBlock | undefined {
  return getEditorialBlockByFeelingSlug(slug);
}
