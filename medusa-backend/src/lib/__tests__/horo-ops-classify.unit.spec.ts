import {
  classifyOpsOrders,
  friendlyDisplayId,
  isDeliveredFulfillment,
  isPaymentCaptured,
  orderExcludedFromShippingSlaBuckets,
  parseOrderTotalMinor,
  type OpsClassifyConfig,
  type OpsOrderRow,
} from "../horo-ops-classify"

const baseConfig: OpsClassifyConfig = {
  slaDeliveryDays: 3,
  dueSoonHours: 48,
  stalePaymentHours: 48,
  staleFulfillmentHours: 72,
  deliveredRecentDays: 14,
}

describe("friendlyDisplayId", () => {
  it("formats numeric display_id", () => {
    expect(friendlyDisplayId(12)).toBe("HORO-12")
  })
  it("returns null for invalid", () => {
    expect(friendlyDisplayId(null)).toBeNull()
  })
})

describe("parseOrderTotalMinor", () => {
  it("parses number", () => {
    expect(parseOrderTotalMinor(1500)).toBe(1500)
  })
})

describe("isDeliveredFulfillment / isPaymentCaptured", () => {
  it("detects shipped", () => {
    expect(isDeliveredFulfillment("shipped")).toBe(true)
  })
  it("detects captured", () => {
    expect(isPaymentCaptured("captured")).toBe(true)
  })
  it("treats Medusa collection-style completed as captured for ops gates", () => {
    expect(isPaymentCaptured("completed")).toBe(true)
  })
})

describe("orderExcludedFromShippingSlaBuckets", () => {
  it("is true for canceled, cancelled, draft, archived", () => {
    expect(orderExcludedFromShippingSlaBuckets({ status: "canceled" })).toBe(true)
    expect(orderExcludedFromShippingSlaBuckets({ status: "CANCELLED" })).toBe(true)
    expect(orderExcludedFromShippingSlaBuckets({ status: "draft" })).toBe(true)
    expect(orderExcludedFromShippingSlaBuckets({ status: "archived" })).toBe(true)
  })
  it("is false for pending and empty", () => {
    expect(orderExcludedFromShippingSlaBuckets({ status: "pending" })).toBe(false)
    expect(orderExcludedFromShippingSlaBuckets({ status: null })).toBe(false)
    expect(orderExcludedFromShippingSlaBuckets({ status: undefined })).toBe(false)
  })
})

describe("classifyOpsOrders", () => {
  const now = new Date("2026-01-10T12:00:00.000Z")

  it("flags SLA overdue when not fulfilled", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_1",
        display_id: 1,
        created_at: "2026-01-01T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 100,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.alarms.some((a) => a.kind === "sla_overdue")).toBe(true)
    expect(out.today.some((t) => t.order_id === "ord_1")).toBe(true)
  })

  it("puts order in dueSoon when deadline within window", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_2",
        display_id: 2,
        created_at: "2026-01-08T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 50,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.dueSoon.map((r) => r.id)).toContain("ord_2")
  })

  it("aggregates money collected by currency", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "a",
        display_id: 1,
        created_at: "2026-01-09T12:00:00.000Z",
        payment_status: "captured",
        currency_code: "egp",
        total: 100,
      },
      {
        id: "b",
        display_id: 2,
        created_at: "2026-01-09T12:00:00.000Z",
        payment_status: "captured",
        currency_code: "egp",
        total: 200,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.moneyCollectedByCurrency.egp).toBe(300)
    expect(out.moneyCollectedOrders).toHaveLength(2)
  })

  it("lists delivered recently when fulfilled and recent", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "ord_3",
        display_id: 3,
        created_at: "2026-01-01T12:00:00.000Z",
        updated_at: "2026-01-09T12:00:00.000Z",
        fulfillment_status: "shipped",
        payment_status: "captured",
        currency_code: "egp",
        total: 10,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.deliveredRecently).toHaveLength(1)
  })

  it("buckets open orders by SLA deadline UTC day (today / tomorrow / +2–3)", () => {
    const cfg: OpsClassifyConfig = { ...baseConfig, slaDeliveryDays: 3 }
    const rows: OpsOrderRow[] = [
      {
        id: "t0",
        display_id: 10,
        created_at: "2026-01-07T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 1,
      },
      {
        id: "t1",
        display_id: 11,
        created_at: "2026-01-08T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 2,
      },
      {
        id: "t2",
        display_id: 12,
        created_at: "2026-01-09T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 3,
      },
    ]
    const out = classifyOpsOrders(rows, cfg, now)
    expect(out.deliveryScheduleUtcDay).toBe("2026-01-10")
    expect(out.deliveryDueToday.map((r) => r.id)).toContain("t0")
    expect(out.deliveryDueTomorrow.map((r) => r.id)).toContain("t1")
    expect(out.deliveryDueIn2To3Days.map((r) => r.id)).toContain("t2")
  })

  it("excludes fulfilled orders from delivery buckets", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "x",
        display_id: 1,
        created_at: "2026-01-07T10:00:00.000Z",
        fulfillment_status: "shipped",
        payment_status: "captured",
        currency_code: "egp",
        total: 1,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.deliveryDueToday).toHaveLength(0)
  })

  it("excludes canceled from SLA delivery buckets while pending with same dates stays", () => {
    const cfg: OpsClassifyConfig = { ...baseConfig, slaDeliveryDays: 3 }
    const rows: OpsOrderRow[] = [
      {
        id: "gone",
        display_id: 24,
        status: "canceled",
        created_at: "2026-01-09T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "awaiting",
        currency_code: "egp",
        total: 99,
      },
      {
        id: "kept",
        display_id: 23,
        status: "pending",
        created_at: "2026-01-09T10:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 50,
      },
    ]
    const out = classifyOpsOrders(rows, cfg, now)
    expect(out.deliveryDueIn2To3Days.map((r) => r.id)).not.toContain("gone")
    expect(out.deliveryDueIn2To3Days.map((r) => r.id)).toContain("kept")
  })

  it("excludes canceled captured orders from money collected", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "refund_case",
        display_id: 7,
        status: "canceled",
        created_at: "2026-01-09T12:00:00.000Z",
        payment_status: "captured",
        currency_code: "egp",
        total: 500,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.moneyCollectedOrders).toHaveLength(0)
    expect(out.moneyCollectedByCurrency.egp ?? 0).toBe(0)
  })

  it("excludes canceled from dueSoon and from sla_overdue alarms", () => {
    const rows: OpsOrderRow[] = [
      {
        id: "cancel_duesoon",
        display_id: 99,
        status: "canceled",
        created_at: "2026-01-08T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 10,
      },
      {
        id: "pending_duesoon",
        display_id: 98,
        status: "pending",
        created_at: "2026-01-08T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 10,
      },
      {
        id: "cancel_overdue",
        display_id: 97,
        status: "canceled",
        created_at: "2026-01-01T12:00:00.000Z",
        fulfillment_status: "not_fulfilled",
        payment_status: "captured",
        currency_code: "egp",
        total: 10,
      },
    ]
    const out = classifyOpsOrders(rows, baseConfig, now)
    expect(out.dueSoon.map((r) => r.id)).not.toContain("cancel_duesoon")
    expect(out.dueSoon.map((r) => r.id)).toContain("pending_duesoon")
    expect(out.alarms.filter((a) => a.order_id === "cancel_overdue" && a.kind === "sla_overdue")).toHaveLength(0)
  })
})
