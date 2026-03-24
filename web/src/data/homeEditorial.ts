import { vibeEditorialImagery } from './images';
import { vibes } from './site';
import type { Vibe } from './site';

/** Editorial homepage blocks — one per vibe axis (Emotions, Zodiac, Fiction, Career, Trends) */
export type EditorialDetailLayout = 'square' | 'video' | 'portrait';

export type VibeEditorialBlock = {
  vibe: Vibe;
  kicker: string;
  body: string;
  /** Optional pull-quote for vibe collection gallery (exhibition-style). */
  manifesto?: string;
  cta: string;
  wideSrc: string;
  wideAlt: string;
  detailSrc: string;
  detailAlt: string;
  detailCaption: string;
  detailLayout: EditorialDetailLayout;
};

export const vibeEditorialBlocks: VibeEditorialBlock[] = [
  {
    vibe: vibes[0],
    kicker: 'Name the feeling',
    body:
      'Mood-first graphics for when your chest is loud and your mouth is quiet. Heavyweight cotton and art that tracks the real feeling — not the feed.',
    manifesto: 'Wear the feeling — not the caption.',
    cta: 'Explore Emotions',
    wideSrc: vibeEditorialImagery.emotions.wide,
    wideAlt: 'Model wearing a graphic t-shirt — Emotions collection',
    detailSrc: vibeEditorialImagery.emotions.detail,
    detailAlt: 'Model in a t-shirt, front view — Emotions',
    detailCaption: 'Print detail',
    detailLayout: 'square',
  },
  {
    vibe: vibes[1],
    kicker: 'Written in the sky',
    body:
      'Signs and symbols you can wear — a nod to how you read the stars and yourself. Identity, not horoscope fluff.',
    manifesto: 'Identity you can read in the light.',
    cta: 'Explore Zodiac',
    wideSrc: vibeEditorialImagery.zodiac.wide,
    wideAlt: 'Model wearing a t-shirt on the street at dusk — Zodiac collection',
    detailSrc: vibeEditorialImagery.zodiac.detail,
    detailAlt: 'Model in a relaxed-fit t-shirt — Zodiac',
    detailCaption: 'Glyph study',
    detailLayout: 'portrait',
  },
  {
    vibe: vibes[2],
    kicker: 'Wear the story',
    body:
      'Archetypes and “what if” energy — tees that feel like a scene you stepped out of. For readers, watchers, and daydreamers.',
    manifesto: 'The scene you stepped out of.',
    cta: 'Explore Fiction',
    wideSrc: vibeEditorialImagery.fiction.wide,
    wideAlt: 'Model wearing a bold graphic t-shirt — Fiction collection',
    detailSrc: vibeEditorialImagery.fiction.detail,
    detailAlt: 'Model in a graphic tee, studio — Fiction',
    detailCaption: 'Line & ink',
    detailLayout: 'portrait',
  },
  {
    vibe: vibes[3],
    kicker: 'The work you’re becoming',
    body:
      'Career is motion, not just a title. Graphics for ambition, reinvention, and the quiet grind — street-clean, story-honest.',
    manifesto: 'Motion over title.',
    cta: 'Explore Career',
    wideSrc: vibeEditorialImagery.career.wide,
    wideAlt: 'Model wearing a plain t-shirt — Career collection',
    detailSrc: vibeEditorialImagery.career.detail,
    detailAlt: 'Full-length model in a t-shirt, street — Career',
    detailCaption: 'City context',
    detailLayout: 'video',
  },
  {
    vibe: vibes[4],
    kicker: 'Right now',
    body:
      'What people are wearing and sharing right now — distilled into a drop that still sounds like you, without the disposable feel.',
    manifesto: 'Right now — still you.',
    cta: 'Explore Trends',
    wideSrc: vibeEditorialImagery.trends.wide,
    wideAlt: 'Model posing in a t-shirt — Trends collection',
    detailSrc: vibeEditorialImagery.trends.detail,
    detailAlt: 'Model in a t-shirt outdoors — Trends',
    detailCaption: 'Drop detail',
    detailLayout: 'square',
  },
];

export function getEditorialBlockByVibeSlug(slug: string): VibeEditorialBlock | undefined {
  return vibeEditorialBlocks.find((b) => b.vibe.slug === slug);
}
