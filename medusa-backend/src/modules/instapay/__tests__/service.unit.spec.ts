import { PaymentSessionStatus } from "@medusajs/framework/utils"

import InstapayProviderService from "../service"

describe("InstapayProviderService", () => {
  const svc = new InstapayProviderService({} as never, {})

  it("capturePayment records manual transfer confirmation (no PSP capture API)", async () => {
    const out = await svc.capturePayment({
      data: { session_id: "ps_test", currency_code: "egp" },
    } as never)
    expect(out.data?.provider_status).toBe(PaymentSessionStatus.CAPTURED)
    expect(typeof out.data?.horo_transfer_confirmed_at).toBe("string")
  })

  it("getPaymentStatus returns captured when provider_status is captured", async () => {
    const out = await svc.getPaymentStatus({
      data: { provider_status: PaymentSessionStatus.CAPTURED },
    } as never)
    expect(out.status).toBe(PaymentSessionStatus.CAPTURED)
  })
})
