// src/data/domain-config.ts

export const PDP_SCHEMA = {
  viewLabels: ['flat lay', 'on-body', 'lifestyle', 'print detail', 'size reference'],
  surfacePhrases: [
    'warm textured surface',
    'on-body, natural light',
    'street lifestyle setting',
    'print texture close-up',
    'size reference with model',
    'neutral backdrop',
  ],
  sizes: [
    { key: 'S' },
    { key: 'M' },
    { key: 'L' },
    { key: 'XL' },
    { key: 'XXL', disabled: true },
  ],
  sizeTable: [
    { size: 'S', chest: '96 cm', length: '70 cm', sleeve: '20 cm' },
    { size: 'M', chest: '102 cm', length: '72 cm', sleeve: '21 cm' },
    { size: 'L', chest: '108 cm', length: '74 cm', sleeve: '22 cm' },
    { size: 'XL', chest: '114 cm', length: '76 cm', sleeve: '23 cm' },
    { size: 'XXL', chest: '120 cm', length: '78 cm', sleeve: '24 cm' },
  ],
  features: [
    { label: '220 GSM premium cotton', icon: 'FabricIcon' as const },
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
  storyPlanSteps: ['Find your vibe', 'Pick your design', 'It arrives'] as const,
  /** Gallery image indices (0-based) for the “See it styled” grid */
  wornByGalleryIndices: [1, 2, 0] as const,
  copy: {
    addBtnCTA: 'Add to Bag',
    addBtnTag: 'Embrace the light',
    /** Legacy one-line summary; prefer ratingValue + reviewCount for UI */
    shippingLine: 'Express shipping · 14-day hassle-free returns · Secure checkout',
    reviewSummary: '4.9 (24 reviews)',
    ratingValue: 4.9,
    reviewCount: 24,
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
    modelLineTemplate: "Model is 178 cm / 5'10\", wearing size M{fit}",
    wornByEyebrow: 'Styling',
    wornByTitle: 'See it styled',
    relatedMoreFromSubtitle: 'Designs from the same vibe.',
    wornByCaptions: ['Studio days', 'Street light', 'Your rotation'],
    /** WhatsApp quick question (§8.6) — replace placeholder with real number */
    whatsappHelpUrl: 'https://wa.me/201000000000' as const,
    whatsappHelpLabel: 'Questions? WhatsApp us',
    notifyEmailPlaceholder: 'Email for restock alerts',
    notifyFieldLabel: 'Get notified when this size is back',
    notifySubmitLabel: 'Join waitlist',
    notifySuccess: 'You’re on the list — we’ll email you when this size is back.',
    notifyInvalidEmail: 'Enter a valid email address.',
    inventoryLowFormat: 'Only {n} left',
    /** Accordion “Design story” — making / craft (card above = emotional hook) */
    designStoryAccordionBody:
      'Printed with care using high-fidelity DTF: crisp edges, wash-fast color, and a hand that stays soft after repeat wears. Each piece is inspected before it ships so the graphic matches what you saw in the gallery.',
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
    emptyBody: 'Your bag is empty. Explore vibes and add a design in your size when you’re ready.',
    quantityUpdated: 'Quantity updated for {name}.',
    quantityMinReached: '{name} is already at the minimum quantity.',
    itemRemoved: '{name} removed from your cart.',
    giftWrapAdded: 'Gift wrap added to your order estimate.',
    giftWrapRemoved: 'Gift wrap removed from your order estimate.',
  },
} as const;

export const OCCASION_SCHEMA = {
  copy: {
    hubEyebrow: 'Shop by occasion',
    hubTitle: 'Give something that means something',
    hubSubtitle: 'Find the design that fits the moment.',
    featuredCta: 'Explore gifts →',
    secondaryCta: 'Explore →',
    secondaryNavLabel: 'Or explore by feeling:',
    secondaryNavCta: 'Shop by Vibe',
    breadcrumbLabel: 'Breadcrumb',
    giftBannerHeading: 'Make it a gift',
    giftBannerBody: 'Add a story card + gift wrap (200 EGP) at checkout.',
    giftBannerChip: 'Gift option at cart +200 EGP',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Vibe',
    artistLabel: 'Artist',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All vibes',
    allArtistsLabel: 'All artists',
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
    hubEyebrow: 'Shop by vibe',
    hubTitle: 'Which vibe is yours?',
    hubSubtitle: 'Every design starts with a feeling. Start with yours.',
    hubHeroAlt: 'Editorial collage showing the five HORO vibes through graphic-tee styling.',
    cardExploreCta: 'Explore →',
    cardSeeVibeCta: 'See vibe →',
    secondaryNavLabel: 'Or explore another way',
    secondaryNavCta: 'Shop by Occasion',
    cardAriaTemplate: '{cta} the {name} vibe collection',
  },
} as const;

export const ABOUT_SCHEMA = {
  copy: {
    primaryCta: 'Find Your Vibe',
    bridgeCta: 'Find Your Vibe',
    heroRegionLabel: 'HORO story hero',
    bridgeRegionLabel: 'HORO collection bridge',
  },
} as const;

export const SEARCH_SCHEMA = {
  copy: {
    placeholder: 'Search designs, vibes, artists...',
    searchLabel: 'Search',
    searchAllLabel: 'Search all designs',
    searchingInLabel: 'Searching in',
    popularLabel: 'Popular',
    designsTab: 'Designs',
    vibesTab: 'Vibes',
    artistsTab: 'Artists',
    sortLabel: 'Sort',
    priceLabel: 'Price',
    vibeLabel: 'Vibe',
    artistLabel: 'Artist',
    allPricesLabel: 'All prices',
    under800Label: 'Under 800 EGP',
    between800And899Label: '800–899 EGP',
    over900Label: '900+ EGP',
    allVibesLabel: 'All vibes',
    allArtistsLabel: 'All artists',
    filterAndSortCta: 'Filter & sort',
    resetFiltersCta: 'Reset filters',
    quickViewCta: 'Quick view',
    showCountCta: 'Show {count} {label}',
    designSingular: 'design',
    designPlural: 'designs',
    viewDesignsCta: 'See designs →',
    viewVibeCta: 'Explore vibe →',
    shopByVibeCta: 'Shop by Vibe',
    browseAllDesignsCta: 'Browse All Designs',
    noFilteredResults: 'No designs match these filters.',
    noDesignResults: 'No designs match this search yet.',
    noVibeResults: 'No vibes match this search yet.',
    noArtistResults: 'No artists match this search yet.',
    resultsFallback: 'Browse everything — or try a popular search below.',
    scopedResultsFallback: 'Browse designs in {scope} — or try a popular search below.',
    resultsForQuery: '{count} results for “{query}”',
    noResultsForQuery: 'No results for “{query}”',
  },
} as const;

export type PdpFeatureIconKey = (typeof PDP_SCHEMA.features)[number]['icon'];
export type PdpTrustIconKey = (typeof PDP_SCHEMA.trustSignals)[number]['icon'];
