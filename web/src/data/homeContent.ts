export type HomeOrientationStep = {
  title: string;
  body: string;
};

export const HOME_ORIENTATION_STEPS: HomeOrientationStep[] = [
  {
    title: 'Choose the feeling',
    body: 'Start with the vibe that sounds most like you, then drop into the matching edit.',
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

export type HomeEvidenceCard = {
  eyebrow: string;
  title: string;
  body: string;
  imageSrc: string;
  imageAlt: string;
};

export const HOME_EVIDENCE_CARDS: HomeEvidenceCard[] = [
  {
    eyebrow: 'Launch proof',
    title: 'No fake customer quotes before delivery',
    body: 'Until first-wear photos are real, the homepage shows the product checks instead of invented praise.',
    imageSrc: '/images/proof/wash-test-card.svg',
    imageAlt: 'Proof card representing the launch wash-test comparison for HORO products.',
  },
  {
    eyebrow: 'Fit clarity',
    title: 'Back view stays part of the proof pack',
    body: 'Shoppers need the drape and hem read from more than one angle before sizing feels safe.',
    imageSrc: '/images/proof/back-fit-card.svg',
    imageAlt: 'Proof card representing the missing back-view fit check for a HORO tee.',
  },
  {
    eyebrow: 'Gift-ready',
    title: 'The drop still has to arrive well',
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

export type HomeStoryQuote = {
  quote: string;
  name: string;
  city: string;
};

export const HOME_STORY_QUOTES: HomeStoryQuote[] = [
  {
    quote:
      'The shirt actually feels heavy in a good way — and the print still looks sharp after a few washes. Finally something that matches the mood I wanted.',
    name: 'Yasmin H.',
    city: 'Cairo',
  },
  {
    quote:
      'I ordered COD, swapped the size once, and the exchange was straightforward. The design is even better in person.',
    name: 'Omar F.',
    city: 'Alexandria',
  },
  {
    quote:
      'It’s the first graphic tee I’ve worn where people stop and read the line. Feels personal without being loud.',
    name: 'Layla M.',
    city: 'Giza',
  },
];

export const HOME_COPY = {
  heroSupportLine:
    'Original illustration. Heavyweight cotton. Delivered across Egypt.',
  proofEyebrow: 'The proof',
  proofTitle: 'Facts you can hold onto.',
  proofBody:
    'Before hype, there is fabric weight, honest art credit, a clear exchange window, and payment options that respect how people actually shop in Egypt.',
  vibesEyebrow: 'The vibes',
  vibesTitle: 'Five lines. One wardrobe.',
  vibesBody: 'Each mood has its own color — follow the dot to the collection that sounds like you.',
  storiesEyebrow: 'Real stories',
  storiesTitle: 'What people say after the first wear',
  storiesBody: 'Short notes from shoppers who wanted the tee to say the quiet part out loud.',
  planEyebrow: 'Simple plan',
  planTitle: 'How it works',
  evidenceEyebrow: 'Launch proof',
  evidenceTitle: 'Customer stories come after delivery. Until then, show the work.',
  evidenceBody:
    'The homepage stays truthful by replacing invented testimonials with the checks that make a first order feel safer.',
  inviteBody:
    'Be first when the next drop opens. This preview saves your email on this device until live notification channels are connected.',
  waitlistPlaceholder: 'Email for next-drop alert',
  waitlistSubmit: 'Save my spot',
  waitlistSuccess: 'Saved on this device for the next-drop alert preview.',
  waitlistError: 'Enter a valid email address.',
  waitlistNote:
    'Support channels still need real launch URLs before live notifications can ship.',
} as const;
