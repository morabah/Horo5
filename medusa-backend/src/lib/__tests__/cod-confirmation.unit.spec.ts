import {
  buildCodConfirmationUpdate,
  canDispatchCodOrder,
  isCodConfirmationStatus,
  orderUsesCodPayment,
  readCodConfirmationMetadata,
} from "../cod-confirmation"

const codPayment = {
  payment_collections: [{ payment_sessions: [{ provider_id: "pp_system_default" }] }],
}

describe("COD confirmation status", () => {
  it("starts COD orders as pending and blocks dispatch", () => {
    const order = { ...codPayment, metadata: {} }

    expect(orderUsesCodPayment(order)).toBe(true)
    expect(readCodConfirmationMetadata(order).codConfirmationStatus).toBe("pending")
    expect(canDispatchCodOrder(order)).toEqual({
      ok: false,
      message: "COD order must be confirmed before dispatch.",
    })
  })

  it("allows dispatch when COD is confirmed", () => {
    const order = { ...codPayment, metadata: { codConfirmationStatus: "confirmed" } }

    expect(canDispatchCodOrder(order)).toEqual({ ok: true })
  })

  it("marks non-COD orders as not required", () => {
    const order = {
      payment_collections: [{ payment_sessions: [{ provider_id: "pp_paymob_paymob" }] }],
      metadata: {},
    }

    expect(readCodConfirmationMetadata(order).codConfirmationStatus).toBe("not_required")
    expect(canDispatchCodOrder(order)).toEqual({ ok: true })
  })

  it("rejects invalid status strings", () => {
    expect(isCodConfirmationStatus("lost")).toBe(false)
    expect(isCodConfirmationStatus("confirmed")).toBe(true)
  })

  it("builds manual confirmation metadata", () => {
    expect(buildCodConfirmationUpdate({}, "confirmed", {
      confirmedBy: "manual_admin",
      now: new Date("2026-05-13T10:00:00.000Z"),
    })).toEqual({
      codConfirmationStatus: "confirmed",
      codConfirmedAt: "2026-05-13T10:00:00.000Z",
      codConfirmedBy: "manual_admin",
      codConfirmationAttempts: 0,
    })
  })
})
