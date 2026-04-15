import type { CartLine } from "../../../cart/types"
import {
  merchandiseSubtotalFromCartLines,
  resolveCheckoutShippingEgp,
  resolveShippingQuoteFromCartAndOptions,
  shippingOptionAmountEgp,
} from "../cart-money"
import type { MedusaCart, MedusaShippingOption } from "../types"

function line(partial: Partial<CartLine> & Pick<CartLine, "productSlug" | "size" | "qty">): CartLine {
  return {
    productSlug: partial.productSlug,
    size: partial.size,
    qty: partial.qty,
    lineId: partial.lineId,
    variantId: partial.variantId,
    productName: partial.productName,
    imageSrc: partial.imageSrc,
    unitPriceEgp: partial.unitPriceEgp,
  }
}

describe("shippingOptionAmountEgp", () => {
  it("prefers calculated_price.calculated_amount over amount", () => {
    const opt = {
      id: "so_1",
      name: "Standard",
      provider_id: "manual_manual",
      amount: 999,
      calculated_price: { calculated_amount: 60 },
    } satisfies MedusaShippingOption
    expect(shippingOptionAmountEgp(opt)).toBe(60)
  })

  it("falls back to amount and handles string amounts", () => {
    const opt = {
      id: "so_2",
      name: "Standard",
      provider_id: "manual_manual",
      amount: "45" as unknown as number,
    } satisfies MedusaShippingOption
    expect(shippingOptionAmountEgp(opt)).toBe(45)
  })

  it("returns 0 for missing option", () => {
    expect(shippingOptionAmountEgp(undefined)).toBe(0)
  })
})

describe("resolveCheckoutShippingEgp", () => {
  const cart = {
    id: "cart_1",
    currency_code: "egp",
    items: [],
    shipping_total: 60,
  } satisfies MedusaCart

  const option = {
    id: "so_x",
    name: "Standard",
    provider_id: "p",
    amount: 999,
  } satisfies MedusaShippingOption

  it("prefers cart.shipping_total when > 0", () => {
    expect(resolveCheckoutShippingEgp(cart, option)).toBe(60)
  })

  it("uses option when cart shipping_total is 0 or missing", () => {
    expect(resolveCheckoutShippingEgp({ ...cart, shipping_total: 0 }, option)).toBe(999)
    expect(resolveCheckoutShippingEgp(undefined, option)).toBe(999)
  })
})

describe("resolveShippingQuoteFromCartAndOptions", () => {
  const optA: MedusaShippingOption = {
    id: "opt_a",
    name: "A",
    provider_id: "p",
    amount: 50,
  }
  const optB: MedusaShippingOption = {
    id: "opt_b",
    name: "B",
    provider_id: "p",
    amount: 70,
  }

  it("prefers shipping_total on cart when > 0", () => {
    const cart: MedusaCart = {
      id: "c",
      currency_code: "egp",
      items: [],
      shipping_total: 55,
      shipping_methods: [{ shipping_option_id: "opt_a", amount: 55 }],
    }
    expect(resolveShippingQuoteFromCartAndOptions(cart, [optA, optB])).toBe(55)
  })

  it("matches attached shipping_option_id when no shipping_total", () => {
    const cart: MedusaCart = {
      id: "c",
      currency_code: "egp",
      items: [],
      shipping_total: 0,
      shipping_methods: [{ shipping_option_id: "opt_b", amount: 0 }],
    }
    expect(resolveShippingQuoteFromCartAndOptions(cart, [optA, optB])).toBe(70)
  })

  it("uses first option when none attached", () => {
    const cart: MedusaCart = {
      id: "c",
      currency_code: "egp",
      items: [],
      shipping_total: 0,
    }
    expect(resolveShippingQuoteFromCartAndOptions(cart, [optA, optB])).toBe(50)
  })

  it("returns 0 when no options and no shipping_total", () => {
    const cart: MedusaCart = {
      id: "c",
      currency_code: "egp",
      items: [],
      shipping_total: 0,
    }
    expect(resolveShippingQuoteFromCartAndOptions(cart, [])).toBe(0)
  })
})

describe("merchandiseSubtotalFromCartLines", () => {
  it("sums linePriceEgp from line views (uses productName when catalog empty in test env)", () => {
    const lines: CartLine[] = [
      line({
        productSlug: "unknown-in-test-catalog",
        size: "M",
        qty: 2,
        productName: "Test Tee",
        unitPriceEgp: 400,
      }),
      line({
        productSlug: "x2",
        size: "L",
        qty: 1,
        productName: "Other",
        unitPriceEgp: 100,
      }),
    ]
    expect(merchandiseSubtotalFromCartLines(lines)).toBe(900)
  })
})
