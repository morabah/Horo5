export type HomeOrientationStep = {
  title: string;
  body: string;
};

export const HOME_ORIENTATION_STEPS: HomeOrientationStep[] = [
  {
    title: 'Choose the feeling',
    body: 'Start with the feeling that sounds most like you, then drop into the matching edit.',
  },
  {
    title: 'Pick the design',
    body: 'Check the artwork, fit, and proof details before you choose a size.',
  },
  {
    title: 'Delivered in Egypt',
    body: 'Checkout stays simple with COD or card, plus a 14-day exchange if sizing misses.',
  },
];

export type HomeProofPanel = {
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
};

export const HOME_PROOF_PANELS: HomeProofPanel[] = [
  {
    title: '220 GSM weight check',
    body: 'Launch proof starts with the actual fabric claim, not a soft adjective.',
    imageSrc: '/images/proof/weight-scale-card.svg',
    imageAlt: 'Proof card showing 220 GSM weight verification for HORO launch products.',
  },
  {
    title: 'Print texture review',
    body: 'Every illustration has to survive close inspection before it earns a place on cloth.',
    imageSrc: '/images/proof/macro-detail-card.svg',
    imageAlt: 'Proof card describing print texture and line fidelity for a HORO tee.',
  },
  {
    title: 'Care and label check',
    body: 'Fabric, size, and care details stay visible so the product tells the truth before checkout.',
    imageSrc: '/images/proof/fabric-tag-card.svg',
    imageAlt: 'Proof card describing fabric, size, and care-tag checks for HORO products.',
  },
];

export type HomeProofCard = {
  eyebrow: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
};

export const HOME_PROOF_CARDS: HomeProofCard[] = [
  {
    eyebrow: 'Launch proof',
    title: 'Proof comes before public praise',
    body: 'Until customer stories are real, the homepage shows fabric, print, fit, and packaging proof instead of invented reviews.',
    imageSrc: '/images/proof/wash-test-card.svg',
    imageAlt: 'Proof card representing the launch wash-test comparison for HORO products.',
  },
  {
    eyebrow: 'Fit clarity',
    title: 'Fit proof stays in view',
    body: 'Shoppers need the drape and hem read from more than one angle before sizing feels safe.',
    imageSrc: '/images/proof/back-fit-card.svg',
    imageAlt: 'Proof card representing the missing back-view fit check for a HORO tee.',
  },
  {
    eyebrow: 'Gift-ready',
    title: 'Gifting has to arrive ready',
    body: 'Meaning only works when the tee, packaging, and exchange path feel reliable from the first order.',
    imageSrc: '/images/cart/gift-wrap-story-card-preview.svg',
    imageAlt: 'Preview of the HORO story card and gift-wrap add-on for gift-ready orders.',
  },
];

/** Trust strip on home — short titles for dark factual badges */
export const HOME_TRUST_BADGES = [
  {
    icon: 'layers' as const,
    title: '220 GSM',
    sub: 'Heavyweight feel that keeps its shape',
  },
  {
    icon: 'verified' as const,
    title: 'Licensed art',
    sub: 'Clearly credited and properly sourced',
  },
  {
    icon: 'history' as const,
    title: 'Free exchange 14d',
    sub: 'Less sizing stress, easier decisions',
  },
  {
    icon: 'payments' as const,
    title: 'COD',
    sub: 'Pay at your doorstep',
  },
] as const;

/** Macro / print hero for split proof section */
export const HOME_PROOF_MACRO = {
  imageSrc: '/images/tees/bg_tee_studio_tee.png',
  imageAlt: 'Close studio view of a HORO graphic tee showing print clarity on cotton.',
} as const;

export const HOME_COPY = {
  heroSupportLine:
    'Artist-made illustration for feelings, moments, and meaningful giving. Heavyweight cotton, delivered across Egypt.',
  proofEyebrow: 'The proof',
  proofTitle: 'Why trust HORO',
  proofBody:
    'Before praise, there is fabric weight, honest art credit, exchange clarity, and payment options that respect how people actually shop in Egypt.',
  vibesEyebrow: 'Feelings',
  vibesTitle: 'Choose by feeling',
  vibesBody: 'Start with the feeling that fits the moment, then move into the edit that matches it.',
  planEyebrow: 'Simple plan',
  planTitle: 'How it works',
  studioEyebrow: 'Studio proof',
  studioTitle: 'Proof before public praise',
  studioBody:
    'Until reviews and wear stories are real, the homepage stays factual: fabric, fit, print, and gift-readiness proof first.',
  inviteBody:
    'Be first when the next drop opens. This preview only saves your contact on this device until live notification channels are connected.',
  waitlistPlaceholder: 'Email for next-drop alert',
  waitlistSubmit: 'Save my spot',
  waitlistSuccess: 'Saved on this device for the next-drop alert preview.',
  waitlistError: 'Enter a valid email address.',
  waitlistNote:
    'Support channels still need real launch URLs before live notifications can ship.',
} as const;
