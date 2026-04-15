import { stockStatusForVariantDto } from "../storefront/catalog"

describe("stockStatusForVariantDto", () => {
  it("marks preorder when backorder is allowed and stock is zero", () => {
    expect(
      stockStatusForVariantDto({
        allow_backorder: true,
        available: true,
        currency_code: "egp",
        id: "v1",
        inventory_quantity: 0,
        is_discounted: false,
        manage_inventory: true,
        original_price_egp: null,
        price_egp: 100,
        size: "M",
        sku: null,
      })
    ).toBe("preorder")
  })

  it("marks sold_out when no backorder and zero stock", () => {
    expect(
      stockStatusForVariantDto({
        allow_backorder: false,
        available: false,
        currency_code: "egp",
        id: "v1",
        inventory_quantity: 0,
        is_discounted: false,
        manage_inventory: true,
        original_price_egp: null,
        price_egp: 100,
        size: "M",
        sku: null,
      })
    ).toBe("sold_out")
  })

  it("marks low_stock for small on-hand counts", () => {
    expect(
      stockStatusForVariantDto({
        allow_backorder: false,
        available: true,
        currency_code: "egp",
        id: "v1",
        inventory_quantity: 3,
        is_discounted: false,
        manage_inventory: true,
        original_price_egp: null,
        price_egp: 100,
        size: "M",
        sku: null,
      })
    ).toBe("low_stock")
  })
})
