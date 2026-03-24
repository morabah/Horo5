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
  /** Gallery image indices (0-based) for the “Worn by you” grid */
  wornByGalleryIndices: [1, 2, 0] as const,
  copy: {
    addBtnCTA: 'Add to Cart',
    addBtnTag: 'Embrace the light',
    /** Legacy one-line summary; prefer ratingValue + reviewCount for UI */
    shippingLine: 'Express shipping · 14-day hassle-free returns · Secure checkout',
    reviewSummary: '4.9 (24 reviews)',
    ratingValue: 4.9,
    reviewCount: 24,
    notifyMeCTA: 'Notify Me When Available',
    lowStockLabel: 'Only a few left',
    sizeGuideLabel: 'Size guide',
    selectSizePrompt: 'Select size',
    sizeRequiredPrompt: 'Choose a size above first.',
    storyCardHeading: 'For the one who…',
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
    wornByEyebrow: 'Community',
    wornByTitle: 'Worn by you',
    wornByCaptions: ['Studio days', 'Street light', 'Your rotation'],
    notifyEmailPlaceholder: 'Email for restock alerts',
    notifyFieldLabel: 'Get notified when this size is back',
    notifySubmitLabel: 'Join waitlist',
    notifySuccess: 'You’re on the list — we’ll email you when this size is back.',
    notifyInvalidEmail: 'Enter a valid email address.',
    inventoryLowFormat: 'Only {n} left',
  },
};

export type PdpFeatureIconKey = (typeof PDP_SCHEMA.features)[number]['icon'];
export type PdpTrustIconKey = (typeof PDP_SCHEMA.trustSignals)[number]['icon'];
