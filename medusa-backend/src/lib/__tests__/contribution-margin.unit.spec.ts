import { calculateContributionMargin } from "../contribution-margin"

// Set env defaults so tests don't get "missing_cost_data" warnings
beforeAll(() => {
  process.env.HORO_DEFAULT_BLANK_COST_EGP = "0"
  process.env.HORO_DEFAULT_PRINT_COST_EGP = "0"
  process.env.HORO_DEFAULT_PACKAGING_COST_EGP = "0"
  process.env.HORO_DEFAULT_SHIPPING_SUBSIDY_EGP = "0"
  process.env.HORO_DEFAULT_PAYMENT_FEE_EGP = "0"
  process.env.HORO_DEFAULT_ESTIMATED_CPA_EGP = "0"
  process.env.HORO_DEFAULT_RTO_ALLOWANCE_EGP = "0"
})

describe("calculateContributionMargin", () => {
  it("calculates margin with order-level metadata", () => {
    const order = {
      items: [
        {
          quantity: 1,
          product: { metadata: { blankCostEgp: 100, printCostEgp: 50 } },
        },
      ],
      metadata: {
        sellingPriceEgp: 500,
        packagingCostEgp: 20,
        shippingSubsidyEgp: 30,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 25,
        rtoAllowanceEgp: 10,
      },
    }
    const result = calculateContributionMargin(order)
    // 500 - 100 - 50 - 20 - 30 - 15 - 25 - 10 = 250
    expect(result.contributionMarginEgp).toBe(250)
    expect(result.warnings).toEqual([])
  })

  it("falls back to order total when sellingPriceEgp missing", () => {
    const order = {
      total: 400,
      items: [
        {
          quantity: 1,
          product: { metadata: { blankCostEgp: 100, printCostEgp: 50 } },
        },
      ],
      metadata: {
        packagingCostEgp: 20,
        shippingSubsidyEgp: 30,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 25,
        rtoAllowanceEgp: 10,
      },
    }
    const result = calculateContributionMargin(order)
    expect(result.contributionMarginEgp).toBe(150)
  })

  it("adds missing_cost_data warning when costs are absent and no env fallback", () => {
    delete process.env.HORO_DEFAULT_BLANK_COST_EGP
    delete process.env.HORO_DEFAULT_PRINT_COST_EGP
    const order = {
      total: 400,
      metadata: {},
    }
    const result = calculateContributionMargin(order)
    expect(result.warnings).toContain("missing_cost_data")
    // Restore for other tests
    process.env.HORO_DEFAULT_BLANK_COST_EGP = "0"
    process.env.HORO_DEFAULT_PRINT_COST_EGP = "0"
  })

  it("adds negative_margin warning when margin < 0", () => {
    const order = {
      items: [
        {
          quantity: 1,
          product: { metadata: { blankCostEgp: 200, printCostEgp: 50 } },
        },
      ],
      metadata: {
        sellingPriceEgp: 100,
        packagingCostEgp: 20,
        shippingSubsidyEgp: 30,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 25,
        rtoAllowanceEgp: 10,
      },
    }
    const result = calculateContributionMargin(order)
    expect(result.warnings).toContain("negative_margin")
  })

  it("adds high_shipping_subsidy warning when shipping > 20% of price", () => {
    const order = {
      metadata: {
        sellingPriceEgp: 100,
        blankCostEgp: 10,
        printCostEgp: 10,
        packagingCostEgp: 5,
        shippingSubsidyEgp: 25,
        paymentFeeEgp: 5,
        estimatedCpaEgp: 5,
        rtoAllowanceEgp: 5,
      },
    }
    const result = calculateContributionMargin(order)
    expect(result.warnings).toContain("high_shipping_subsidy")
  })

  it("adds high_cpa warning when CPA > 25% of price", () => {
    const order = {
      metadata: {
        sellingPriceEgp: 100,
        blankCostEgp: 10,
        printCostEgp: 10,
        packagingCostEgp: 5,
        shippingSubsidyEgp: 5,
        paymentFeeEgp: 5,
        estimatedCpaEgp: 30,
        rtoAllowanceEgp: 5,
      },
    }
    const result = calculateContributionMargin(order)
    expect(result.warnings).toContain("high_cpa")
  })

  it("sums line-item costs weighted by quantity", () => {
    const order = {
      items: [
        {
          quantity: 2,
          item: {
            product: { metadata: { blankCostEgp: 50, printCostEgp: 25 } },
          },
        },
        {
          quantity: 1,
          product: { metadata: { blankCostEgp: 60, printCostEgp: 30 } },
        },
      ],
      metadata: {
        sellingPriceEgp: 500,
        packagingCostEgp: 20,
        shippingSubsidyEgp: 30,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 25,
        rtoAllowanceEgp: 10,
      },
    }
    const result = calculateContributionMargin(order)
    // blank: 50*2 + 60*1 = 160
    // print: 25*2 + 30*1 = 80
    expect(result.breakdown.blankCostEgp).toBe(160)
    expect(result.breakdown.printCostEgp).toBe(80)
  })

  it("falls back to quantity 1 when line quantity is missing", () => {
    const order = {
      items: [
        {
          item: {
            product: { metadata: { blankCostEgp: 50 } },
          },
        },
      ],
      metadata: {
        sellingPriceEgp: 500,
        printCostEgp: 0,
        packagingCostEgp: 0,
        shippingSubsidyEgp: 0,
        paymentFeeEgp: 0,
        estimatedCpaEgp: 0,
        rtoAllowanceEgp: 0,
      },
    }
    const result = calculateContributionMargin(order)
    expect(result.breakdown.blankCostEgp).toBe(50)
  })
})
