import { GIFT_WRAP_PRODUCT_HANDLE, getCartGiftWrapEgp, getOrderGiftWrapEgp, toCartLines } from "../adapters"
import type { MedusaCart, MedusaCartLineItem, MedusaOrder } from "../types"

function apparelItem(partial: Partial<MedusaCartLineItem> & Pick<MedusaCartLineItem, "id" | "quantity" | "variant_id">) {
  return {
    product_handle: "some-tee",
    product_title: "Some Tee",
    variant_title: "M",
    ...partial,
  } as MedusaCartLineItem
}

describe("toCartLines unit pricing", () => {
  it("coerces string unit_price to EGP unit on line", () => {
    const cart: MedusaCart = {
      id: "c1",
      currency_code: "egp",
      items: [
        apparelItem({
          id: "li1",
          quantity: 1,
          variant_id: "v1",
          unit_price: "850" as unknown as number,
        }),
      ],
    }
    const lines = toCartLines(cart)
    expect(lines).toHaveLength(1)
    expect(lines[0].unitPriceEgp).toBe(850)
  })

  it("derives unit from line total when unit_price missing", () => {
    const cart: MedusaCart = {
      id: "c1",
      currency_code: "egp",
      items: [
        apparelItem({
          id: "li1",
          quantity: 2,
          variant_id: "v1",
          total: 1700,
        }),
      ],
    }
    const lines = toCartLines(cart)
    expect(lines[0].unitPriceEgp).toBe(850)
  })
})

describe("getCartGiftWrapEgp / getOrderGiftWrapEgp", () => {
  const wrapLine = (overrides: Partial<MedusaCartLineItem> = {}) =>
    apparelItem({
      id: "gw",
      quantity: 1,
      variant_id: "vgw",
      product_handle: GIFT_WRAP_PRODUCT_HANDLE,
      total: "200" as unknown as number,
      ...overrides,
    })

  it("reads gift wrap total from coerced string", () => {
    const cart: MedusaCart = {
      id: "c1",
      currency_code: "egp",
      items: [wrapLine({ total: "200" as unknown as number, unit_price: undefined })],
    }
    expect(getCartGiftWrapEgp(cart)).toBe(200)
  })

  it("falls back to unit_price * quantity when total missing", () => {
    const cart: MedusaCart = {
      id: "c1",
      currency_code: "egp",
      items: [
        wrapLine({
          total: undefined,
          quantity: 2,
          unit_price: { value: "100" } as unknown as number,
        }),
      ],
    }
    expect(getCartGiftWrapEgp(cart)).toBe(200)
  })

  it("getOrderGiftWrapEgp mirrors cart helper", () => {
    const order: MedusaOrder = {
      id: "o1",
      items: [wrapLine({ total: { numeric_: 250 } as unknown as number })],
    }
    expect(getOrderGiftWrapEgp(order)).toBe(250)
  })
})
