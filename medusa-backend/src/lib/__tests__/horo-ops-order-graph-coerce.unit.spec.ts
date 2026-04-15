import {
  effectiveFulfillmentStatusFromOrderGraph,
  effectivePaymentStatusFromOrderGraph,
} from "../horo-ops-order-graph-coerce"

describe("effectivePaymentStatusFromOrderGraph", () => {
  it("uses top-level payment_status when present", () => {
    expect(
      effectivePaymentStatusFromOrderGraph({
        payment_status: "captured",
        payment_collections: [{ payments: [{ status: "awaiting" }] }],
      }),
    ).toBe("captured")
  })

  it("infers from nested payments when top-level is missing", () => {
    expect(
      effectivePaymentStatusFromOrderGraph({
        payment_collections: [{ payments: [{ status: "awaiting", provider_id: "pp_instapay_instapay" }] }],
      }),
    ).toBe("awaiting")
  })

  it("aggregates to captured when every payment is captured", () => {
    expect(
      effectivePaymentStatusFromOrderGraph({
        payment_collections: [
          {
            payments: [
              { status: "captured", provider_id: "a" },
              { status: "captured", provider_id: "b" },
            ],
          },
        ],
      }),
    ).toBe("captured")
  })

  it("falls back to payment_collection status when payment rows omit status", () => {
    expect(
      effectivePaymentStatusFromOrderGraph({
        payment_collections: [{ status: "completed", payments: [] }],
      }),
    ).toBe("captured")
  })
})

describe("effectiveFulfillmentStatusFromOrderGraph", () => {
  it("uses top-level fulfillment_status when present", () => {
    expect(effectiveFulfillmentStatusFromOrderGraph({ fulfillment_status: "not_fulfilled", fulfillments: [] })).toBe(
      "not_fulfilled",
    )
  })

  it("infers not_fulfilled when fulfillments exist but none delivered", () => {
    expect(
      effectiveFulfillmentStatusFromOrderGraph({
        fulfillments: [{ id: "ful_1", delivered_at: null }],
      }),
    ).toBe("not_fulfilled")
  })

  it("infers fulfilled when every fulfillment has delivered_at", () => {
    expect(
      effectiveFulfillmentStatusFromOrderGraph({
        fulfillments: [
          { id: "ful_1", delivered_at: "2026-01-01T00:00:00.000Z" },
          { id: "ful_2", delivered_at: "2026-01-02T00:00:00.000Z" },
        ],
      }),
    ).toBe("fulfilled")
  })
})
