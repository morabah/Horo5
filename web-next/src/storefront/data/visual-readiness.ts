/**
 * Visual asset readiness inventory for HORO V1.9 launch gates.
 *
 * Policy: placeholder vectors are allowed for internal staging, but NOT for
 * paid-media destination pages, PDP media, or ad landing URLs.
 */
export const VISUAL_READINESS = {
  homeHero: {
    status: 'launch-ready',
    requiredFormat: 'desktop 16:9 + mobile 9:16',
    currentAsset: '/images/heroes/home-hero.png',
  },
  feelingCards: {
    status: 'placeholder',
    requiredFormat: '4:5 product/lifestyle cards',
    action: 'Replace before paid media',
  },
  pdpGallery: {
    status: 'required',
    requiredFormat: 'front, back, close-up, on-body, packaging',
    action: 'Each product needs proof set before scaling ads',
  },
  proofCards: {
    status: 'placeholder',
    requiredFormat: 'SVG proof cards with real product photography',
    currentAsset: '/images/proof/',
    action: 'Replace vector placeholders on PDP before paid traffic',
  },
  giftWrapStory: {
    status: 'placeholder',
    requiredFormat: 'packaging/gift photo',
    currentAsset: '/images/cart/gift-wrap-story-card-preview.svg',
  },
  aboutHero: {
    status: 'placeholder',
    requiredFormat: 'brand/lifestyle editorial',
    currentAsset: '/images/heroes/about-hero.svg',
  },
  foundingDropCards: {
    status: 'required',
    requiredFormat: 'real product front + lifestyle',
    action: 'Product cards must use real imagery for launch',
  },
  socialCreative: {
    status: 'required',
    requiredFormat: '9:16 video + 4:5 feed + 1:1 fallback',
    action: 'Required for TikTok/Reels and Meta before paid media',
  },
} as const;

export type VisualReadinessStatus = 'launch-ready' | 'placeholder' | 'required';

export type VisualReadinessEntry = {
  status: VisualReadinessStatus;
  requiredFormat: string;
  currentAsset?: string;
  action?: string;
};
