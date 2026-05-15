import { buildBundlePromotionConfig, describeUnknownError } from "../cart-incentives"

describe("promotions studio cart incentives helpers", () => {
  it("builds a Medusa-valid BUYGET promotion payload for the broad bundle incentive", () => {
    const config = buildBundlePromotionConfig({
      requireQuantity: 2,
      applyToQuantity: 1,
      applicationKind: "percentage",
      applicationValue: 100,
    })

    expect(config.code).toBe("HORO_BUNDLE_2_1_PERCENTAGE_100")
    expect(config.applicationMethod).toMatchObject({
      type: "percentage",
      target_type: "items",
      allocation: "each",
      value: 100,
      currency_code: "egp",
      buy_rules_min_quantity: 2,
      apply_to_quantity: 1,
      max_quantity: 1,
    })
    expect(config.applicationMethod.buy_rules).toEqual([
      { attribute: "items.product.id", operator: "ne", values: ["__horo_no_product__"] },
    ])
    expect(config.applicationMethod.target_rules).toEqual(config.applicationMethod.buy_rules)
  })

  it("keeps non-Error Medusa failures readable", () => {
    expect(describeUnknownError({ message: "Buy rules are required" })).toBe("Buy rules are required")
    expect(describeUnknownError({ type: "invalid_data", detail: "No target rules" })).toBe(
      "{\"type\":\"invalid_data\",\"detail\":\"No target rules\"}"
    )
  })
})
