// === EDITABLE DATA MODEL ===
const C = {
  price: 749, partners: 5, initProd: 500, optimisticShirt: 194,
  cogs: { shirt: 242.5, markup: 50, dtf: 90, pkg: 35, tags: 3 },
  perUnit: { cpa: 70, subsidiary: 20, platform: 15, tax: 36.72 },
  fixed: { brand: 20000, website: 50000, shooting: 20000, market: 30000, contentStrat: 7000, domain: 200, press: 20000, license: 20000 },
  monthly: { content: 7000, hosting: 2000, design: 7000, moderator: 12000, operator: 40000 },
  scenario: { pilotUnits: 100, pilotMonths: 3, pilotMarkup: 100, profitTargetBase: 300, profitTargetUpside: 500, operatorDelayMonths: 12, operatorProfitTrigger: 200000 },
  benchmarks: {
    priceBudgetAnchor: 300, priceBudgetMax: 400,
    priceMidAnchor: 525, priceMidMin: 400, priceMidMax: 650,
    pricePremiumAnchor: 800, pricePremiumMin: 700, pricePremiumMax: 1200,
    priceLuxuryAnchor: 1400, priceLuxuryMin: 1200,
    cogsTargetMinPct: 35, cogsTargetMaxPct: 50, cogsWatchMaxPct: 55,
    grossTargetMinPct: 50, grossTargetMaxPct: 65,
    contributionTypicalMinPct: 15, contributionTypicalMaxPct: 25, contributionHealthyPct: 25,
    cartAbandonmentAvgPct: 80.7, cartAbandonmentFashionMinPct: 75, cartAbandonmentFashionMaxPct: 85,
    egyptInternetPct: 82.7, egyptMobileConnectionsPct: 102,
    egyptAddToCartPct: 9.6, egyptEcommerceCvrPct: 1.9, egyptAovUsd: 39, egyptDiscountPct: 9.9, egyptReturnPct: 6.7,
    marketingPlanningCapPct: 10, crmRetargetingPlanningPct: 1,
    egyptMetaCpcMin: 3.2, egyptMetaCpcMax: 11, egyptMetaFashionCpc: 4.6,
    egyptMetaCpmMin: 32, egyptMetaCpmMax: 78, egyptMetaCtrMinPct: 1.1, egyptMetaCtrMaxPct: 2.2,
    egyptMetaPurchaseCpaMin: 88, egyptMetaPurchaseCpaMax: 410,
    egyptRetailCpaMin: 40, egyptRetailCpaMax: 120,
    egyptGoogleSearchCpcMin: 2, egyptGoogleSearchCpcMax: 10,
    marketingFloorMin: 5000, marketingFloorMax: 10000
  },
  sales: [20, 35, 45, 80, 120, 150, 180, 220, 260, 300, 340, 380]
};

const DEFAULT_C = deepClone(C);
const ASSUMPTIONS_STORAGE_KEY = 'horo-cost-analysis-assumptions-v1';
let priceOptimizationVisible = false;

// === COMPUTED VALUES ===
function calc() {
  const d = {};
  d.totalCOGS = Object.values(C.cogs).reduce((a,b)=>a+b,0);
  d.totalVar = Object.values(C.perUnit).reduce((a,b)=>a+b,0);
  d.costPerUnit = d.totalCOGS + d.totalVar;
  d.margin = C.price - d.costPerUnit;
  d.totalFixed = Object.values(C.fixed).reduce((a,b)=>a+b,0);
  d.testFixed = C.fixed.brand + C.fixed.website + C.fixed.shooting + C.fixed.market + C.fixed.contentStrat + C.fixed.domain;
  d.deferredFixed = d.totalFixed - d.testFixed;
  d.testMonthly = C.monthly.content + C.monthly.hosting + C.monthly.design;
  d.growthMonthly = d.testMonthly + C.monthly.moderator;
  d.fullMonthly = d.growthMonthly + C.monthly.operator;
  d.growthBE = d.margin > 0 ? Math.ceil(d.growthMonthly / d.margin) : Infinity;
  d.fullBE = d.margin > 0 ? Math.ceil(d.fullMonthly / d.margin) : Infinity;
  d.recoverUnits = d.margin > 0 ? Math.ceil(d.totalFixed / d.margin) : Infinity;
  d.inventoryCost = C.initProd * d.totalCOGS;
  d.totalCapital = d.totalFixed + d.inventoryCost + d.growthMonthly * 2;
  d.perPartner = Math.ceil(d.totalCapital / C.partners);
  d.contingency = d.totalCapital - d.totalFixed - d.inventoryCost;
  // Optimistic
  const optCOGS = C.optimisticShirt + C.cogs.markup + C.cogs.dtf + C.cogs.pkg + C.cogs.tags;
  d.optCOGS = optCOGS;
  d.optMargin = C.price - optCOGS - d.totalVar;
  d.optGrowthBE = d.optMargin > 0 ? Math.ceil(d.growthMonthly / d.optMargin) : Infinity;
  d.optInventory = C.initProd * optCOGS;
  d.optSavings = d.inventoryCost - d.optInventory;
  // Scenarios
  d.profitBase = C.scenario.profitTargetBase * d.margin - d.growthMonthly;
  d.profitUpside = C.scenario.profitTargetUpside * d.margin - d.growthMonthly;
  d.profit300 = d.profitBase;
  d.profit500 = d.profitUpside;
  d.recoverMonths300 = d.profit300 > 0 ? Math.ceil(d.totalFixed / d.profit300) : Infinity;
  d.recoverMonths500 = d.profit500 > 0 ? Math.ceil(d.totalFixed / d.profit500) : Infinity;
  d.optProfit300 = C.scenario.profitTargetBase * d.optMargin - d.growthMonthly;
  d.optRecoverMonths300 = d.optProfit300 > 0 ? Math.ceil(d.totalFixed / d.optProfit300) : Infinity;
  return d;
}

let D = calc();
let lang = 'ar';
const fmt = n => Math.round(n).toLocaleString('en');
const fmtD = (n,d=1) => n.toFixed(d);
const fmtK = n => (n/1000).toFixed(1)+'K';

// === BILINGUAL UI TEXT + NUMBER MEANING HELPERS ===
const TEXT = {
  ar: {
    unit: {
      egp: 'جنيه',
      egpMo: 'جنيه/شهر',
      egpYear: 'جنيه/سنة',
      units: 'قطعة',
      unitsMo: 'قطعة/شهر',
      totalUnits: 'إجمالي القطع',
      month: n => `الشهر ${n}`,
      monthShort: n => `ش${n}`,
      notYear1: 'ليس في السنة الأولى',
      unavailable: 'غير ممكن'
    },
    input: {
      shirt: 'تيشيرت سادة (جنيه)',
      markup: 'هامش المصنع',
      dtf: 'طباعة DTF والكي',
      pkg: 'التغليف',
      tags: 'الليبل والتاج',
      cpa: 'CPA - تكلفة جلب العميل',
      subsidiary: 'دعم الشحن والمرتجعات',
      platform: 'عمولة المنصة والدفع',
      tax: 'ضرائب ومصاريف أخرى',
      brand: 'تصميم البراند واللوجو',
      website: 'الموقع الإلكتروني',
      shooting: 'جلسة تصوير الموديل',
      market: 'اختبار السوق',
      contentStrat: 'استراتيجية المحتوى',
      domain: 'الدومين',
      press: 'مكبس الطباعة',
      license: 'التأسيس والتراخيص',
      content: 'إدارة المحتوى/شهر',
      hosting: 'الاستضافة/شهر',
      design: 'التصميمات/شهر',
      moderator: 'الموديريتور/شهر',
      operator: 'الأوبريتور/شهر',
      price: 'سعر البيع',
      partners: 'عدد الشركاء',
      initProd: 'كمية الإنتاج الأولى',
      optimisticShirt: 'تكلفة التيشيرت المتفائلة',
      pilotUnits: 'كمية البايلوت',
      pilotMonths: 'مدة البايلوت بالشهور',
      pilotMarkup: 'هامش المصنع في البايلوت',
      profitTargetBase: 'هدف المبيعات الأساسي',
      profitTargetUpside: 'هدف المبيعات الأعلى',
      operatorDelayMonths: 'مدة تأجيل الأوبريتور بالشهور',
      operatorProfitTrigger: 'ربح تراكمي قبل تعيين الأوبريتور'
    },
    table: {
      component: 'البند',
      item: 'البند',
      amount: 'القيمة',
      percent: '%',
      total: 'الإجمالي',
      revenue: 'الإيرادات',
      cost: 'التكلفة',
      costs: 'التكاليف',
      cogs: 'تكلفة الإنتاج المباشرة',
      variableCosts: 'التكاليف المتغيرة',
      fixedReduced: 'تأسيس البايلوت شامل الموقع',
      monthlyThree: 'تشغيل مدة البايلوت شامل الاستضافة',
      netPL: 'صافي الربح/الخسارة',
      totalCOGS: 'إجمالي تكلفة الإنتاج',
      totalVariable: 'إجمالي المتغير',
      totalCostUnit: 'إجمالي تكلفة القطعة',
      contributionMargin: 'هامش المساهمة',
      variableBadge: 'متغير',
      subtotalNoOperator: 'الإجمالي بدون الأوبريتور',
      operatorDeferred: 'الأوبريتور (مؤجل)',
      fullMonthly: 'التشغيل الشهري الكامل',
      revenueFormula: ({units, price}) => `الإيرادات (${units}×${price})`
    },
    chart: {
      tshirt: 'تيشيرت',
      markup: 'هامش مصنع',
      dtf: 'طباعة',
      packaging: 'تغليف',
      tags: 'ليبل/تاج',
      cpa: 'CPA',
      subsidiary: 'شحن/مرتجعات',
      platform: 'منصة',
      tax: 'ضرائب',
      margin: 'هامش',
      revenue: 'إيرادات',
      cost: 'تكلفة',
      totalCost: 'إجمالي التكلفة',
      fixed: 'تأسيس',
      monthly: 'شهري',
      net: 'الصافي',
      cogs: 'تكلفة إنتاج',
      variableCosts: 'متغير',
      profit: 'ربح',
      pl: 'ربح/خسارة',
      cumulativePL: 'ربح/خسارة تراكمي',
      breakeven: 'تعادل',
      units: 'القطع',
      egp: 'جنيه',
      price: 'السعر',
      brand: 'البراند',
      scale: 'التوسع',
      industry: 'سوق مصر',
      budget: 'اقتصادي',
      mid: 'متوسط',
      premium: 'بريميوم',
      luxury: 'فاخر'
    },
    market: {
      retailPrice: 'سعر البيع',
      cogsPct: 'تكلفة الإنتاج %',
      cpa: 'CPA',
      contributionMargin: 'هامش المساهمة',
      grossMargin: 'الهامش الإجمالي',
      cartAbandonment: 'ترك السلة',
      mobileTransactions: 'الوصول الرقمي في مصر',
      planForIt: 'خطط له',
      critical: 'أساسي',
      industryPrice: 'نطاق البريميوم',
      industryCogs: 'هدف الإنتاج',
      industryCpa: 'بنشمارك التسويق',
      industryContribution: 'هامش مساهمة نموذجي',
      industryGross: 'هامش إجمالي مستهدف',
      industryCart: 'متوسط ترك السلة',
      industryMobile: 'انتشار الإنترنت والموبايل'
    },
    assessment: {
      good: '✅ جيد',
      warn: '⚠️ يحتاج متابعة',
      bad: '❌ خطر',
      priceLow: '⚠️ أقل من نطاق البريميوم',
      priceGood: '✅ داخل نطاق البريميوم المناسب',
      priceHigh: '⚠️ أعلى من السوق ويحتاج إثبات قيمة قوي',
      cogsGood: '✅ ضمن هدف التشغيل',
      cogsHigh: '⚠️ أعلى قليلاً من هدف التشغيل',
      cogsBad: '❌ يضغط الربحية بقوة',
      cpaExcellent: '✅ مثبت بأرقام الاختبار',
      cpaOk: '⚠️ يحتاج تحقق من الإعلانات',
      cpaBad: '❌ مرتفع ويحتاج ضبط',
      marginStrong: '✅ قوي',
      marginHealthy: '✅ صحي',
      marginThin: '⚠️ هامش ضعيف',
      marginBad: '❌ كل بيعة تخسر',
      grossGood: '✅ صحي',
      grossLow: '⚠️ أقل من المتوسط',
      cart: '⚠️ مرتفع في مصر',
      mobile: '✅ الموبايل أولاً'
    },
    profit: {
      profit: 'ربح',
      loss: 'خسارة',
      breakeven: 'تعادل',
      netProfit: 'صافي ربح',
      netLoss: 'صافي خسارة',
      netBreakeven: 'تعادل صافي'
    }
  },
  en: {
    unit: {
      egp: 'EGP',
      egpMo: 'EGP/mo',
      egpYear: 'EGP/yr',
      units: 'units',
      unitsMo: 'units/mo',
      totalUnits: 'total units',
      month: n => `Month ${n}`,
      monthShort: n => `M${n}`,
      notYear1: 'Not Yr1',
      unavailable: 'Not possible'
    },
    input: {
      shirt: 'Blank T-Shirt (EGP)',
      markup: 'Manufacturer Markup',
      dtf: 'DTF Print & Pressing',
      pkg: 'Packaging',
      tags: 'Tags & Labels',
      cpa: 'CPA (Marketing)',
      subsidiary: 'Shipping/Returns Support',
      platform: 'Platform & Payment Fees',
      tax: 'Tax/Other Fees',
      brand: 'Brand Design & Logo',
      website: 'Website',
      shooting: 'Model Shooting',
      market: 'Market Test',
      contentStrat: 'Content Strategy',
      domain: 'Domain',
      press: 'Press Printing',
      license: 'Initiation & License',
      content: 'Content/month',
      hosting: 'Hosting/month',
      design: 'Design/month',
      moderator: 'Moderator/month',
      operator: 'Operator/month',
      price: 'Retail Price',
      partners: 'Number of Partners',
      initProd: 'Initial Production Qty',
      optimisticShirt: 'Optimistic T-Shirt Cost',
      pilotUnits: 'Pilot Units',
      pilotMonths: 'Pilot Duration (months)',
      pilotMarkup: 'Pilot Factory Markup',
      profitTargetBase: 'Base Sales Target',
      profitTargetUpside: 'Upside Sales Target',
      operatorDelayMonths: 'Operator Deferral (months)',
      operatorProfitTrigger: 'Cumulative Profit Before Operator'
    },
    table: {
      component: 'Component',
      item: 'Item',
      amount: 'Amount',
      percent: '%',
      total: 'Total',
      revenue: 'Revenue',
      cost: 'Cost',
      costs: 'Costs',
      cogs: 'COGS',
      variableCosts: 'Variable Costs',
      fixedReduced: 'Pilot setup incl. website',
      monthlyThree: 'Pilot monthly ops incl. hosting',
      netPL: 'Net P&L',
      totalCOGS: 'Total COGS',
      totalVariable: 'Total Variable',
      totalCostUnit: 'Total Cost/Unit',
      contributionMargin: 'Contribution Margin',
      variableBadge: 'Variable',
      subtotalNoOperator: 'Subtotal (No Operator)',
      operatorDeferred: 'Operator (deferred)',
      fullMonthly: 'Full Monthly',
      revenueFormula: ({units, price}) => `Revenue (${units}×${price})`
    },
    chart: {
      tshirt: 'T-Shirt',
      markup: 'Markup',
      dtf: 'DTF',
      packaging: 'Packaging',
      tags: 'Tags',
      cpa: 'CPA',
      subsidiary: 'Shipping/Returns',
      platform: 'Platform',
      tax: 'Tax',
      margin: 'Margin',
      revenue: 'Revenue',
      cost: 'Cost',
      totalCost: 'Total Cost',
      fixed: 'Fixed',
      monthly: 'Monthly',
      net: 'Net',
      cogs: 'COGS',
      variableCosts: 'Variable',
      profit: 'Profit',
      pl: 'P&L',
      cumulativePL: 'Cumulative P&L',
      breakeven: 'Breakeven',
      units: 'Units',
      egp: 'EGP',
      price: 'Price',
      brand: 'Brand',
      scale: 'Scale',
      industry: 'Egypt Market',
      budget: 'Budget',
      mid: 'Mid',
      premium: 'Premium',
      luxury: 'Luxury'
    },
    market: {
      retailPrice: 'Retail Price',
      cogsPct: 'COGS %',
      cpa: 'CPA',
      contributionMargin: 'Contribution Margin',
      grossMargin: 'Gross Margin',
      cartAbandonment: 'Cart Abandonment',
      mobileTransactions: 'Egypt Digital Reach',
      planForIt: 'Plan for it',
      critical: 'Critical',
      industryPrice: 'Premium range',
      industryCogs: 'Production target',
      industryCpa: 'Marketing benchmark',
      industryContribution: 'Typical contribution',
      industryGross: 'Target gross margin',
      industryCart: 'Cart abandonment average',
      industryMobile: 'Internet/mobile reach'
    },
    assessment: {
      good: '✅ Good',
      warn: '⚠️ Needs attention',
      bad: '❌ Risk',
      priceLow: '⚠️ Below premium range',
      priceGood: '✅ Well-positioned in premium range',
      priceHigh: '⚠️ Above market; needs strong value proof',
      cogsGood: '✅ Within operating target',
      cogsHigh: '⚠️ Slightly above operating target',
      cogsBad: '❌ Profitability pressure',
      cpaExcellent: '✅ Validated by test data',
      cpaOk: '⚠️ Needs ad validation',
      cpaBad: '❌ Too high; needs optimization',
      marginStrong: '✅ Strong',
      marginHealthy: '✅ Healthy',
      marginThin: '⚠️ Thin margin',
      marginBad: '❌ Losing money per sale',
      grossGood: '✅ Healthy',
      grossLow: '⚠️ Below avg',
      cart: '⚠️ High in Egypt',
      mobile: '✅ Mobile-first'
    },
    profit: {
      profit: 'Profit',
      loss: 'Loss',
      breakeven: 'Breakeven',
      netProfit: 'Net profit',
      netLoss: 'Net loss',
      netBreakeven: 'Net breakeven'
    }
  }
};

function tx(path, activeLang=lang) {
  const value = path.split('.').reduce((obj, key) => obj && obj[key], TEXT[activeLang]);
  return typeof value === 'function' ? value : (value ?? path);
}

function callTx(path, arg, activeLang=lang) {
  const value = tx(path, activeLang);
  return typeof value === 'function' ? value(arg) : value;
}

function phrase(activeLang, ar, en) {
  return activeLang === 'ar' ? ar : en;
}

function currency(n, activeLang=lang) {
  return `${fmt(n)} ${tx('unit.egp', activeLang)}`;
}

function currencyK(n, activeLang=lang) {
  return `${fmtK(Math.abs(n))} ${tx('unit.egp', activeLang)}`;
}

function signedPL(value, { compact=false, activeLang=lang } = {}) {
  const amount = compact ? currencyK(value, activeLang) : currency(Math.abs(value), activeLang);
  if (value > 0) return `${tx('profit.profit', activeLang)} ${amount}`;
  if (value < 0) return `${tx('profit.loss', activeLang)} ${amount}`;
  return tx('profit.breakeven', activeLang);
}

function plClass(value) {
  if (value > 0) return 'profit';
  if (value < 0) return 'loss';
  return 'warn';
}

function plColor(value) {
  if (value > 0) return '#34d399';
  if (value < 0) return '#f87171';
  return '#fbbf24';
}

function formatUnits(value, activeLang=lang) {
  return Number.isFinite(value) && value > 0 ? fmt(value) : tx('unit.unavailable', activeLang);
}

function unitPhrase(value, activeLang=lang) {
  return `${formatUnits(value, activeLang)} ${tx('unit.units', activeLang)}`;
}

function monthPhrase(value, activeLang=lang) {
  if (!Number.isFinite(value) || value <= 0) return tx('unit.unavailable', activeLang);
  const rounded = Math.round(value);
  const arUnit = rounded === 1 ? 'شهر' : (rounded === 2 ? 'شهرين' : 'أشهر');
  return phrase(activeLang, rounded === 2 ? arUnit : `${fmt(value)} ${arUnit}`, `${fmt(value)} month${rounded === 1 ? '' : 's'}`);
}

function stripTrailingZero(value) {
  return String(value).replace(/\.0$/, '');
}

function pctText(value, digits=1) {
  return stripTrailingZero(fmtD(value, digits)) + '%';
}

function pctRange(min, max, digits=0) {
  return `${pctText(min, digits)}-${pctText(max, digits)}`;
}

function currencyRange(min, max, activeLang=lang) {
  return `${fmt(min)}-${fmt(max)} ${tx('unit.egp', activeLang)}`;
}

function priceRange(min, max, activeLang=lang) {
  return `${fmt(min)}-${fmt(max)} ${tx('unit.egp', activeLang)}`;
}

function marketingBenchmark() {
  const clickCost = C.benchmarks.egyptMetaFashionCpc;
  const egyptCvrRate = C.benchmarks.egyptEcommerceCvrPct / 100;
  const clickModelCpaLow = C.benchmarks.egyptMetaCpcMin / egyptCvrRate;
  const clickModelCpaHigh = C.benchmarks.egyptMetaCpcMax / egyptCvrRate;
  const clickModelCpaTypical = clickCost / egyptCvrRate;
  const cpaRevenuePct = C.price > 0 ? C.perUnit.cpa / C.price * 100 : Infinity;
  const blendedCpaCap = C.price * C.benchmarks.marketingPlanningCapPct / 100;
  const egyptRetailCpaLow = C.benchmarks.egyptRetailCpaMin;
  const egyptRetailCpaHigh = C.benchmarks.egyptRetailCpaMax;
  const egyptMetaPurchaseCpaLow = C.benchmarks.egyptMetaPurchaseCpaMin;
  const egyptMetaPurchaseCpaHigh = C.benchmarks.egyptMetaPurchaseCpaMax;
  const emailCpa = C.price * C.benchmarks.crmRetargetingPlanningPct / 100;
  const maxAffordableCpa = C.price - D.totalCOGS - (D.totalVar - C.perUnit.cpa);
  const impliedCvr = C.perUnit.cpa > 0 ? clickCost / C.perUnit.cpa * 100 : Infinity;
  const egyptMetaPurchaseLowMargin = D.margin - (egyptMetaPurchaseCpaLow - C.perUnit.cpa);
  const egyptMetaPurchaseHighMargin = D.margin - (egyptMetaPurchaseCpaHigh - C.perUnit.cpa);
  const egyptRetailHighMargin = D.margin - (egyptRetailCpaHigh - C.perUnit.cpa);
  return {
    clickCost,
    clickModelCpaLow,
    clickModelCpaHigh,
    clickModelCpaTypical,
    cpaRevenuePct,
    blendedCpaCap,
    egyptRetailCpaLow,
    egyptRetailCpaHigh,
    egyptMetaPurchaseCpaLow,
    egyptMetaPurchaseCpaHigh,
    emailCpa,
    maxAffordableCpa,
    impliedCvr,
    egyptMetaPurchaseLowMargin,
    egyptMetaPurchaseHighMargin,
    egyptRetailHighMargin
  };
}

function cpaBlendStatus(activeLang=lang) {
  const b = marketingBenchmark();
  if (C.perUnit.cpa >= b.egyptRetailCpaLow && C.perUnit.cpa <= b.egyptRetailCpaHigh) {
    return phrase(
      activeLang,
      `<span class="good">${currency(C.perUnit.cpa, activeLang)} داخل نطاق CPA التجزئة في مصر ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh, activeLang)}، ويساوي ${pctText(b.cpaRevenuePct, 1)} من سعر البيع.</span>`,
      `<span class="good">${currency(C.perUnit.cpa, activeLang)} is inside Egypt retail CPA range ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh, activeLang)}, equal to ${pctText(b.cpaRevenuePct, 1)} of retail price.</span>`
    );
  }
  if (C.perUnit.cpa < b.egyptRetailCpaLow) {
    return phrase(
      activeLang,
      `<span class="warn">${currency(C.perUnit.cpa, activeLang)} أقل من نطاق CPA التجزئة في مصر ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh, activeLang)}؛ اعتبره هدفاً متفائلاً يحتاج organic أو referrals قوي.</span>`,
      `<span class="warn">${currency(C.perUnit.cpa, activeLang)} is below Egypt retail CPA range ${currencyRange(b.egyptRetailCpaLow, b.egyptRetailCpaHigh, activeLang)}; treat it as an optimistic target that needs strong organic or referrals.</span>`
    );
  }
  if (C.perUnit.cpa <= b.blendedCpaCap) {
    return phrase(
      activeLang,
      `<span class="good">${currency(C.perUnit.cpa, activeLang)} داخل سقف التخطيط الداخلي للتسويق ${currency(b.blendedCpaCap, activeLang)} لكنه أعلى من نطاق CPA التجزئة المحلي.</span>`,
      `<span class="good">${currency(C.perUnit.cpa, activeLang)} is inside the internal marketing planning cap of ${currency(b.blendedCpaCap, activeLang)}, but above the local retail CPA range.</span>`
    );
  }
  if (C.perUnit.cpa <= b.maxAffordableCpa) {
    return phrase(
      activeLang,
      `<span class="warn">${currency(C.perUnit.cpa, activeLang)} قابل للتحمل على مستوى القطعة، لكنه يضغط هامش التشغيل ويحتاج قناة ذات نية شراء عالية.</span>`,
      `<span class="warn">${currency(C.perUnit.cpa, activeLang)} is still affordable at unit level, but it compresses operating margin and needs high-intent traffic.</span>`
    );
  }
  return phrase(
    activeLang,
    `<span class="bad">${currency(C.perUnit.cpa, activeLang)} أعلى من أقصى CPA تتحمله القطعة حالياً (${currency(b.maxAffordableCpa, activeLang)}).</span>`,
    `<span class="bad">${currency(C.perUnit.cpa, activeLang)} is above the current max affordable CPA of ${currency(b.maxAffordableCpa, activeLang)}.</span>`
  );
}

function cpaPaidStatus(activeLang=lang) {
  const b = marketingBenchmark();
  if (C.perUnit.cpa < b.egyptMetaPurchaseCpaLow) {
    return phrase(
      activeLang,
      `<span class="warn">لكن كحملة شراء مباشرة على Meta في مصر هو هدف قوي جداً: معيار الشراء المحلي ${currencyRange(b.egyptMetaPurchaseCpaLow, b.egyptMetaPurchaseCpaHigh, activeLang)}، وCPC أزياء مصر حوالي ${currency(b.clickCost, activeLang)} مع CVR مصر ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)} ينتج CPA تقريبي ${currency(b.clickModelCpaTypical, activeLang)}.</span>`,
      `<span class="warn">But as a direct Meta purchase campaign in Egypt it is aggressive: local purchase CPA benchmark is ${currencyRange(b.egyptMetaPurchaseCpaLow, b.egyptMetaPurchaseCpaHigh, activeLang)}, and Egypt fashion CPC around ${currency(b.clickCost, activeLang)} with Egypt CVR ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)} implies roughly ${currency(b.clickModelCpaTypical, activeLang)} CPA.</span>`
    );
  }
  if (C.perUnit.cpa <= b.maxAffordableCpa) {
    return phrase(
      activeLang,
      `<span class="good">هذا الرقم قابل للاختبار كـ paid acquisition في مصر لأنه أقل من سقف ربحية القطعة ${currency(b.maxAffordableCpa, activeLang)}.</span>`,
      `<span class="good">This can be tested as paid acquisition in Egypt because it is below the unit profitability cap of ${currency(b.maxAffordableCpa, activeLang)}.</span>`
    );
  }
  return phrase(
    activeLang,
    `<span class="bad">هذا أعلى من سقف ربحية القطعة، فلا يصلح كـ paid acquisition قبل تعديل السعر أو التكلفة.</span>`,
    `<span class="bad">This is above the unit profitability cap, so it does not work as paid acquisition before price or cost changes.</span>`
  );
}

function phaseName(prefix, units) {
  return `${prefix}_${formatUnits(units, 'en')}`;
}

function monthlyPLSentence(value, activeLang=lang) {
  if (value > 0) {
    return phrase(
      activeLang,
      `صافي الربح الشهري سيكون حوالي <span class="num">${currency(value, activeLang)}</span>.`,
      `Net monthly profit is approx. <span class="num">${currency(value, activeLang)}</span>.`
    );
  }
  if (value < 0) {
    return phrase(
      activeLang,
      `ستكون هناك خسارة شهرية حوالي <span class="num">${currency(Math.abs(value), activeLang)}</span>.`,
      `Monthly loss is approx. <span class="num">${currency(Math.abs(value), activeLang)}</span>.`
    );
  }
  return phrase(activeLang, 'هذا الحجم يحقق التعادل الشهري تقريباً.', 'This volume is roughly monthly breakeven.');
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeLocalStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__horo_storage_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

function mergeAssumptions(target, source, template=DEFAULT_C) {
  if (!source || typeof source !== 'object') return;
  Object.keys(template).forEach(key => {
    const baseValue = template[key];
    const nextValue = source[key];
    if (Array.isArray(baseValue)) {
      target[key] = Array.isArray(nextValue) ? nextValue.map(v => Number(v) || 0) : deepClone(baseValue);
      return;
    }
    if (baseValue && typeof baseValue === 'object') {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      mergeAssumptions(target[key], nextValue, baseValue);
      return;
    }
    const numericValue = Number(nextValue);
    target[key] = Number.isFinite(numericValue) ? numericValue : baseValue;
  });
}

function replaceAssumptions(nextAssumptions) {
  Object.keys(C).forEach(key => delete C[key]);
  Object.assign(C, deepClone(DEFAULT_C));
  mergeAssumptions(C, nextAssumptions);
  D = calc();
}

function assumptionsPayload() {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    assumptions: deepClone(C)
  };
}

function updateAssumptionStatus(message) {
  const el = document.getElementById('assumptionStatus');
  if (el) el.textContent = message || '';
}

function persistAssumptionsToStorage({ silent=false } = {}) {
  const store = safeLocalStorage();
  if (!store) {
    if (!silent) {
      updateAssumptionStatus(phrase(lang, 'المتصفح لا يسمح بالحفظ المحلي. استخدم زر حفظ JSON لتنزيل نسخة.', 'Browser local storage is unavailable. Use Save JSON to download a copy.'));
    }
    return false;
  }
  store.setItem(ASSUMPTIONS_STORAGE_KEY, JSON.stringify(assumptionsPayload()));
  if (!silent) updateAssumptionStatus(phrase(lang, 'تم حفظ آخر الأرقام في المتصفح كـ JSON.', 'Latest numbers saved in the browser as JSON.'));
  return true;
}

function loadStoredAssumptions() {
  const store = safeLocalStorage();
  if (!store) return false;
  const raw = store.getItem(ASSUMPTIONS_STORAGE_KEY);
  if (!raw) return false;
  try {
    const payload = JSON.parse(raw);
    replaceAssumptions(payload.assumptions || payload);
    return true;
  } catch {
    store.removeItem(ASSUMPTIONS_STORAGE_KEY);
    return false;
  }
}

function handleAssumptionsChanged({ rebuildEditors=false, message='' } = {}) {
  D = calc();
  persistAssumptionsToStorage({ silent: true });
  if (rebuildEditors) buildEditors();
  renderAll();
  if (priceOptimizationVisible) renderPriceOptimization();
  if (message) updateAssumptionStatus(message);
}

function saveAssumptionsJson() {
  persistAssumptionsToStorage({ silent: true });
  const payload = assumptionsPayload();
  const json = JSON.stringify(payload, null, 2);
  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'horo-assumptions.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  updateAssumptionStatus(phrase(lang, 'تم حفظ الأرقام وتنزيل ملف horo-assumptions.json.', 'Numbers saved and horo-assumptions.json downloaded.'));
}

function resetAssumptions() {
  replaceAssumptions(DEFAULT_C);
  const store = safeLocalStorage();
  if (store) store.removeItem(ASSUMPTIONS_STORAGE_KEY);
  priceOptimizationVisible = false;
  buildEditors();
  renderAll();
  const result = document.getElementById('priceOptimizationResult');
  if (result) result.innerHTML = '';
  updateAssumptionStatus(phrase(lang, 'تم الرجوع إلى الأرقام الأصلية.', 'Original numbers restored.'));
}

function retailPricePoints() {
  const prices = [];
  for (let price = 249; price <= 1999; price += 50) prices.push(price);
  return prices;
}

function retailPriceAtLeast(rawPrice) {
  const points = retailPricePoints();
  const found = points.find(price => price >= rawPrice);
  return found || Math.ceil(rawPrice / 50) * 50 - 1;
}

function priceMetrics(price, costPerUnit=D.costPerUnit) {
  const unitContribution = price - costPerUnit;
  const contributionPct = price > 0 ? unitContribution / price * 100 : -Infinity;
  const cogsPct = price > 0 ? D.totalCOGS / price * 100 : Infinity;
  const grossPct = price > 0 ? (price - D.totalCOGS) / price * 100 : -Infinity;
  const baseUnits = Math.max(0, C.scenario.profitTargetBase);
  const upsideUnits = Math.max(0, C.scenario.profitTargetUpside);
  return {
    price,
    unitContribution,
    contributionPct,
    cogsPct,
    grossPct,
    baseProfit: baseUnits * unitContribution - D.growthMonthly,
    upsideProfit: upsideUnits * unitContribution - D.growthMonthly,
    breakeven: unitContribution > 0 ? Math.ceil(D.growthMonthly / unitContribution) : Infinity
  };
}

function computePriceOptimization() {
  const variableWithoutCpa = D.totalVar - C.perUnit.cpa;
  const metaLowCostPerUnit = D.totalCOGS + variableWithoutCpa + C.benchmarks.egyptMetaPurchaseCpaMin;
  const minViableRaw = Math.max(
    D.costPerUnit / (1 - C.benchmarks.contributionTypicalMinPct / 100),
    D.totalCOGS / (C.benchmarks.cogsWatchMaxPct / 100),
    C.benchmarks.priceMidMin
  );
  const recommendedRaw = Math.max(
    D.costPerUnit / (1 - C.benchmarks.contributionHealthyPct / 100),
    D.totalCOGS / (C.benchmarks.cogsTargetMaxPct / 100),
    C.benchmarks.pricePremiumMin
  );
  const strongRaw = Math.max(
    D.costPerUnit / 0.70,
    D.totalCOGS / 0.45,
    C.benchmarks.pricePremiumAnchor
  );
  const metaLowRaw = Math.max(
    metaLowCostPerUnit / (1 - C.benchmarks.contributionHealthyPct / 100),
    D.totalCOGS / (C.benchmarks.cogsTargetMaxPct / 100),
    C.benchmarks.pricePremiumMin
  );

  const floor = priceMetrics(retailPriceAtLeast(minViableRaw));
  const recommended = priceMetrics(retailPriceAtLeast(recommendedRaw));
  const stretch = priceMetrics(retailPriceAtLeast(strongRaw));
  const paidAcquisition = priceMetrics(retailPriceAtLeast(metaLowRaw), metaLowCostPerUnit);
  const current = priceMetrics(C.price);
  return { current, floor, recommended, stretch, paidAcquisition };
}

function optimizationCard(option, titleAr, titleEn, descriptionAr, descriptionEn, recommended=false) {
  return `
    <div class="optimization-card${recommended ? ' recommended' : ''}">
      <div class="optimization-label">${phrase(lang, titleAr, titleEn)}</div>
      <div class="optimization-price">${currency(option.price)}</div>
      <div class="optimization-meta">
        ${phrase(lang, descriptionAr, descriptionEn)}<br>
        ${phrase(lang, 'هامش مساهمة', 'Contribution')}: ${pctText(option.contributionPct, 1)} ·
        COGS: ${pctText(option.cogsPct, 1)} ·
        ${phrase(lang, 'تعادل', 'Breakeven')}: ${formatUnits(option.breakeven)}
      </div>
      <div class="optimization-actions">
        <button type="button" class="action-btn${recommended ? ' primary' : ''}" onclick="applyOptimizedPrice(${option.price})">${phrase(lang, 'اعتماد السعر', 'Apply price')}</button>
      </div>
    </div>`;
}

function renderPriceOptimization() {
  const el = document.getElementById('priceOptimizationResult');
  if (!el) return;
  const opt = computePriceOptimization();
  const currentRead = opt.current.contributionPct >= C.benchmarks.contributionHealthyPct && opt.current.cogsPct <= C.benchmarks.cogsTargetMaxPct
    ? phrase(lang, 'السعر الحالي صحي بالفعل، ويمكن استخدام السعر المقترح لاختبار رفع الهامش.', 'Current price is already healthy; use the recommendation to test margin lift.')
    : phrase(lang, 'السعر الحالي لا يعطي كل أهداف الستارت أب: نحتاج هامش مساهمة أقوى وCOGS أقل كنسبة من السعر.', 'Current price does not meet all startup targets: stronger contribution and lower COGS percentage are needed.');
  const premiumWarning = opt.recommended.price > C.benchmarks.pricePremiumMax
    ? `<p class="bad optimization-note">${phrase(lang, 'السعر الصحي المحسوب أعلى من نطاق البريميوم المحلي؛ هذا يعني أن المشكلة في التكلفة قبل السعر.', 'The calculated healthy price is above the local premium range; this means cost structure needs work before price.')}</p>`
    : '';

  el.innerHTML = `
    <div class="optimization-note">
      <strong>${phrase(lang, 'قراءة السعر الحالي', 'Current price read')}:</strong>
      ${currency(C.price)} · ${phrase(lang, 'هامش مساهمة', 'Contribution')} ${pctText(opt.current.contributionPct, 1)} ·
      COGS ${pctText(opt.current.cogsPct, 1)}. ${currentRead}
    </div>
    <div class="optimization-grid">
      ${optimizationCard(
        opt.floor,
        'أرضية التشغيل', 'Operating floor',
        'أقل سعر دفاعي يحافظ على هامش مساهمة مقبول ويمنع COGS من الخروج عن حد المتابعة.',
        'Lowest defensible price that keeps acceptable contribution and keeps COGS near the watch limit.'
      )}
      ${optimizationCard(
        opt.recommended,
        'السعر الأنسب للستارت أب', 'Best startup price',
        'أفضل توازن بين نطاق بريميوم مصر، هامش مساهمة صحي، وقابلية البيع في مرحلة مبكرة.',
        'Best balance between Egypt premium positioning, healthy contribution, and early-stage sellability.',
        true
      )}
      ${optimizationCard(
        opt.stretch,
        'سعر بريميوم اختباري', 'Premium test price',
        'استخدمه فقط لو الخامة، الطباعة، المحتوى، والتجربة يبرروا سعر أعلى.',
        'Use only if fabric, print, content, and experience justify a higher price.'
      )}
    </div>
    <div class="optimization-note">
      <strong>${phrase(lang, 'اختبار حملات الشراء', 'Purchase campaign stress test')}:</strong>
      ${phrase(lang, 'إذا استخدمنا الحد الأدنى لـ Meta purchase CPA في مصر، فسعر الحفاظ على هامش صحي يقارب', 'If we use the low end of Egypt Meta purchase CPA, the price needed for a healthy margin is about')}
      <strong>${currency(opt.paidAcquisition.price)}</strong>.
      ${phrase(lang, 'لا تستخدمه كسعر رئيسي إلا بعد إثبات جودة الطلب والمرتجعات.', 'Do not use it as the main price unless order quality and returns are proven.')}
    </div>
    ${premiumWarning}`;
}

function runPriceOptimization() {
  priceOptimizationVisible = true;
  renderPriceOptimization();
  updateAssumptionStatus(phrase(lang, 'تم حساب الأسعار من الأرقام الحالية.', 'Prices calculated from current numbers.'));
}

function applyOptimizedPrice(price) {
  C.price = price;
  priceOptimizationVisible = true;
  handleAssumptionsChanged({
    rebuildEditors: true,
    message: phrase(lang, `تم اعتماد سعر ${currency(price)} وتحديث الحسابات.`, `Applied ${currency(price)} and updated calculations.`)
  });
}

loadStoredAssumptions();

// === LANGUAGE TOGGLE ===
function toggleLang() {
  lang = lang === 'en' ? 'ar' : 'en';
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-en]').forEach(el => {
    el.textContent = el.getAttribute('data-' + lang);
  });
  const bc = document.getElementById('briefContent');
  bc.classList.toggle('lang-en', lang === 'en');
  buildEditors();
  renderAll();
  if (priceOptimizationVisible) renderPriceOptimization();
}

// === TABS ===
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('tab-' + t.dataset.tab).classList.add('active');
  });
});

// === EDIT INPUTS ===
function makeInput(container, label, key, obj, suffix='') {
  const div = document.createElement('div');
  div.className = 'edit-row';
  div.innerHTML = `<label>${label}</label><input type="number" value="${obj[key]}" data-key="${key}" step="any">${suffix ? '<span style="color:var(--text2);font-size:.8rem;margin-left:8px">'+suffix+'</span>' : ''}`;
  div.querySelector('input').addEventListener('change', e => {
    obj[key] = parseFloat(e.target.value) || 0;
    handleAssumptionsChanged();
  });
  container.appendChild(div);
}

function buildEditors() {
  const u = document.getElementById('editUnitCosts');
  const v = document.getElementById('editVarCosts');
  const f = document.getElementById('editFixedCosts');
  const m = document.getElementById('editMonthlyCosts');
  const o = document.getElementById('editOther');
  [u,v,f,m,o].forEach(el => el.innerHTML = '');

  makeInput(u, tx('input.shirt'), 'shirt', C.cogs);
  makeInput(u, tx('input.markup'), 'markup', C.cogs);
  makeInput(u, tx('input.dtf'), 'dtf', C.cogs);
  makeInput(u, tx('input.pkg'), 'pkg', C.cogs);
  makeInput(u, tx('input.tags'), 'tags', C.cogs);

  makeInput(v, tx('input.cpa'), 'cpa', C.perUnit);
  makeInput(v, tx('input.subsidiary'), 'subsidiary', C.perUnit);
  makeInput(v, tx('input.platform'), 'platform', C.perUnit);
  makeInput(v, tx('input.tax'), 'tax', C.perUnit);

  makeInput(f, tx('input.brand'), 'brand', C.fixed);
  makeInput(f, tx('input.website'), 'website', C.fixed);
  makeInput(f, tx('input.shooting'), 'shooting', C.fixed);
  makeInput(f, tx('input.market'), 'market', C.fixed);
  makeInput(f, tx('input.contentStrat'), 'contentStrat', C.fixed);
  makeInput(f, tx('input.domain'), 'domain', C.fixed);
  makeInput(f, tx('input.press'), 'press', C.fixed);
  makeInput(f, tx('input.license'), 'license', C.fixed);

  makeInput(m, tx('input.content'), 'content', C.monthly);
  makeInput(m, tx('input.hosting'), 'hosting', C.monthly);
  makeInput(m, tx('input.design'), 'design', C.monthly);
  makeInput(m, tx('input.moderator'), 'moderator', C.monthly);
  makeInput(m, tx('input.operator'), 'operator', C.monthly);

  makeInput(o, tx('input.price'), 'price', C);
  makeInput(o, tx('input.partners'), 'partners', C);
  makeInput(o, tx('input.initProd'), 'initProd', C);
  makeInput(o, tx('input.optimisticShirt'), 'optimisticShirt', C);
  makeInput(o, tx('input.pilotUnits'), 'pilotUnits', C.scenario);
  makeInput(o, tx('input.pilotMonths'), 'pilotMonths', C.scenario);
  makeInput(o, tx('input.pilotMarkup'), 'pilotMarkup', C.scenario);
  makeInput(o, tx('input.profitTargetBase'), 'profitTargetBase', C.scenario);
  makeInput(o, tx('input.profitTargetUpside'), 'profitTargetUpside', C.scenario);
  makeInput(o, tx('input.operatorDelayMonths'), 'operatorDelayMonths', C.scenario);
  makeInput(o, tx('input.operatorProfitTrigger'), 'operatorProfitTrigger', C.scenario);
}

// === BRIEF TAB ===
function renderBrief() {
  const el = document.getElementById('briefContent');
  
  // Custom Pilot Variables based on user input
  const pilotUnits = Math.max(0, C.scenario.pilotUnits);
  const pilotMonths = Math.max(0, C.scenario.pilotMonths);
  const pilotMarkup = C.scenario.pilotMarkup;
  const leanUnits = Math.max(0, C.initProd);
  const baseTarget = Math.max(0, C.scenario.profitTargetBase);
  const upsideTarget = Math.max(0, C.scenario.profitTargetUpside);
  const operatorDelayMonths = Math.max(0, C.scenario.operatorDelayMonths);
  const pilotPhase = phaseName('Pilot', pilotUnits);
  const leanPhase = phaseName('Lean', leanUnits);
  const arPilotPhase = pilotPhase;
  const enPilotPhase = pilotPhase;
  const arLeanPhase = leanPhase;
  const enLeanPhase = leanPhase;
  const arPilotDuration = monthPhrase(pilotMonths, 'ar');
  const enPilotDuration = monthPhrase(pilotMonths, 'en');
  const arPilotUnits = unitPhrase(pilotUnits, 'ar');
  const enPilotUnits = unitPhrase(pilotUnits, 'en');
  const arLeanUnits = unitPhrase(leanUnits, 'ar');
  const enLeanUnits = unitPhrase(leanUnits, 'en');
  const arBaseTarget = unitPhrase(baseTarget, 'ar');
  const enBaseTarget = unitPhrase(baseTarget, 'en');
  const arUpsideTarget = unitPhrase(upsideTarget, 'ar');
  const enUpsideTarget = unitPhrase(upsideTarget, 'en');
  const arOperatorDelay = monthPhrase(operatorDelayMonths, 'ar');
  const enOperatorDelay = monthPhrase(operatorDelayMonths, 'en');
  const pilotCOGS = C.cogs.shirt + pilotMarkup + C.cogs.dtf + C.cogs.pkg + C.cogs.tags;
  const pilotMargin = C.price - pilotCOGS - D.totalVar;
  const pilotMonthly = D.testMonthly;
  const pilotBE = pilotMargin > 0 ? Math.ceil(pilotMonthly / pilotMargin) : Infinity;
  const pilotFixed = D.testFixed;
  const pilotProdCost = pilotUnits * pilotCOGS;
  const pilotFunding = pilotFixed + pilotProdCost;
  
  const pilotRevenue = pilotUnits * C.price;
  const pilotTotalCosts = (pilotUnits * pilotCOGS) + (pilotUnits * D.totalVar) + pilotFixed + (pilotMonthly * pilotMonths);
  const pilotNet = pilotRevenue - pilotTotalCosts;
  const isPilotLoss = pilotNet < 0;
  const pilotOutcomeVal = Math.abs(pilotNet);
  const pilotAvgMonthlyUnits = pilotMonths > 0 ? pilotUnits / pilotMonths : Infinity;

  const leanFixed = D.deferredFixed;
  const leanProdCost = leanUnits * D.totalCOGS;
  const leanFunding = leanFixed + leanProdCost;
  const totalPathFunding = pilotFunding + leanFunding;
  const perPartnerPath = totalPathFunding / C.partners;

  const capitalToRecover = leanFunding - pilotNet;
  const baseProfit = baseTarget * D.margin - D.growthMonthly;
  const upsideProfit = upsideTarget * D.margin - D.growthMonthly;
  const recBaseLean = capitalToRecover > 0 && baseProfit > 0 ? capitalToRecover / baseProfit : -1;
  const recUpsideLean = capitalToRecover > 0 && upsideProfit > 0 ? capitalToRecover / upsideProfit : -1;
  const arPilotBEPieces = formatUnits(pilotBE, 'ar');
  const enPilotBEPieces = formatUnits(pilotBE, 'en');
  const arGrowthBEPieces = formatUnits(D.growthBE, 'ar');
  const enGrowthBEPieces = formatUnits(D.growthBE, 'en');
  const arGrowthBEExplain = Number.isFinite(D.growthBE)
    ? `معنى ذلك ببساطة: حتى ${D.growthBE} قطعة نحن نغطي التشغيل. من القطعة ${D.growthBE + 1} وما بعدها يبدأ الربح الشهري الحقيقي.`
    : `<span class="bad">هامش المساهمة الحالي غير كاف لتغطية التشغيل، لذلك لا توجد نقطة تعادل حقيقية قبل تعديل السعر أو التكلفة.</span>`;
  const enGrowthBEExplain = Number.isFinite(D.growthBE)
    ? `Simply put: Up to ${D.growthBE} pieces we cover operations. From piece ${D.growthBE + 1} onward true monthly profit begins.`
    : `<span class="bad">The current contribution margin cannot cover operations, so there is no real breakeven before price or cost changes.</span>`;
  const arPilotMarginNote = pilotMargin <= 0
    ? `<span class="bad">هذا يعني أن كل قطعة في البايلوت تخسر قبل احتساب مصاريف التشغيل، لذلك يجب تعديل السعر أو تكلفة الإنتاج قبل الإطلاق.</span>`
    : pilotBE > pilotAvgMonthlyUnits
      ? `هذا الهامش لا يكفي لجعل البايلوت مربحاً عند متوسط بيع ${unitPhrase(Math.ceil(pilotAvgMonthlyUnits), 'ar')} شهرياً.`
      : `هذا الهامش يكفي لتغطية التشغيل الشهري إذا وصلنا إلى متوسط بيع البايلوت المخطط.`;
  const enPilotMarginNote = pilotMargin <= 0
    ? `<span class="bad">This means every pilot unit loses money before operating overhead, so price or production cost must change before launch.</span>`
    : pilotBE > pilotAvgMonthlyUnits
      ? `This margin is not enough to make the pilot profitable at the planned average of ${unitPhrase(Math.ceil(pilotAvgMonthlyUnits), 'en')} per month.`
      : `This margin can cover monthly operations if we hit the planned pilot sell-through pace.`;
  const arPilotBreakevenMeaning = pilotMargin <= 0
    ? `<span class="bad">لا توجد نقطة تعادل في البايلوت لأن هامش القطعة غير موجب.</span>`
    : pilotBE > pilotAvgMonthlyUnits
      ? `بما أننا نختبر ${arPilotUnits} على ${arPilotDuration}، فمتوسط البيع الشهري المخطط أقل من نقطة التعادل، لذلك البايلوت ليس مرحلة ربح في هذه الأرقام.`
      : `بما أننا نختبر ${arPilotUnits} على ${arPilotDuration}، فالمتوسط المخطط يمكنه تغطية التشغيل الشهري، لكن نتيجة البايلوت النهائية تعتمد على مصاريف التأسيس.`;
  const enPilotBreakevenMeaning = pilotMargin <= 0
    ? `<span class="bad">There is no pilot breakeven because unit contribution is not positive.</span>`
    : pilotBE > pilotAvgMonthlyUnits
      ? `Because we are testing ${enPilotUnits} over ${enPilotDuration}, the planned monthly average is below breakeven, so the pilot is not a profit phase under these numbers.`
      : `Because we are testing ${enPilotUnits} over ${enPilotDuration}, the planned average can cover monthly operations, while final pilot P&L still depends on setup costs.`;
  const arTransitionReason = D.margin > pilotMargin
    ? `في هذه المرحلة يعود هامش المصنع إلى ${currency(C.cogs.markup, 'ar')} بدلاً من ${currency(pilotMarkup, 'ar')} لأن حجم التشغيل أكبر، فيتحسن هامش القطعة.`
    : D.margin > 0
      ? `في هذه المرحلة نتحول إلى تشغيل منظم، لكن هامش القطعة لا يتحسن كثيراً بالأرقام الحالية، لذلك يجب مراقبة تكلفة الإنتاج وCPA.`
      : `<span class="bad">قبل الانتقال إلى ${arLeanPhase} يجب إصلاح هامش القطعة، لأن التشغيل الأكبر لن يحل نموذجاً يخسر في كل بيع.</span>`;
  const enTransitionReason = D.margin > pilotMargin
    ? `In this phase, factory markup drops to ${currency(C.cogs.markup, 'en')} from ${currency(pilotMarkup, 'en')} because volume is larger, improving unit margin.`
    : D.margin > 0
      ? `In this phase we move into organized operations, but unit margin does not improve much under current numbers, so production cost and CPA still need close control.`
      : `<span class="bad">Before moving into ${enLeanPhase}, unit margin must be fixed because larger volume will not solve a model that loses money on each sale.</span>`;
  const arLeanFundingLine = baseProfit > 0
    ? `${arLeanPhase} يمكن أن يبدأ في تمويل نفسه عند هدف ${arBaseTarget} شهرياً.`
    : upsideProfit > 0
      ? `${arLeanPhase} لا يمول نفسه جيداً عند ${arBaseTarget} شهرياً، لكنه يصبح قابلاً للتشغيل عند الاقتراب من ${arUpsideTarget} شهرياً.`
      : `<span class="bad">${arLeanPhase} لا يمول نفسه حتى عند ${arUpsideTarget} شهرياً، لذلك لا يجب التوسع قبل تعديل السعر أو التكلفة.</span>`;
  const enLeanFundingLine = baseProfit > 0
    ? `${enLeanPhase} can start funding itself at the ${enBaseTarget}/month target.`
    : upsideProfit > 0
      ? `${enLeanPhase} does not self-fund well at ${enBaseTarget}/month, but becomes workable near ${enUpsideTarget}/month.`
      : `<span class="bad">${enLeanPhase} does not self-fund even at ${enUpsideTarget}/month, so scaling should wait for a price or cost fix.</span>`;
  const arPriceRead = C.price < C.benchmarks.pricePremiumMin
    ? `<span class="warn">سعر ${currency(C.price, 'ar')} أقل من نطاق البريميوم المحدد في افتراضات السوق، وقد يضغط الهامش.</span>`
    : C.price <= C.benchmarks.pricePremiumMax
      ? `سعر ${currency(C.price, 'ar')} مناسب لنطاق البريميوم إذا حافظنا على الخامة والطباعة والتجربة.`
      : `<span class="warn">سعر ${currency(C.price, 'ar')} أعلى من نطاق البريميوم المحدد في افتراضات السوق، ويحتاج إثبات قيمة أقوى.</span>`;
  const enPriceRead = C.price < C.benchmarks.pricePremiumMin
    ? `<span class="warn">${currency(C.price, 'en')} is below the premium benchmark range and may pressure margin.</span>`
    : C.price <= C.benchmarks.pricePremiumMax
      ? `${currency(C.price, 'en')} fits the premium benchmark range if fabric, print quality, and buying experience stay strong.`
      : `<span class="warn">${currency(C.price, 'en')} is above the premium benchmark range and needs stronger value proof.</span>`;
  const marketing = marketingBenchmark();
  const egyptRetailHighBaseProfit = baseTarget * marketing.egyptRetailHighMargin - D.growthMonthly;
  const egyptMetaLowBaseProfit = baseTarget * marketing.egyptMetaPurchaseLowMargin - D.growthMonthly;
  const egyptMetaHighBaseProfit = baseTarget * marketing.egyptMetaPurchaseHighMargin - D.growthMonthly;
  const arMarketingBenchmarkRead = `
<div class="warn-box">
  <h3>قراءة التسويق حسب بنشمارك مصر</h3>
  <ul>
    <li>${cpaBlendStatus('ar')} هذا يعني أن ${currency(C.perUnit.cpa, 'ar')} مناسب كـ <strong>CPA محلي للتجزئة / blended CPA</strong> من أورجانيك، creators، referrals، retargeting، وemail/WhatsApp.</li>
    <li>${cpaPaidStatus('ar')}</li>
    <li>كل أرقام CPC هنا بالجنيه المصري: Meta في مصر ${currencyRange(C.benchmarks.egyptMetaCpcMin, C.benchmarks.egyptMetaCpcMax, 'ar')} للنقرة، وأزياء Meta حوالي ${currency(marketing.clickCost, 'ar')}، وGoogle Search في مصر ${currencyRange(C.benchmarks.egyptGoogleSearchCpcMin, C.benchmarks.egyptGoogleSearchCpcMax, 'ar')} للنقرة.</li>
    <li>بنشمارك التجارة الإلكترونية في مصر: CVR ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)}، add-to-cart ${pctText(C.benchmarks.egyptAddToCartPct, 1)}، cart abandonment ${pctText(C.benchmarks.cartAbandonmentAvgPct, 1)}، وreturn rate ${pctText(C.benchmarks.egyptReturnPct, 1)}.</li>
    <li>إذا ارتفع CPA إلى أعلى نطاق التجزئة المحلي (${currency(marketing.egyptRetailCpaHigh, 'ar')}) يصبح هامش القطعة حوالي ${currency(marketing.egyptRetailHighMargin, 'ar')}، وعند ${arBaseTarget} شهرياً تكون النتيجة ${signedPL(egyptRetailHighBaseProfit, { activeLang: 'ar' })}.</li>
    <li>إذا اعتمدنا على Meta purchase في مصر، فالمدى ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh, 'ar')}: عند الحد الأدنى يصبح هامش القطعة ${signedPL(marketing.egyptMetaPurchaseLowMargin, { activeLang: 'ar' })}، وعند الحد الأعلى يصبح ${signedPL(marketing.egyptMetaPurchaseHighMargin, { activeLang: 'ar' })}. عند ${arBaseTarget} شهرياً النتيجة تتراوح من ${signedPL(egyptMetaLowBaseProfit, { activeLang: 'ar' })} إلى ${signedPL(egyptMetaHighBaseProfit, { activeLang: 'ar' })}.</li>
  </ul>
</div>`;
  const enMarketingBenchmarkRead = `
<div class="warn-box">
  <h3>Egypt Marketing Benchmark Read</h3>
  <ul>
    <li>${cpaBlendStatus('en')} This means ${currency(C.perUnit.cpa, 'en')} works as a <strong>local retail / blended CPA</strong> from organic, creators, referrals, retargeting, and email/WhatsApp.</li>
    <li>${cpaPaidStatus('en')}</li>
    <li>All CPC numbers here are Egyptian pounds: Meta in Egypt is ${currencyRange(C.benchmarks.egyptMetaCpcMin, C.benchmarks.egyptMetaCpcMax, 'en')} per click, Meta fashion is about ${currency(marketing.clickCost, 'en')}, and Google Search in Egypt is ${currencyRange(C.benchmarks.egyptGoogleSearchCpcMin, C.benchmarks.egyptGoogleSearchCpcMax, 'en')} per click.</li>
    <li>Egypt e-commerce benchmark: CVR ${pctText(C.benchmarks.egyptEcommerceCvrPct, 1)}, add-to-cart ${pctText(C.benchmarks.egyptAddToCartPct, 1)}, cart abandonment ${pctText(C.benchmarks.cartAbandonmentAvgPct, 1)}, and return rate ${pctText(C.benchmarks.egyptReturnPct, 1)}.</li>
    <li>If CPA rises to the top of the local retail range (${currency(marketing.egyptRetailCpaHigh, 'en')}), unit contribution becomes about ${currency(marketing.egyptRetailHighMargin, 'en')}, and at ${enBaseTarget}/month the result is ${signedPL(egyptRetailHighBaseProfit, { activeLang: 'en' })}.</li>
    <li>If we rely on Egypt Meta purchase campaigns, the range is ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh, 'en')}: at the low end unit contribution becomes ${signedPL(marketing.egyptMetaPurchaseLowMargin, { activeLang: 'en' })}, and at the high end it becomes ${signedPL(marketing.egyptMetaPurchaseHighMargin, { activeLang: 'en' })}. At ${enBaseTarget}/month the result ranges from ${signedPL(egyptMetaLowBaseProfit, { activeLang: 'en' })} to ${signedPL(egyptMetaHighBaseProfit, { activeLang: 'en' })}.</li>
  </ul>
</div>`;
  const arPartnerCpaNote = `الـ CPA = ${fmt(C.perUnit.cpa)} جنيه (${pctText(marketing.cpaRevenuePct, 1)} من السعر) داخل نطاق CPA التجزئة في مصر ${currencyRange(marketing.egyptRetailCpaLow, marketing.egyptRetailCpaHigh, 'ar')}، لكنه أقل من نطاق Meta purchase المصري ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh, 'ar')}. أي حملة paid يجب أن تثبت أنها لا تتجاوز سقف الربحية ${currency(marketing.maxAffordableCpa, 'ar')}.`;
  const enPartnerCpaNote = `CPA = ${fmt(C.perUnit.cpa)} EGP (${pctText(marketing.cpaRevenuePct, 1)} of price) is inside Egypt retail CPA range ${currencyRange(marketing.egyptRetailCpaLow, marketing.egyptRetailCpaHigh, 'en')}, but below Egypt Meta purchase range ${currencyRange(marketing.egyptMetaPurchaseCpaLow, marketing.egyptMetaPurchaseCpaHigh, 'en')}. Any paid campaign must prove it stays below the profitability cap of ${currency(marketing.maxAffordableCpa, 'en')}.`;

  // ARABIC VARIABLES
  let arPilotOutcomeDesc = isPilotLoss 
    ? `<strong>بعجز (خسارة) تقريبي <span class="num">${fmt(pilotOutcomeVal)}</span> جنيه</strong>.</p><p>هذا العجز ليس معناه أن المشروع فشل. هذا العجز هو ببساطة: تكلفة دخول السوق، تكلفة بناء أول صورة للبراند، وتكلفة معرفة هل الأرقام حقيقية أم لا.</p><p>والأهم: هذه الخسارة لا تُغلق عليها المرحلة، بل تُرحّل إلى ${arLeanPhase}.`
    : `<strong>بربح تقريبي <span class="num">${fmt(pilotOutcomeVal)}</span> جنيه</strong>.</p><p>هذا إنجاز ممتاز في مرحلة البايلوت، حيث غطت المبيعات كافة مصاريف التأسيس والتشغيل الأولية.</p><p>هذا الربح سيساعد في تمويل جزء من مرحلة ${arLeanPhase}.`;

  let arProfitBaseDesc = monthlyPLSentence(baseProfit, 'ar');
  let arProfitUpsideDesc = monthlyPLSentence(upsideProfit, 'ar');
  
  let arRecoveryPilotDesc = isPilotLoss 
    ? `مرحلة البايلوت ستنتهي بعجز مرحّل حوالي ${fmt(pilotOutcomeVal)} جنيه. هذا العجز يدخل معنا إلى ${arLeanPhase}، لذلك لا نبدأ من صفر، بل نبدأ ونحن نحمل تكلفة ${arPilotDuration}.`
    : `مرحلة البايلوت حققت أرباحاً بحوالي ${fmt(pilotOutcomeVal)} جنيه، مما يقلل من حجم التمويل المطلوب لاسترداد كامل مسار المشروع.`;

  let arRecBaseDesc = recBaseLean > 0 
    ? `واسترداد المسار الكامل سيأخذ تقريباً <span class="num">${fmtD(recBaseLean)}</span> شهر من بداية ${arLeanPhase} (أو حوالي ${fmtD(recBaseLean + pilotMonths)} شهر من بداية المشروع كله).`
    : (baseProfit <= 0 ? `<span class="bad">المشروع سيستمر في تحقيق خسائر شهرية ولن يسترد رأس المال بهذا الحجم من المبيعات. نحتاج إلى تقليل التكاليف أو رفع السعر.</span>` : `تم استرداد رأس المال بالكامل.`);

  let arRecUpsideDesc = recUpsideLean > 0 
    ? `واسترداد المسار الكامل سيأخذ تقريباً <span class="num">${fmtD(recUpsideLean)}</span> شهر من بداية ${arLeanPhase} (أو حوالي ${fmtD(recUpsideLean + pilotMonths)} شهر من بداية المشروع كله).`
    : (upsideProfit <= 0 ? `<span class="bad">المشروع سيستمر في تحقيق خسائر شهرية ولن يسترد رأس المال بهذا الحجم من المبيعات. نحتاج إلى تدخل قوي في التكاليف.</span>` : `تم استرداد رأس المال بالكامل.`);

  let arConclusion = (baseProfit > 0 || upsideProfit > 0) 
    ? `${arPilotPhase} مرحلة إثبات أكثر من كونها مرحلة ربح. ${arLeanPhase} هو أول تشغيل حقيقي يمكن أن يبدأ في صنع ربح مستقر إذا وصلنا إلى هدف مبيعات مربح.<br>أفضل منطق مالي لـ HORO هو البدء بـ ${arPilotUnits} للاختبار، ثم الانتقال إلى ${arLeanUnits} بعد ظهور إشارات نجاح.`
    : `<span class="bad">تحذير: الأرقام الحالية تشير إلى نموذج غير مربح حتى في مرحلة ${arLeanPhase}. يرجى مراجعة هيكل التكاليف أو السعر قبل اتخاذ قرار التوسع.</span>`;

  // ENGLISH VARIABLES
  let enPilotOutcomeDesc = isPilotLoss 
    ? `<strong>an estimated deficit of <span class="num">${fmt(pilotOutcomeVal)}</span> EGP</strong>.</p><p>This deficit does not mean the project failed. It represents the cost of market entry and validation.</p><p>This loss rolls over into ${enLeanPhase}.`
    : `<strong>an estimated profit of <span class="num">${fmt(pilotOutcomeVal)}</span> EGP</strong>.</p><p>This is an excellent achievement, meaning the pilot fully covered its setup and operational costs.</p><p>This profit will help fund the ${enLeanPhase} phase.`;

  let enProfitBaseDesc = monthlyPLSentence(baseProfit, 'en');
  let enProfitUpsideDesc = monthlyPLSentence(upsideProfit, 'en');
  
  let enRecoveryPilotDesc = isPilotLoss 
    ? `The pilot phase ends with a rolled-over deficit of approx. ${fmt(pilotOutcomeVal)} EGP, which is carried into ${enLeanPhase}.`
    : `The pilot phase generated a profit of approx. ${fmt(pilotOutcomeVal)} EGP, reducing the total capital needing recovery.`;

  let enRecBaseDesc = recBaseLean > 0 
    ? `Full path recovery takes approx. <span class="num">${fmtD(recBaseLean)}</span> months from ${enLeanPhase} start (or approx. ${fmtD(recBaseLean + pilotMonths)} months from day one).`
    : (baseProfit <= 0 ? `<span class="bad">The project will continuously lose money and will not recover capital at this sales volume. Costs or price must be adjusted.</span>` : `Capital is fully recovered.`);

  let enRecUpsideDesc = recUpsideLean > 0 
    ? `Full path recovery takes approx. <span class="num">${fmtD(recUpsideLean)}</span> months from ${enLeanPhase} start (or approx. ${fmtD(recUpsideLean + pilotMonths)} months from day one).`
    : (upsideProfit <= 0 ? `<span class="bad">The project will continuously lose money and will not recover capital at this sales volume. Costs or price must be adjusted.</span>` : `Capital is fully recovered.`);

  let enConclusion = (baseProfit > 0 || upsideProfit > 0) 
    ? `${enPilotPhase} is mainly for validation. ${enLeanPhase} is the first real operating phase that can generate stable profit if sales reach a profitable target.<br>The best logic is to start with ${enPilotUnits}, then move to ${enLeanUnits} after clear success signals.`
    : `<span class="bad">WARNING: Current numbers indicate an unprofitable model even at the ${enLeanPhase} stage. Review cost structure or price before scaling.</span>`;

  if (lang === 'ar') {
    el.innerHTML = `
<h2>🚀 سيناريو المرحلة الأولى: ${arPilotPhase}</h2>
<h3>اقتصاديات القطعة الواحدة في مرحلة الاختبار</h3>
<ul>
  <li>سعر البيع: <span class="num">${fmt(C.price)}</span> جنيه.</li>
  <li>تكلفة الإنتاج المباشرة للقطعة (COGS): <span class="num">${fmtD(pilotCOGS)}</span> جنيه.
    <br>تفاصيلها: التيشيرت السادة: ${fmtD(C.cogs.shirt)} | هامش المصنع في البايلوت: ${fmt(pilotMarkup)} | الطباعة: ${fmt(C.cogs.dtf)} | التغليف: ${fmt(C.cogs.pkg)} | الليبل والتاج: ${fmt(C.cogs.tags)}</li>
  <li>التكاليف المتغيرة البيعية للقطعة: <span class="num">${fmtD(D.totalVar)}</span> جنيه تقريباً.
    <br>تفاصيلها: CPA: ${fmt(C.perUnit.cpa)} | دعم الشحن والمرتجعات: ${fmt(C.perUnit.subsidiary)} | عمولة المنصة وبوابات الدفع: ${fmt(C.perUnit.platform)} | ضرائب ومصاريف أخرى: ${fmtD(C.perUnit.tax)}</li>
  <li><strong>صافي ما يتبقى من كل تيشيرت بعد خصم التكلفة المباشرة والمتغيرة: حوالي <span class="num">${fmtD(pilotMargin)}</span> جنيه فقط.</strong>
    <br><span style="color:var(--text2);font-size:0.85rem">${arPilotMarginNote}</span></li>
</ul>

<h3>مصاريف التشغيل خلال ${arPilotDuration}</h3>
<p>في مرحلة ${arPilotPhase}، الموقع الإلكتروني يدخل من البداية حتى نقيس الطلب على تجربة شراء حقيقية. الذي لن ندفعه بعد: التراخيص وتأسيس الشركة، مكبس الطباعة، الموديريتور، الأوبريتور.</p>
<ul>
  <li>لذلك، المصاريف الثابتة الشهرية في البايلوت ستكون فقط:
    إدارة محتوى (${fmt(C.monthly.content)}) + تصميمات (${fmt(C.monthly.design)}) + استضافة وتشغيل الموقع (${fmt(C.monthly.hosting)}) = <span class="num">${fmt(pilotMonthly)}</span> جنيه.</li>
</ul>

<h3>نقطة التعادل في البايلوت</h3>
<ul>
  <li>لكي نغطي فقط مصاريف التشغيل الشهرية في هذه المرحلة، نحتاج إلى بيع حوالي <span class="num">${arPilotBEPieces}</span> شهرياً.</li>
  <li>${arPilotBreakevenMeaning}</li>
</ul>

<h3>تكلفة إطلاق البايلوت</h3>
<ul>
  <li>مصاريف التأسيس التي سندفعها في هذه المرحلة فقط: <span class="num">${fmt(pilotFixed)}</span> جنيه.
    <br>تفاصيلها: تصميم البراند واللوجو (${fmt(C.fixed.brand)}) | الموقع الإلكتروني (${fmt(C.fixed.website)}) | جلسة التصوير (${fmt(C.fixed.shooting)}) | اختبار السوق (${fmt(C.fixed.market)}) | استراتيجية المحتوى (${fmt(C.fixed.contentStrat)}) | الدومين (${fmt(C.fixed.domain)})</li>
  <li>تكلفة إنتاج ${arPilotUnits}: <span class="num">${fmt(pilotProdCost)}</span> جنيه.</li>
  <li>إذن، <strong>إجمالي التمويل المطلوب لبدء البايلوت فعلياً: حوالي <span class="num">${fmt(pilotFunding)}</span> جنيه</strong>.</li>
</ul>

<div class="warn-box">
  <h3>نتيجة البايلوت المتوقعة</h3>
  <p>إذا تم بيع ${arPilotUnits} خلال ${arPilotDuration} وفق السيناريو الحالي، فالمشروع سيخرج من مرحلة البايلوت ${arPilotOutcomeDesc}</p>
</div>

<h2>🏢 سيناريو المرحلة الثانية: ${arLeanPhase}</h2>
<p><strong>لماذا ننتقل إلى ${arLeanPhase} بعد البايلوت؟</strong> لأن البايلوت هدفه تقليل عدم اليقين، وليس تحقيق ربح. بعد ما نختبر السوق ونفهم الإعلانات والتصاميم والمقاسات والمرتجعات، ندخل على تشغيل ${arLeanUnits} بأرقام أوضح من أول يوم. ${arTransitionReason}</p>

<h3>اقتصاديات القطعة الواحدة في ${arLeanPhase}</h3>
<ul>
  <li>سعر البيع: <span class="num">${fmt(C.price)}</span> جنيه.</li>
  <li>تكلفة الإنتاج المباشرة (COGS): <span class="num">${fmtD(D.totalCOGS)}</span> جنيه.
    <br>تفاصيلها: التيشيرت السادة: ${fmtD(C.cogs.shirt)} | هامش المصنع: ${fmt(C.cogs.markup)} | الطباعة: ${fmt(C.cogs.dtf)} | التغليف: ${fmt(C.cogs.pkg)} | الليبل والتاج: ${fmt(C.cogs.tags)}</li>
  <li>التكاليف المتغيرة البيعية: <span class="num">${fmtD(D.totalVar)}</span> جنيه تقريباً.</li>
  <li><strong>هامش المساهمة الصافي لكل قطعة: حوالي <span class="num">${fmtD(D.margin)}</span> جنيه.</strong> (هذا هو الرقم الذي نعتمد عليه لتغطية التشغيل وتحقيق الربح).</li>
</ul>

<h3>مصاريف التشغيل الشهرية في ${arLeanPhase}</h3>
<ul>
  <li>في هذه المرحلة سندخل بتشغيل أخف لكن منظم: إدارة محتوى (${fmt(C.monthly.content)}) + تصميمات (${fmt(C.monthly.design)}) + موديريتور (${fmt(C.monthly.moderator)}) + استضافة وتشغيل الموقع (${fmt(C.monthly.hosting)}) = <span class="num">${fmt(D.growthMonthly)}</span> جنيه.</li>
</ul>

<h3>نقطة التعادل الشهرية في ${arLeanPhase}</h3>
<ul>
  <li>لكي نغطي هذه المصاريف بالكامل، نحتاج إلى بيع حوالي <span class="num">${arGrowthBEPieces}</span> شهرياً.</li>
  <li>${arGrowthBEExplain}</li>
</ul>

<h3>الربح الشهري المتوقع في ${arLeanPhase}</h3>
<ul>
  <li>إذا وصلنا إلى ${arBaseTarget} شهرياً: ${arProfitBaseDesc}</li>
  <li>إذا وصلنا إلى ${arUpsideTarget} شهرياً: ${arProfitUpsideDesc}</li>
  <li>${arLeanFundingLine}</li>
</ul>

${arMarketingBenchmarkRead}

<h2>💰 ما الذي سندفعه عند الانتقال من البايلوت إلى ${arLeanPhase}؟</h2>
<div class="highlight-box">
  <ul>
    <li>عند الانتقال للمرحلة الثانية، هناك مصاريف مؤجلة سندفعها وقتها: التراخيص وتأسيس الشركة (${fmt(C.fixed.license)}) + مكبس الطباعة (${fmt(C.fixed.press)}) + تكلفة إنتاج ${arLeanUnits} (${fmt(leanProdCost)}).</li>
    <li>إذن، <strong>التمويل الإضافي المطلوب عند بدء ${arLeanPhase}: حوالي <span class="num">${fmt(leanFunding)}</span> جنيه</strong>.</li>
  </ul>
  <h3>إجمالي الصورة المالية على مرحلتين</h3>
  <ul>
    <li>${arPilotPhase} في البداية: <span class="num">${fmt(pilotFunding)}</span> جنيه.</li>
    <li>ثم ${arLeanPhase} بعد نجاح الاختبار: <span class="num">${fmt(leanFunding)}</span> جنيه.</li>
    <li>إجمالي المسار الكامل: حوالي <span class="num">${fmt(totalPathFunding)}</span> جنيه.</li>
    <li>ولو نحن ${C.partners} شركاء، <strong>حصة الشريك الواحدة تقريباً: <span class="num">${fmt(perPartnerPath)}</span> جنيه</strong>.</li>
  </ul>
</div>

<h3>متى نسترد أموالنا؟</h3>
<p>${arRecoveryPilotDesc}</p>
<ul>
  <li><strong>إذا استقررنا بعد ذلك على بيع ${arBaseTarget} شهرياً:</strong> ${arRecBaseDesc}</li>
  <li><strong>إذا وصلنا إلى ${arUpsideTarget} شهرياً:</strong> ${arRecUpsideDesc}</li>
</ul>

<h2>🎯 لماذا هذا المسار منطقي؟</h2>
<ul>
  <li>لأنه يقلل المخاطرة: نختبر أولاً، ثم نكبر.</li>
  <li>لأنه لا يحمّل الشركة كل المصاريف من أول يوم: الموقع يدخل في الاختبار، لكن التأسيس القانوني والمكبس يبقيان مؤجلين حتى نرى استجابة السوق.</li>
  <li>لأنه يجعل الـ CPA الحقيقي والمرتجعات وسلوك العملاء والتصاميم الناجحة مبنية على بيانات فعلية وليس توقعات.</li>
  <li>لأنه يوضح للشركاء أن مدة ${arPilotDuration} هي مرحلة اختبار محسوبة، وليست معياراً نهائياً على نجاح أو فشل البراند.</li>
</ul>

<div class="highlight-box">
  <h3>نقاط مهمة جداً للشركاء</h3>
  <ul>
    <li>${arPilotUnits} و${arLeanUnits} هي أصول ومخزون يُباع وليست مصاريف ضائعة.</li>
    <li>${arPartnerCpaNote}</li>
    <li>${arPriceRead}</li>
    <li>تأجيل الأوبريتور لمدة ${arOperatorDelay} قرار منطقي إذا لم تكن المبيعات مستقرة، لأن إضافته مبكراً سترفع المصاريف الثابتة من ${fmt(D.growthMonthly)} إلى ${fmt(D.fullMonthly)} جنيه وترفع نقطة التعادل من ${formatUnits(D.growthBE, 'ar')} إلى ${formatUnits(D.fullBE, 'ar')} شهرياً.</li>
  </ul>
</div>

<div class="warn-box">
  <h3>الخلاصة</h3>
  <p>${arConclusion}</p>
</div>
`;
  } else {
    el.innerHTML = `
<h2>🚀 Stage One Scenario: ${enPilotPhase}</h2>
<h3>Unit Economics in the Testing Phase</h3>
<ul>
  <li>Retail Price: <span class="num">${fmt(C.price)}</span> EGP.</li>
  <li>Direct Production Cost (COGS): <span class="num">${fmtD(pilotCOGS)}</span> EGP.
    <br>Breakdown: Blank T-shirt: ${fmtD(C.cogs.shirt)} | Pilot Factory Margin: ${fmt(pilotMarkup)} | Printing: ${fmt(C.cogs.dtf)} | Packaging: ${fmt(C.cogs.pkg)} | Labels/Tags: ${fmt(C.cogs.tags)}</li>
  <li>Variable Selling Costs: <span class="num">${fmtD(D.totalVar)}</span> EGP.
    <br>Breakdown: CPA: ${fmt(C.perUnit.cpa)} | Shipping Support/Returns: ${fmt(C.perUnit.subsidiary)} | Platform/Gateway Fees: ${fmt(C.perUnit.platform)} | Taxes/Other: ${fmtD(C.perUnit.tax)}</li>
  <li><strong>Net contribution per T-shirt after direct and variable costs: Approx. <span class="num">${fmtD(pilotMargin)}</span> EGP.</strong>
    <br><span style="color:var(--text2);font-size:0.85rem">${enPilotMarginNote}</span></li>
</ul>

<h3>Operating Expenses During ${enPilotDuration}</h3>
<p>In the ${enPilotPhase} phase, the website is paid from day one so demand is measured on a real purchase experience. We will still defer: Licensing & Company Incorporation, Printing Press, Moderator, Operator.</p>
<ul>
  <li>Therefore, monthly fixed expenses during the pilot will only be:
    Content Management (${fmt(C.monthly.content)}) + Designs (${fmt(C.monthly.design)}) + Website Hosting (${fmt(C.monthly.hosting)}) = <span class="num">${fmt(pilotMonthly)}</span> EGP.</li>
</ul>

<h3>Breakeven in the Pilot</h3>
<ul>
  <li>To simply cover monthly operating expenses in this phase, we need to sell about <span class="num">${enPilotBEPieces}</span> per month.</li>
  <li>${enPilotBreakevenMeaning}</li>
</ul>

<h3>Cost of Launching the Pilot</h3>
<ul>
  <li>Setup expenses paid in this phase only: <span class="num">${fmt(pilotFixed)}</span> EGP.
    <br>Breakdown: Brand & Logo (${fmt(C.fixed.brand)}) | Website (${fmt(C.fixed.website)}) | Photoshoot (${fmt(C.fixed.shooting)}) | Market Test (${fmt(C.fixed.market)}) | Content Strategy (${fmt(C.fixed.contentStrat)}) | Domain (${fmt(C.fixed.domain)})</li>
  <li>Cost to produce ${enPilotUnits}: <span class="num">${fmt(pilotProdCost)}</span> EGP.</li>
  <li>So, <strong>Total funding required to launch the pilot: Approx. <span class="num">${fmt(pilotFunding)}</span> EGP</strong>.</li>
</ul>

<div class="warn-box">
  <h3>Expected Pilot Outcome</h3>
  <p>If all ${enPilotUnits} are sold within ${enPilotDuration} under current assumptions, the project will exit the pilot phase with ${enPilotOutcomeDesc}</p>
</div>

<h2>🏢 Stage Two Scenario: ${enLeanPhase}</h2>
<p><strong>Why transition to ${enLeanPhase} after the Pilot?</strong> The pilot's goal is to reduce uncertainty, not to generate profit. After testing the market and understanding actual ads, designs, sizing, and returns, we enter a ${enLeanUnits} production run with clearer numbers. ${enTransitionReason}</p>

<h3>Unit Economics in ${enLeanPhase}</h3>
<ul>
  <li>Retail Price: <span class="num">${fmt(C.price)}</span> EGP.</li>
  <li>Direct Production Cost (COGS): <span class="num">${fmtD(D.totalCOGS)}</span> EGP.
    <br>Breakdown: Blank T-shirt: ${fmtD(C.cogs.shirt)} | Factory Margin: ${fmt(C.cogs.markup)} | Printing: ${fmt(C.cogs.dtf)} | Packaging: ${fmt(C.cogs.pkg)} | Labels/Tags: ${fmt(C.cogs.tags)}</li>
  <li>Variable Selling Costs: <span class="num">${fmtD(D.totalVar)}</span> EGP.</li>
  <li><strong>Net Contribution Margin per piece: Approx. <span class="num">${fmtD(D.margin)}</span> EGP.</strong> (This is the number we rely on to cover operations and generate profit).</li>
</ul>

<h3>Monthly Operating Expenses in ${enLeanPhase}</h3>
<ul>
  <li>We operate leanly but systematically: Content (${fmt(C.monthly.content)}) + Designs (${fmt(C.monthly.design)}) + Moderator (${fmt(C.monthly.moderator)}) + Hosting (${fmt(C.monthly.hosting)}) = <span class="num">${fmt(D.growthMonthly)}</span> EGP.</li>
</ul>

<h3>Monthly Breakeven in ${enLeanPhase}</h3>
<ul>
  <li>To fully cover these expenses, we need to sell about <span class="num">${enGrowthBEPieces}</span> per month.</li>
  <li>${enGrowthBEExplain}</li>
</ul>

<h3>Expected Monthly Profit in ${enLeanPhase}</h3>
<ul>
  <li>If we reach ${enBaseTarget} per month: ${enProfitBaseDesc}</li>
  <li>If we reach ${enUpsideTarget} per month: ${enProfitUpsideDesc}</li>
  <li>${enLeanFundingLine}</li>
</ul>

${enMarketingBenchmarkRead}

<h2>💰 What Do We Pay When Moving From Pilot to ${enLeanPhase}?</h2>
<div class="highlight-box">
  <ul>
    <li>Deferred expenses are paid now: Licensing/Incorporation (${fmt(C.fixed.license)}) + Printing Press (${fmt(C.fixed.press)}) + Production of ${enLeanUnits} (${fmt(leanProdCost)}).</li>
    <li>Thus, <strong>Additional funding for ${enLeanPhase} start: Approx. <span class="num">${fmt(leanFunding)}</span> EGP</strong>.</li>
  </ul>
  <h3>Total Financial Picture Across Both Stages</h3>
  <ul>
    <li>Initial ${enPilotPhase}: <span class="num">${fmt(pilotFunding)}</span> EGP.</li>
    <li>Then ${enLeanPhase} after success: <span class="num">${fmt(leanFunding)}</span> EGP.</li>
    <li>Total full-path cost: Approx. <span class="num">${fmt(totalPathFunding)}</span> EGP.</li>
    <li>For ${C.partners} partners, <strong>Per-Partner Share: Approx. <span class="num">${fmt(perPartnerPath)}</span> EGP</strong>.</li>
  </ul>
</div>

<h3>When Do We Recover Our Money?</h3>
<p>${enRecoveryPilotDesc}</p>
<ul>
  <li><strong>If we stabilize at ${enBaseTarget}/month:</strong> ${enRecBaseDesc}</li>
  <li><strong>If we reach ${enUpsideTarget}/month:</strong> ${enRecUpsideDesc}</li>
</ul>

<h2>🎯 Why Is This Path Logical?</h2>
<ul>
  <li>Reduces Risk: We test first, then scale. We don't burden the company with full expenses from day one.</li>
  <li>Prevents us from carrying every cost from day one: the website is included in the test, while legal incorporation and the printing press remain deferred until the market responds.</li>
  <li>Ensures the actual CPA, returns, customer behavior, and successful designs are based on real data, not projections.</li>
  <li>Clarifies to partners that ${enPilotDuration} is a calculated testing phase, not a final judgement on the brand's success.</li>
</ul>

<div class="highlight-box">
  <h3>Crucial Notes for Partners</h3>
  <ul>
    <li>The ${enPilotUnits} and ${enLeanUnits} are assets and sellable inventory, not sunk costs.</li>
    <li>${enPartnerCpaNote}</li>
    <li>${enPriceRead}</li>
    <li>Deferring the Operator for ${enOperatorDelay} is logical while sales are not stable, as adding it early raises fixed expenses from ${fmt(D.growthMonthly)} to ${fmt(D.fullMonthly)} EGP and raises breakeven from ${formatUnits(D.growthBE, 'en')} to ${formatUnits(D.fullBE, 'en')} per month.</li>
  </ul>
</div>

<div class="warn-box">
  <h3>Summary</h3>
  <p>${enConclusion}</p>
</div>
`;
  }
}
