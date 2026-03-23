import { vibeEditorialImagery } from './images';
import { vibes } from './site';
import type { Vibe } from './site';

/** Editorial homepage blocks — one per vibe axis (Emotions, Zodiac, Fictious, Career, Trends) */
export type EditorialDetailLayout = 'square' | 'video' | 'portrait';

export type VibeEditorialBlock = {
  vibe: Vibe;
  kicker: string;
  body: string;
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
      'Mood-first graphics for the days when your chest is loud and your mouth is quiet. 220 GSM cotton. Art that tracks what you’re going through — not what you’re posting.',
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
      'Signs, symbols, and a little cosmic bias — designs that nod to how you read the stars and yourself. Not horoscope fluff; identity you can wear.',
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
      'Fictional worlds, archetypes, and “what if” energy — tees that feel like a scene you stepped out of. For the ones who live in books, screens, and their own heads.',
    cta: 'Explore Fictious',
    wideSrc: vibeEditorialImagery.fictious.wide,
    wideAlt: 'Model wearing a bold graphic t-shirt — Fictious collection',
    detailSrc: vibeEditorialImagery.fictious.detail,
    detailAlt: 'Model in a graphic tee, studio — Fictious',
    detailCaption: 'Line & ink',
    detailLayout: 'portrait',
  },
  {
    vibe: vibes[3],
    kicker: 'The work you’re becoming',
    body:
      'Career isn’t only a title — it’s motion. Graphics for ambition, reinvention, and the quiet grind. Clean enough for the street; honest enough for your story.',
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
      'The pulse of what people are wearing, sharing, and repeating — distilled into a drop that still sounds like you. Timely without the disposable feel.',
    cta: 'Explore Trends',
    wideSrc: vibeEditorialImagery.trends.wide,
    wideAlt: 'Model posing in a t-shirt — Trends collection',
    detailSrc: vibeEditorialImagery.trends.detail,
    detailAlt: 'Model in a t-shirt outdoors — Trends',
    detailCaption: 'Drop detail',
    detailLayout: 'square',
  },
];
