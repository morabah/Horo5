import { isPaymentCaptured } from "../horo-ops-classify"
import {
  findCapturablePaymentId,
  orderLineItemsForFulfillment,
  orderUsesInstapayPayment,
} from "../horo-ops-order-actions"

describe("orderLineItemsForFulfillment", () => {
  it("reads flat items.* rows", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [{ id: "orli_01", quantity: 2 }],
      }),
    ).toEqual([{ id: "orli_01", quantity: 2 }])
  })

  it("prefers nested item.id when Remote Query nests the line entity", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [
          {
            id: "orditem_01",
            item: { id: "orli_01", title: "Tee" },
            quantity: 1,
          },
        ],
      }),
    ).toEqual([{ id: "orli_01", quantity: 1 }])
  })

  it("resolves quantity from detail when root quantity is missing", () => {
    expect(
      orderLineItemsForFulfillment({
        items: [{ id: "orli_02", detail: { quantity: "3" } }],
      }),
    ).toEqual([{ id: "orli_02", quantity: 3 }])
  })

  it("returns empty when items missing or not fulfillable", () => {
    expect(orderLineItemsForFulfillment({})).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [] })).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [{ id: "", quantity: 1 }] })).toEqual([])
    expect(orderLineItemsForFulfillment({ items: [{ id: "orli_x", quantity: 0 }] })).toEqual([])
  })
})

describe("orderUsesInstapayPayment", () => {
  it("detects Instapay from payment_sessions provider_id", () => {
    expect(
      orderUsesInstapayPayment({
        payment_collections: [{ payment_sessions: [{ provider_id: "pp_instapay_instapay" }] }],
      }),
    ).toBe(true)
  })

  it("detects Instapay from payments provider_id", () => {
    expect(
      orderUsesInstapayPayment({
        payment_collections: [{ payments: [{ provider_id: "pp_instapay_instapay" }] }],
      }),
    ).toBe(true)
  })

  it("returns false for COD-only graph", () => {
    expect(
      orderUsesInstapayPayment({
        payment_collections: [{ payment_sessions: [{ provider_id: "pp_system_default" }] }],
      }),
    ).toBe(false)
  })
})

describe("findCapturablePaymentId", () => {
  it("returns payment id when Medusa uses awaiting status", () => {
    expect(
      findCapturablePaymentId({
        payment_status: "awaiting",
        payment_collections: [
          {
            payments: [{ id: "pay_01", status: "awaiting", provider_id: "pp_paymob_paymob" }],
          },
        ],
      }),
    ).toBe("pay_01")
  })

  it("Instapay fallback returns first non-captured Instapay payment for uncommon status strings", () => {
    expect(
      findCapturablePaymentId({
        payment_status: "authorized",
        payment_collections: [
          {
            payment_sessions: [{ provider_id: "pp_instapay_instapay" }],
            payments: [{ id: "pay_in1", status: "processing", provider_id: "pp_instapay_instapay" }],
          },
        ],
      }),
    ).toBe("pay_in1")
  })
})

describe("Instapay fulfillment gate (capture before fulfill)", () => {
  it("requires capture when Instapay and order payment_status not captured", () => {
    const row = {
      payment_status: "authorized",
      payment_collections: [{ payment_sessions: [{ provider_id: "pp_instapay_instapay" }] }],
    }
    expect(orderUsesInstapayPayment(row)).toBe(true)
    expect(isPaymentCaptured(row.payment_status as string)).toBe(false)
  })

  it("allows fulfill when Instapay and payment_status captured", () => {
    const row = {
      payment_status: "captured",
      payment_collections: [{ payment_sessions: [{ provider_id: "pp_instapay_instapay" }] }],
    }
    expect(orderUsesInstapayPayment(row)).toBe(true)
    expect(isPaymentCaptured(row.payment_status as string)).toBe(true)
  })
})
