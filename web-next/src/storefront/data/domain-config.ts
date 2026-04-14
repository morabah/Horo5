// src/data/domain-config.ts

import type { PdpDeliveryRules } from '../utils/deliveryEstimate';

/** Partial override from Medusa `store.metadata.delivery` (see medusa-backend README). */
export type StorefrontDeliveryMetadata = Partial<{
  standardMinDays: number;
  standardMaxDays: number;
  expressMinDays: number;
  expressMaxDays: number;
  cutoffHourLocal: number;
  cutoffMinuteLocal: number;
  /** If set, used for “arrives by”; otherwise `standardMaxDays` is used. */
  standardMaxBusinessDays: number;
}>;

const INT_FIELDS: (keyof StorefrontDeliveryMetadata)[] = [
  'standardMinDays',
  'standardMaxDays',
  'expressMinDays',
  'expressMaxDays',
  'cutoffHourLocal',
  'cutoffMinuteLocal',
  'standardMaxBusinessDays',
];

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Defaults match previous hard-coded PDP behavior. */
export const PDP_DEFAULT_DELIVERY_RULES: PdpDeliveryRules = {
  cutoffHourLocal: 14,
  cutoffMinuteLocal: 0,
  standardMaxBusinessDays: 5,
  standardMinDays: 3,
  standardMaxDays: 5,
  expressMinDays: 1,
  expressMaxDays: 2,
};

/**
 * Merge Medusa `store.metadata.delivery` into PDP delivery rules. Invalid or missing keys keep defaults.
 */
export function mergePdpDeliveryRules(remote: unknown): PdpDeliveryRules {
  const out: PdpDeliveryRules = { ...PDP_DEFAULT_DELIVERY_RULES };
  let parsed: unknown = remote;
  if (typeof remote === 'string') {
    try {
      parsed = JSON.parse(remote) as unknown;
    } catch {
      return out;
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return out;
  }
  const d = parsed as Record<string, unknown>;
  for (const key of INT_FIELDS) {
    const v = d[key as string];
    if (typeof v !== 'number' && typeof v !== 'string') continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) continue;
    if (key === 'cutoffHourLocal') {
      out.cutoffHourLocal = clampInt(n, 0, 23);
    } else if (key === 'cutoffMinuteLocal') {
      out.cutoffMinuteLocal = clampInt(n, 0, 59);
    } else if (key === 'standardMinDays') {
      out.standardMinDays = clampInt(n, 1, 30);
    } else if (key === 'standardMaxDays') {
      out.standardMaxDays = clampInt(n, 1, 30);
    } else if (key === 'expressMinDays') {
      out.expressMinDays = clampInt(n, 1, 30);
    } else if (key === 'expressMaxDays') {
      out.expressMaxDays = clampInt(n, 1, 30);
    } else if (key === 'standardMaxBusinessDays') {
      out.standardMaxBusinessDays = clampInt(n, 1, 30);
    }
  }
  if (out.standardMinDays > out.standardMaxDays) {
    [out.standardMinDays, out.standardMaxDays] = [out.standardMaxDays, out.standardMinDays];
  }
  if (out.expressMinDays > out.expressMaxDays) {
    [out.expressMinDays, out.expressMaxDays] = [out.expressMaxDays, out.expressMinDays];
  }
  const rawBiz = d.standardMaxBusinessDays;
  const explicitBiz =
    rawBiz !== undefined &&
    rawBiz !== null &&
    (typeof rawBiz === 'number' || (typeof rawBiz === 'string' && rawBiz.trim() !== ''));
  if (!explicitBiz || !Number.isFinite(Number(rawBiz))) {
    out.standardMaxBusinessDays = out.standardMaxDays;
  } else {
    out.standardMaxBusinessDays = clampInt(Number(rawBiz), 1, 30);
  }
  return out;
}

export const EGYPT_CITY_OPTIONS = [
  'Cairo',
  'Giza',
  'Alexandria',
  'Qalyubia',
  'Sharqia',
  'Dakahlia',
  'Gharbia',
  'Monufia',
  'Beheira',
  'Kafr El Sheikh',
  'Damietta',
  'Port Said',
  'Ismailia',
  'Suez',
  'North Sinai',
  'South Sinai',
  'Faiyum',
  'Beni Suef',
  'Minya',
  'Assiut',
  'Sohag',
  'Qena',
  'Luxor',
  'Aswan',
  'Red Sea',
  'New Valley',
  'Matrouh',
] as const

export const PDP_SCHEMA = {
  viewLabels: ['front on-body', 'back fit card', 'print proof', 'fabric and tag', 'flat lay', 'lifestyle', 'weight proof', 'wash check'],
  surfacePhrases: [
    'front on-body fit view',
    'back fit verification card',
    'print proof panel',
    'fabric and tag proof panel',
    'warm textured flat lay',
    'street lifestyle setting',
    '220 GSM proof card',
    '3x wash proof card',
  ],
  sizes: [
    { key: 'S' },
    { key: 'M' },
    { key: 'L' },
    { key: 'XL' },
    { key: 'XXL', disabled: true },
  ],
  sizeTable: [
    { size: 'S', chest: '96 cm', shoulder: '45 cm', length: '70 cm', sleeve: '20 cm' },
    { size: 'M', chest: '102 cm', shoulder: '47 cm', length: '72 cm', sleeve: '21 cm' },
    { size: 'L', chest: '108 cm', shoulder: '49 cm', length: '74 cm', sleeve: '22 cm' },
    { size: 'XL', chest: '114 cm', shoulder: '51 cm', length: '76 cm', sleeve: '23 cm' },
    { size: 'XXL', chest: '120 cm', shoulder: '53 cm', length: '78 cm', sleeve: '24 cm' },
  ],
  features: [
    { label: '220 GSM heavyweight cotton', icon: 'FabricIcon' as const },
    { label: 'High-fidelity DTF print', icon: 'PrintIcon' as const },
    { label: 'Relaxed unisex fit', icon: 'SilhouetteIcon' as const },
    { label: 'Machine wash cold', icon: 'CareIcon' as const },
  ],
  trustSignals: [
    { label: 'Express shipping', icon: 'Truck' as const },
    { label: 'Small batch', icon: 'Shield' as const },
    { label: 'Secure checkout', icon: 'Lock' as const },
  ],
  /** Persistent PDP trust line (Guidelines §8.3) */
  trustStripItems: ['220 GSM cotton', 'Licensed art', 'Free exchange 14d', 'COD available'] as const,
  /** StoryBrand micro-plan strip */
  storyPlanSteps: ['Find your feeling', 'Pick your design', 'It arrives at your door'] as const,
  /** Gallery image indices (0-based) for the “See it styled” grid */
  wornByGalleryIndices: [1, 2, 0] as const,
  /** Same-day ship cutoff (local) + delivery windows for PDP copy (overridable via Medusa store metadata). */
  deliveryRules: PDP_DEFAULT_DELIVERY_RULES,
  copy: {
    addBtnCTA: 'Add to Bag',
    shippingLine: 'Express shipping · 14-day hassle-free returns · Secure checkout',
    deliveryEyebrow: 'Delivery',
    deliveryEstimateTitle: 'Estimated arrival',
    /** PDP uses `formatPdpStandardBadgeLabel` / `formatPdpExpressBadgeLabel` from merged rules; these are fallbacks only. */
    deliveryStandardBadge: 'Standard · 3–5 business days',
    deliveryExpressBadge: 'Express · 1–2 business days',
    deliveryEstimateNote: 'Final speed and shipping cost are confirmed at checkout.',
    deliveryUrgencyBeforeCutoff: 'About {hours}h left to ship today (before {cutoffTime}).',
    deliveryUrgencyTight: 'Order within the next {hours}h — ships today.',
    deliveryAfterCutoff: 'Orders placed now ship on the next business day.',
    deliveryWeekendHold: 'We ship Monday — order anytime; your place in queue is saved.',
    deliveryArrivesByStandard: 'Standard delivery often arrives by {date} (Egypt).',
    reviewsSoonEyebrow: 'Reviews',
    reviewsSoonTitle: 'We’re just getting started',
    reviewsSoonBody:
      'Public product reviews aren’t live yet — we’re a new label building trust one shipment at a time. Questions, fit help, or a photo of your tee? Reach us on WhatsApp or Instagram.',
    reviewsSoonWhatsappCta: 'WhatsApp us',
    reviewsSoonInstagramCta: 'Instagram',
    reviewsSoonNoLinks:
      'Support links are configured via site settings when you’re ready to publish them.',
    crossSellBundleFbtCta: 'Add pair to bag',
    crossSellBundleStyleCta: 'Add outfit to bag',
    crossSellNeedSize: 'Choose a size first to add bundles.',
    crossSellBundleAdded: 'Bundle added — open bag to review.',
    notifyMeCTA: 'Notify Me',
    lowStockLabel: 'Only a few left',
    sizeGuideLabel: 'Size guide',
    selectSizePrompt: 'Choose Size',
    sizeRequiredPrompt: 'Choose a size above first.',
    storyCardHeading: 'For the one who…',
    illustratedByLabel: 'Illustrated by',
    accordionProductDetails: 'Product Details & Fit',
    accordionDesignStory: 'The Design Story',
    accordionShipping: 'Shipping & Returns',
    shippingSections: [
      {
        title: 'Secure delivery',
        body:
          'Next-day shipping available within Cairo & Giza. 2–3 days for wider regions.',
      },
      {
        title: 'Returns',
        body:
          '14-day hassle-free returns. If you’re not entirely satisfied with your purchase, you may return it within 14 days of receipt for an exchange or full refund.',
      },
    ],
    trustReturnsLine: '14-day hassle-free returns',
    sizeGuideModelNote: 'Model is 178 cm, wearing size M.',
    /** Fallback when product has no pdpFitModels */
    modelLineTemplate: "Model is 178 cm / 5'10\", wearing size M{fit}",
    wornByEyebrow: 'Styling',
    wornByTitle: 'See it styled',
    relatedMoreFromSubtitle: 'Designs from the same feeling.',
    styleItWithTitle: 'Style it with',
    styleItWithSubtitle: 'Pieces that pair across feelings and occasions.',
    wearerStoriesEyebrow: 'From the studio',
    wearerStoriesTitle: 'Why we made this piece',
    wearerStoriesNote: 'Design intent and craft notes — not customer reviews or verified purchases.',
    wornByCaptions: ['Studio days', 'Street light', 'Your rotation'],
    whatsappHelpLabel: 'Questions? WhatsApp us',
    notifyEmailPlaceholder: 'Email for restock reminder',
    notifyFieldLabel: 'Save this size for a restock reminder',
    notifySubmitLabel: 'Save reminder',
    notifySuccess: 'Saved on this device for the restock reminder preview.',
    notifyInvalidEmail: 'Enter a valid email address.',
    inventoryLowFormat: 'Only {n} left',
    /** Accordion “Design story” — making / craft (card above = emotional hook) */
    designStoryAccordionBody:
      'Printed with care using high-fidelity DTF: crisp edges, wash-fast color, and a hand that stays soft after repeat wears. Each piece is inspected before it ships so the graphic matches what you saw in the gallery.',
    frequentlyBoughtTogetherEyebrow: 'Often paired',
    frequentlyBoughtTogetherTitle: 'Frequently bought together',
    frequentlyBoughtTogetherSubtitle: 'Popular pairings from the studio — add each in your size from the product page.',
    customersAlsoBoughtEyebrow: 'Trending picks',
    customersAlsoBoughtTitle: 'Customers also bought',
    customersAlsoBoughtSubtitle: 'Designs others checked out with this one — browse in your size on each product page.',
    buyNowCta: 'Buy now',
    lightboxClose: 'Close',
    lightboxPrev: 'Previous image',
    lightboxNext: 'Next image',
    lightboxCounterTemplate: '{current} / {total}',
    lightboxDialogLabel: 'Enlarged product gallery',
    videoEyebrow: 'Motion',
    videoTitle: 'Drape & movement',
    videoPlaceholderBody: 'Product video placeholder — clip coming soon.',
    videoAriaLabel: 'Product video area. Motion preview not available yet; still image shown as poster.',
  },
};

export const CART_SCHEMA = {
  trustStripItems: ['Free exchange 14d', 'COD available', '220 GSM cotton'] as const,
  copy: {
    heading: 'Your cart',
    emptyCta: 'Find Your Design',
    primaryCta: 'Proceed to checkout',
    secondaryCta: 'Continue shopping',
    orderSummaryHeading: 'Order summary',
    shippingExplainer: 'Estimated shipping (standard, Egypt): you’ll confirm speed at checkout.',
    shippingLabel: 'Est. shipping',
    totalLabel: 'Est. order total',
    subtotalLabel: 'Subtotal',
    quantityLabel: 'Qty',
    removeLabel: 'Remove',
    itemLabelSingular: 'item',
    itemLabelPlural: 'items',
    giftWrapLabel: 'Gift wrap + story card',
    giftUpsellHeading: 'Make it a gift',
    giftUpsellIncludedHeading: 'Gift add-ons',
    giftUpsellBody: 'Add story card + gift wrap',
    giftUpsellIncludedBody: 'Story card + gift wrap is included in your estimate.',
    giftUpsellCta: 'Add Gift Wrap +200',
    giftUpsellDecline: 'No thanks',
    giftUpsellRemove: 'Remove gift wrap',
    bundleUpsellHeading: 'Add a 3rd, save 100 EGP',
    bundleUpsellBody: 'Pick one more design and get 100 EGP off your order.',
    bundleUpsellCta: 'Browse designs →',
    emptyBody: 'Your bag is empty. Explore feelings and add a design in your size when you’re ready.',
    quantityUpdated: 'Quantity updated for {name}.',
    quantityMinReached: '{name} is already at the minimum quantity.',
    itemRemoved: '{name} removed from your cart.',
    removeUndoPrompt: '{name} removed.',
    undoRemoveCta: 'Undo',
    itemRestored: '{name} is back in your bag.',
    giftWrapAdded: 'Gift wrap added to your order estimate.',
    giftWrapRemoved: 'Gift wrap removed from your order estimate.',
    estimatedDeliveryLabel: 'Est. delivery (standard)',
    estimatedDeliveryCheckoutNote: 'Express options and exact dates are confirmed at checkout.',
  },
} as const;

export const MINI_CART_SCHEMA = {
  copy: {
    addedLabel: 'Added to bag',
    addedLabelAr: 'أُضيف إلى الحقيبة',
    checkoutCta: 'Checkout',
    checkoutCtaAr: 'الدفع',
    viewBagCta: 'View Bag',
    viewBagCtaAr: 'عرض الحقيبة',
    continueCta: 'Continue shopping',
    continueCtaAr: 'واصل التسوق',
    subtotalLabel: 'Subtotal',
    subtotalLabelAr: 'الإجمالي الفرعي',
    itemSingular: 'item',
    itemSingularAr: 'قطعة',
    itemPlural: 'items',
    itemPluralAr: 'قطع',
    sizeLabel: 'Size',
    sizeLabelAr: 'المقاس',
    qtyLabel: 'Qty',
    qtyLabelAr: 'الكمية',
    closeLabel: 'Close',
    closeLabelAr: 'إغلاق',
    dialogLabel: 'Item added to bag',
    dialogLabelAr: 'تمت إضافة قطعة إلى الحقيبة',
    scrimLabel: 'Close mini cart',
    scrimLabelAr: 'إغلاق السلة المصغرة',
  },
  trustItems: ['Free exchange 14d', 'COD available', 'Secure checkout'] as const,
  trustItemsAr: ['استبدال مجاني ١٤ يوم', 'الدفع عند الاستلام', 'دفع آمن'] as const,
} as const;

export const OCCASION_SCHEMA = {
  copy: {
    hubEyebrow: 'Shop by occasion',
    hubTitle: 'Give something that means something',
    hubSubtitle: 'Find the design that fits the moment.',
    featuredCta: 'Explore gifts →',
    secondaryCta: 'Explore →',
    secondaryNavLabel: 'Or explore by feeling:',
    secondaryNavCta: 'Shop by feeling',
    breadcrumbLabel: 'Breadcrumb',
    giftBannerHeading: 'Make it a gift',
    giftBannerBody: 'Add a story card + gift wrap at checkout.',
    giftBannerChip: 'Gift option at cart',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Feeling',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All feelings',
    filterAndSortCta: 'Filter & sort',
    searchThisOccasionCta: 'Search this occasion',
    resetFiltersCta: 'Reset filters',
    moreOccasionsHeading: 'More occasions',
    noFilteredResults: 'No designs match these filters.',
    noOccasionResults: 'No designs in this occasion yet.',
    showCountCta: 'Show {count} {label}',
    designSingular: 'design',
    designPlural: 'designs',
    notFoundTitle: 'Occasion not found.',
    backToOccasionsCta: 'Back to occasions',
  },
} as const;

export const BRAND_TRUST_POINTS = [
  { icon: 'layers', title: '220 GSM Cotton', sub: 'Heavyweight feel that keeps its shape' },
  { icon: 'verified', title: 'Original Licensed Design', sub: 'Clearly credited and properly sourced' },
  { icon: 'history', title: 'Free Exchange 14 Days', sub: 'Less sizing stress, easier decisions' },
  { icon: 'payments', title: 'COD Available', sub: 'Pay at your doorstep' },
] as const;

export const VIBES_SCHEMA = {
  copy: {
    hubEyebrow: 'Shop by feeling',
    hubTitle: 'Which feeling is yours?',
    hubSubtitle: 'Every design starts with a feeling. Start with yours.',
    hubHeroAlt: 'Editorial collage showing the five HORO feelings through graphic-tee styling.',
    cardExploreCta: 'Explore →',
    cardSeeVibeCta: 'See feeling →',
    secondaryNavLabel: 'Or explore another way',
    secondaryNavCta: 'Shop by moment',
    cardAriaTemplate: '{cta} the {name} feeling collection',
  },
} as const;

export const ABOUT_SCHEMA = {
  copy: {
    primaryCta: 'Shop by feeling',
    bridgeCta: 'Shop by feeling',
    heroRegionLabel: 'HORO story hero',
    bridgeRegionLabel: 'HORO collection bridge',
  },
} as const;

export const QUICK_VIEW_SCHEMA = {
  copy: {
    openCta: 'Quick view',
    openAriaTemplate: 'Quick view: {name}',
    closeLabel: 'Close quick view',
    chooseSizeCta: 'Choose Size',
    addToBagCta: 'Add to Bag — {price}',
    viewBagCta: 'View Bag',
    continueBrowsingCta: 'Continue browsing',
    viewFullProductCta: 'View full product',
    sizeChartLabel: 'Size chart',
    sizeChartRegionLabel: 'Quick view size chart',
    addedStatus: 'Added to bag.',
  },
} as const;

/**
 * Extra localized / colloquial tokens merged into `expandQueryVariants` (search/view.ts).
 * Values are expansion phrases scored against catalog text — not SQL column names.
 */
export const SEARCH_SYNONYMS_SCHEMA: Record<string, readonly string[]> = {
  tshirt: ['graphic tee', 't shirt', 't-shirt', 'tee'],
  tee: ['graphic tee', 't shirt'],
  shirt: ['graphic tee', 't shirt'],
  تيشيرت: ['graphic tee', 't shirt', 'tee'],
  تيشرت: ['graphic tee', 't shirt'],
  obsidian: ['black', 'dark', 'midnight'],
  black: ['obsidian', 'midnight', 'dark tee'],
  'أسود': ['obsidian', 'black', 'midnight'],
  papyrus: ['off white', 'cream', 'natural'],
  white: ['papyrus', 'clean white', 'natural tee'],
  egp: ['price', 'egypt', 'cairo'],
  cairo: ['egypt', 'shipping', 'giza'],
  giza: ['cairo', 'egypt'],
  oversized: ['relaxed unisex fit', 'quiet revolt', 'loose fit'],
  birthday: ['birthday pick', 'gift something real'],
  ramadan: ['eid and ramadan', 'eid', 'festive'],
} as const;

export const SEARCH_SCHEMA = {
  copy: {
    placeholder: 'Search designs, feelings, or occasions...',
    searchLabel: 'Search',
    searchAllLabel: 'Search all designs',
    searchingInLabel: 'Searching in',
    popularLabel: 'Popular',
    designsTab: 'Designs',
    vibesTab: 'Feelings',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Feeling',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All feelings',
    filterAndSortCta: 'Filter & sort',
    resetFiltersCta: 'Reset filters',
    quickViewCta: 'Quick view',
    showCountCta: 'Show {count} {label}',
    designSingular: 'design',
    designPlural: 'designs',
    viewDesignsCta: 'See designs →',
    viewVibeCta: 'Explore feeling →',
    shopByVibeCta: 'Shop by feeling',
    browseAllDesignsCta: 'Browse All Designs',
    noFilteredResults: 'No designs match these filters.',
    noDesignResults: 'No designs match this search yet.',
    noVibeResults: 'No feelings match this search yet.',
    resultsFallback: 'Browse everything — or try a popular search below.',
    scopedResultsFallback: 'Browse designs in {scope} — or try a popular search below.',
    resultsForQuery: '{count} results for “{query}”',
    noResultsForQuery: 'No results for “{query}”',
    zeroResultsSuggestionsHeading: 'Try these instead',
    shopByOccasionCta: 'Shop by moment',
    sizeFilterLabel: 'Size in stock',
    allSizesLabel: 'All sizes',
    artistLabel: 'Artist',
    allArtistsLabel: 'All artists',
    occasionFilterLabel: 'Occasion',
    allOccasionsFilterLabel: 'All occasions',
    colorLabel: 'Tee color',
    allColorsLabel: 'All colors',
  },
} as const;

export const CHECKOUT_SCHEMA = {
  trustStripItems: [
    'SSL-encrypted checkout',
    'COD + Paymob card',
    '14-day exchange',
    'Guest checkout',
  ] as const,
} as const;

function optionalEnvValue(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export const HORO_SUPPORT_CHANNELS = {
  effectiveDate: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_SUPPORT_EFFECTIVE_DATE) ?? 'March 25, 2026',
  instagramUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_INSTAGRAM_URL),
  whatsappSupportUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_WHATSAPP_SUPPORT_URL),
  whatsappTrackingUrl: optionalEnvValue(process.env.NEXT_PUBLIC_HORO_WHATSAPP_TRACKING_URL),
} as const;

export function isConfiguredExternalUrl(url: string | null | undefined): url is string {
  return typeof url === 'string' && /^https?:\/\/\S+$/i.test(url);
}

export function withSupportMessage(url: string | null | undefined, message: string): string | null {
  if (!isConfiguredExternalUrl(url)) return null;

  try {
    const next = new URL(url);
    next.searchParams.set('text', message);
    return next.toString();
  } catch {
    return url;
  }
}

export type PdpFeatureIconKey = (typeof PDP_SCHEMA.features)[number]['icon'];
export type PdpTrustIconKey = (typeof PDP_SCHEMA.trustSignals)[number]['icon'];
