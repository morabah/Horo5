import { retrieveStorefrontIncentivesPayload } from "../incentives"

type FakePromotion = {
  id: string
  code?: string
  type?: "standard" | "buyget"
  status?: "draft" | "active" | "inactive"
  is_automatic?: boolean
  metadata?: Record<string, unknown> | null
  rules?: Array<{ attribute?: string; operator?: string; values: Array<{ value?: string }> }>
  application_method?: {
    type?: "fixed" | "percentage"
    target_type?: "order" | "shipping_methods" | "items"
    value?: number
    currency_code?: string
    buy_rules_min_quantity?: number | null
    apply_to_quantity?: number | null
  }
}

function buildScope(promotions: FakePromotion[], giftWrap: { handle?: string; price?: number; label?: { en: string; ar?: string } } | null) {
  return {
    resolve(key: string) {
      if (key === "promotion" || key === "Modules.PROMOTION" || key === "promotionService") {
        return { listPromotions: async () => promotions }
      }
      // Real Medusa exports a `Modules.PROMOTION` Symbol/string. We accept any non-product key as the promotion module.
      if (key !== "product" && key !== "Modules.PRODUCT") {
        return { listPromotions: async () => promotions }
      }
      return {
        listProducts: async () => {
          if (!giftWrap) return []
          return [
            {
              handle: giftWrap.handle ?? "gift-wrap",
              metadata: {
                priceEgp: giftWrap.price,
                ...(giftWrap.label ? { giftWrapLabel: giftWrap.label } : {}),
              },
              variants: [],
            },
          ]
        },
      }
    },
  } as unknown as Parameters<typeof retrieveStorefrontIncentivesPayload>[0]
}

describe("retrieveStorefrontIncentivesPayload", () => {
  test("returns nulls when no automatic promotions and no gift-wrap product configured", async () => {
    const out = await retrieveStorefrontIncentivesPayload(buildScope([], null))
    expect(out.freeShipping).toBeNull()
    expect(out.bundle).toBeNull()
    expect(out.giftWrapProductHandle).toBeNull()
  })

  test("projects free-shipping promotion threshold from cart.subtotal rule", async () => {
    const promotions: FakePromotion[] = [
      {
        id: "promo_free_ship_1",
        code: "HORO_FREE_SHIPPING_1500",
        type: "standard",
        status: "active",
        is_automatic: true,
        application_method: {
          type: "percentage",
          target_type: "shipping_methods",
          value: 100,
          currency_code: "egp",
        },
        rules: [
          { attribute: "cart.subtotal", operator: "gte", values: [{ value: "1500" }] },
        ],
      },
    ]
    const out = await retrieveStorefrontIncentivesPayload(buildScope(promotions, null))
    expect(out.freeShipping?.thresholdEgp).toBe(1500)
    expect(out.freeShipping?.currency).toBe("egp")
    expect(out.freeShipping?.promotionId).toBe("promo_free_ship_1")
  })

  test("uses metadata.thresholdEgp fallback when no rule is present", async () => {
    const promotions: FakePromotion[] = [
      {
        id: "promo_free_ship_meta",
        code: "HORO_FREE_SHIPPING_META",
        type: "standard",
        status: "active",
        is_automatic: true,
        metadata: { thresholdEgp: 2000 },
        application_method: {
          type: "percentage",
          target_type: "shipping_methods",
          value: 100,
        },
      },
    ]
    const out = await retrieveStorefrontIncentivesPayload(buildScope(promotions, null))
    expect(out.freeShipping?.thresholdEgp).toBe(2000)
  })

  test("ignores promotions whose code does not start with HORO_FREE_SHIPPING", async () => {
    const promotions: FakePromotion[] = [
      {
        id: "promo_other",
        code: "OTHER_FREE_SHIP",
        type: "standard",
        status: "active",
        is_automatic: true,
        application_method: { type: "percentage", target_type: "shipping_methods", value: 100 },
        rules: [{ attribute: "cart.subtotal", operator: "gte", values: [{ value: "1500" }] }],
      },
    ]
    const out = await retrieveStorefrontIncentivesPayload(buildScope(promotions, null))
    expect(out.freeShipping).toBeNull()
  })

  test("projects buyget bundle with fixed savings", async () => {
    const promotions: FakePromotion[] = [
      {
        id: "promo_bundle_1",
        code: "HORO_BUNDLE_2PACK",
        type: "buyget",
        status: "active",
        is_automatic: true,
        application_method: {
          type: "fixed",
          target_type: "items",
          value: 100,
          buy_rules_min_quantity: 2,
          apply_to_quantity: 1,
        },
      },
    ]
    const out = await retrieveStorefrontIncentivesPayload(buildScope(promotions, null))
    expect(out.bundle?.requireQuantity).toBe(2)
    expect(out.bundle?.applyToQuantity).toBe(1)
    expect(out.bundle?.applicationKind).toBe("fixed")
    expect(out.bundle?.applicationValue).toBe(100)
  })

  test("uses operator label override from metadata.label when provided", async () => {
    const promotions: FakePromotion[] = [
      {
        id: "promo_label_override",
        code: "HORO_FREE_SHIPPING_OVERRIDE",
        type: "standard",
        status: "active",
        is_automatic: true,
        metadata: { label: { en: "Free shipping over 1500 EGP", ar: "شحن مجاني" } },
        application_method: { type: "percentage", target_type: "shipping_methods", value: 100 },
        rules: [{ attribute: "cart.subtotal", operator: "gte", values: [{ value: "1500" }] }],
      },
    ]
    const out = await retrieveStorefrontIncentivesPayload(buildScope(promotions, null))
    expect(out.freeShipping?.label).toEqual({ en: "Free shipping over 1500 EGP", ar: "شحن مجاني" })
  })
})
