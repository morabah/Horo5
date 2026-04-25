// HORO latest financial assumptions override
// Loaded after app.js and before charts.js to keep the static dashboard current
// without rewriting the large calculator file.

(function applyHoroLatestNumbers() {
  if (typeof C === 'undefined' || typeof calc !== 'function') {
    console.warn('[HORO cost analysis] Core model not ready; latest assumptions not applied.');
    return;
  }

  const ASSUMPTIONS_STORAGE_KEY = 'horo-cost-analysis-assumptions-v1';
  const LATEST_NUMBERS_STORAGE_KEY = 'horo-cost-analysis-latest-numbers-version';
  const LATEST_NUMBERS_VERSION = '2026-04-horo-v1-validated-costs';

  // Clear old saved assumptions once so stale localStorage does not keep showing
  // pre-V1 numbers such as 749 price, 70 CPA, or 90 DTF after this update.
  try {
    const storedVersion = localStorage.getItem(LATEST_NUMBERS_STORAGE_KEY);
    if (storedVersion !== LATEST_NUMBERS_VERSION) {
      localStorage.removeItem(ASSUMPTIONS_STORAGE_KEY);
      localStorage.setItem(LATEST_NUMBERS_STORAGE_KEY, LATEST_NUMBERS_VERSION);
    }
  } catch (error) {
    console.warn('[HORO cost analysis] Could not migrate local assumptions storage.', error);
  }

  const latest = {
    // Current storefront pricing direction: most launch pieces are around 799 EGP.
    price: 799,
    partners: 5,
    initProd: 500,

    // Latest practical unit economics discussed for HORO V1.
    // Conservative base case: real cotton blank + DTF + packaging + tags.
    optimisticShirt: 220,
    cogs: {
      shirt: 250,
      markup: 50,
      dtf: 85,
      pkg: 30,
      tags: 7,
    },
    perUnit: {
      // Blended acquisition target for early paid + organic/referral mix.
      cpa: 160,
      // Shipping subsidy / exchanges reserve.
      subsidiary: 35,
      // Payment/platform reserve.
      platform: 20,
      // Tax / miscellaneous reserve. Validate once legal/accounting setup is final.
      tax: 40,
    },

    fixed: {
      brand: 20000,
      website: 50000,
      shooting: 20000,
      market: 30000,
      contentStrat: 7000,
      domain: 200,
      press: 20000,
      license: 20000,
    },
    monthly: {
      content: 7000,
      hosting: 2000,
      design: 7000,
      moderator: 12000,
      operator: 40000,
    },

    scenario: {
      pilotUnits: 100,
      pilotMonths: 3,
      pilotMarkup: 100,
      profitTargetBase: 300,
      profitTargetUpside: 500,
      operatorDelayMonths: 12,
      operatorProfitTrigger: 200000,
    },

    benchmarks: {
      priceBudgetAnchor: 300,
      priceBudgetMax: 400,
      priceMidAnchor: 525,
      priceMidMin: 400,
      priceMidMax: 650,
      pricePremiumAnchor: 800,
      pricePremiumMin: 700,
      pricePremiumMax: 1200,
      priceLuxuryAnchor: 1400,
      priceLuxuryMin: 1200,
      cogsTargetMinPct: 35,
      cogsTargetMaxPct: 50,
      cogsWatchMaxPct: 55,
      grossTargetMinPct: 50,
      grossTargetMaxPct: 65,
      contributionTypicalMinPct: 15,
      contributionTypicalMaxPct: 25,
      contributionHealthyPct: 25,
      cartAbandonmentAvgPct: 80.7,
      cartAbandonmentFashionMinPct: 75,
      cartAbandonmentFashionMaxPct: 85,
      egyptInternetPct: 82.7,
      egyptMobileConnectionsPct: 102,
      egyptAddToCartPct: 9.6,
      egyptEcommerceCvrPct: 1.9,
      egyptAovUsd: 39,
      egyptDiscountPct: 9.9,
      egyptReturnPct: 6.7,
      marketingPlanningCapPct: 10,
      crmRetargetingPlanningPct: 1,
      egyptMetaCpcMin: 3.2,
      egyptMetaCpcMax: 11,
      egyptMetaFashionCpc: 4.6,
      egyptMetaCpmMin: 32,
      egyptMetaCpmMax: 78,
      egyptMetaCtrMinPct: 1.1,
      egyptMetaCtrMaxPct: 2.2,
      egyptMetaPurchaseCpaMin: 88,
      egyptMetaPurchaseCpaMax: 410,
      egyptRetailCpaMin: 40,
      egyptRetailCpaMax: 120,
      egyptGoogleSearchCpcMin: 2,
      egyptGoogleSearchCpcMax: 10,
      marketingFloorMin: 5000,
      marketingFloorMax: 10000,
    },

    // Conservative launch ramp: prove first 100 units, then scale gradually.
    sales: [20, 35, 45, 80, 120, 150, 180, 220, 260, 300, 340, 380],
  };

  function mergeMutable(target, source) {
    Object.entries(source).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        target[key] = [...value];
      } else if (value && typeof value === 'object') {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        mergeMutable(target[key], value);
      } else {
        target[key] = value;
      }
    });
  }

  mergeMutable(C, latest);
  if (typeof DEFAULT_C !== 'undefined') {
    mergeMutable(DEFAULT_C, latest);
  }

  if (typeof D !== 'undefined') {
    D = calc();
  }

  window.HORO_LATEST_COST_ASSUMPTIONS = latest;
})();
