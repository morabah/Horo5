import {
  HORO_V19_SOUNDBITES,
  HORO_V19_TRUST_COPY,
} from '../brand/horo-v19';

export const BRAND_NAME = {
  latin: 'HORO',
  arabic: 'هورو',
} as const;

export const BRAND_COPY = {
  publicLine: `${HORO_V19_SOUNDBITES.primary.en} | ${HORO_V19_SOUNDBITES.primary.ar}`,
  mantra: HORO_V19_SOUNDBITES.primary.en,
  brandIdea: HORO_V19_SOUNDBITES.rhythm.en,
  canvasLine: HORO_V19_SOUNDBITES.canvas.en,
  categoryShorthand: 'Passion wear',
  heroSupportLine: HORO_V19_SOUNDBITES.promise.en,
  footerSummary:
    'Artist-made passion wear for feelings, identity, and meaningful gifts in Egypt, backed by quality print, visible proof, and clear service.',
  aboutLead:
    'HORO is a wearable-art brand from Egypt. We turn feelings, identity, and personal meaning into artist-made pieces you can live in.',
  aboutSupport:
    'We choose artwork with intention, print in Egypt with visible proof, and keep fit details, size help, and service dependable from first order to delivery.',
  aboutLaunchDrop:
    'The first HORO drop starts with Sign Capsule, Mood, and Lifestyle designs — one launch collection, many ways to wear what you feel.',
  aboutClose: HORO_V19_SOUNDBITES.primary.en,
  footerSignoff: HORO_V19_SOUNDBITES.canvas.en,
  proofLine: `${HORO_V19_TRUST_COPY.artistMade.en}, ${HORO_V19_TRUST_COPY.printedEgypt.en.toLowerCase()}, clear fit, exchange per policy.`,
} as const;

export { HORO_V19_COLORS, HORO_V19_SOUNDBITES, HORO_V19_TRUST_COPY } from '../brand/horo-v19';
