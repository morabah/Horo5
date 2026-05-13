import { calculateContributionMargin } from "../contribution-margin"
import { calculateOrderQualityScore } from "../order-quality-score"

describe("contribution margin", () => {
  it("calculates margin from order and item metadata", () => {
    const result = calculateContributionMargin({
      subtotal: 850,
      metadata: {
        packagingCostEgp: 20,
        shippingSubsidyEgp: 50,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 80,
        rtoAllowanceEgp: 30,
      },
      items: [
        {
          quantity: 1,
          item: {
            product: {
              metadata: {
                blankCostEgp: 180,
                printCostEgp: 90,
              },
            },
          },
        },
      ],
    })

    expect(result.contributionMarginEgp).toBe(385)
    expect(result.warnings).toEqual([])
  })
})

describe("order quality score", () => {
  it("returns a high score for organic confirmed first-wedge gift orders with healthy margin", () => {
    const result = calculateOrderQualityScore({
      subtotal: 950,
      metadata: {
        source: "organic",
        codConfirmationStatus: "confirmed",
        isGiftOrder: true,
        packagingCostEgp: 20,
        shippingSubsidyEgp: 50,
        paymentFeeEgp: 15,
        estimatedCpaEgp: 0,
        rtoAllowanceEgp: 20,
      },
      payment_collections: [{ payment_sessions: [{ provider_id: "pp_system_default" }] }],
      items: [
        {
          quantity: 1,
          item: {
            product: {
              metadata: {
                buyerRoute: "gift",
                giftable: true,
                blankCostEgp: 180,
                printCostEgp: 90,
              },
            },
          },
        },
      ],
    })

    expect(result.orderQualityScore).toBe(5)
  })

  it("warns on unknown source, failed COD, unknown route, and missing margin data", () => {
    const result = calculateOrderQualityScore({
      subtotal: 850,
      metadata: { codConfirmationStatus: "failed" },
      payment_collections: [{ payment_sessions: [{ provider_id: "pp_system_default" }] }],
      items: [{ quantity: 1 }],
    })

    expect(result.orderQualityScore).toBeLessThanOrEqual(2)
    expect(result.warnings).toEqual(expect.arrayContaining([
      "missing_cost_data",
      "low_source_quality",
      "low_cod_confirmation",
      "low_product_route_quality",
    ]))
  })
})
