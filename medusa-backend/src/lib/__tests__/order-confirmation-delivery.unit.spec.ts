import { resolveEstimatedDeliveryWindowForEmail } from "../order-confirmation-delivery"

describe("order-confirmation-delivery", () => {
  const prevMin = process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS
  const prevMax = process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS

  afterEach(() => {
    if (prevMin === undefined) delete process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS
    else process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS = prevMin
    if (prevMax === undefined) delete process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS
    else process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS = prevMax
  })

  it("returns a date range anchored on created_at (default 3–5 business days)", () => {
    delete process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS
    delete process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS
    const w = resolveEstimatedDeliveryWindowForEmail("2026-04-15T10:52:00.000Z", null)
    expect(w).toBeTruthy()
    expect(w).toMatch(/–/)
  })

  it("respects order.metadata.delivery standard min/max days", () => {
    delete process.env.ORDER_CONFIRMATION_DELIVERY_MIN_DAYS
    delete process.env.ORDER_CONFIRMATION_DELIVERY_MAX_DAYS
    const w = resolveEstimatedDeliveryWindowForEmail("2026-04-15T12:00:00.000Z", {
      delivery: { standardMinDays: 1, standardMaxDays: 2 },
    })
    expect(w).toBeTruthy()
  })
})
