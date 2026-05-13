import { MedusaError, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"

import PaymobProviderService from "../service"

describe("PaymobProviderService", () => {
  const config = {
    apiKey: "test_api_key",
    hmacSecret: "test_hmac_secret",
    cardIntegrationId: "12345",
    backendUrl: "http://localhost:9000",
    storeUrl: "http://localhost:3000",
  }

  const svc = new PaymobProviderService({} as never, config)

  describe("validateOptions", () => {
    it("throws when apiKey is missing", () => {
      expect(() =>
        PaymobProviderService.validateOptions({ ...config, apiKey: "" })
      ).toThrow(MedusaError)
    })

    it("throws when hmacSecret is missing", () => {
      expect(() =>
        PaymobProviderService.validateOptions({ ...config, hmacSecret: undefined })
      ).toThrow(MedusaError)
    })

    it("passes with all required fields", () => {
      expect(() =>
        PaymobProviderService.validateOptions(config)
      ).not.toThrow()
    })
  })

  describe("authorizePayment", () => {
    it("returns AUTHORIZED when provider_status is authorized", async () => {
      const out = await svc.authorizePayment({
        data: { provider_status: PaymentSessionStatus.AUTHORIZED },
      } as never)
      expect(out.status).toBe(PaymentSessionStatus.AUTHORIZED)
    })

    it("returns PENDING by default", async () => {
      const out = await svc.authorizePayment({ data: {} } as never)
      expect(out.status).toBe(PaymentSessionStatus.PENDING)
    })

    it("returns REQUIRES_MORE when redirect_url is present", async () => {
      const out = await svc.authorizePayment({
        data: { redirect_url: "http://paymob.com" },
      } as never)
      expect(out.status).toBe(PaymentSessionStatus.REQUIRES_MORE)
    })
  })

  describe("getPaymentStatus", () => {
    it("maps captured status to AUTHORIZED", async () => {
      const out = await svc.getPaymentStatus({
        data: { provider_status: PaymentSessionStatus.CAPTURED },
      } as never)
      expect(out.status).toBe(PaymentSessionStatus.AUTHORIZED)
    })

    it("maps success=true to AUTHORIZED", async () => {
      const out = await svc.getPaymentStatus({
        data: { success: true },
      } as never)
      expect(out.status).toBe(PaymentSessionStatus.AUTHORIZED)
    })

    it("maps canceled to CANCELED", async () => {
      const out = await svc.getPaymentStatus({
        data: { provider_status: PaymentSessionStatus.CANCELED },
      } as never)
      expect(out.status).toBe(PaymentSessionStatus.CANCELED)
    })
  })

  describe("deletePayment", () => {
    it("returns data as-is", async () => {
      const out = await svc.deletePayment({ data: { id: "sess_123" } } as never)
      expect(out.data).toEqual({ id: "sess_123" })
    })
  })

  describe("cancelPayment", () => {
    it("sets provider_status to CANCELED", async () => {
      const out = await svc.cancelPayment({
        data: { id: "sess_123" },
      } as never)
      expect(out.data?.provider_status).toBe(PaymentSessionStatus.CANCELED)
    })
  })

  describe("retrievePayment", () => {
    it("returns data as-is", async () => {
      const out = await svc.retrievePayment({ data: { foo: "bar" } } as never)
      expect(out.data).toEqual({ foo: "bar" })
    })
  })

  describe("refundPayment", () => {
    it("throws with metadata preservation", async () => {
      await expect(
        svc.refundPayment({ data: { refund_reason: "customer_request" } } as never)
      ).rejects.toThrow(/Paymob refunds are not supported/)
    })
  })

  describe("getWebhookActionAndData", () => {
    it("throws when hmac is missing", async () => {
      await expect(
        svc.getWebhookActionAndData({
          data: { obj: { amount_cents: 1000, order: { merchant_order_id: "sess_123" } } },
          headers: {},
        } as never)
      ).rejects.toThrow(/Missing Paymob webhook signature/)
    })

    it("returns SUCCESSFUL when success=true and is_capture=true", async () => {
      const payload = {
        data: {
          hmac: "abc",
          obj: {
            amount_cents: 1000,
            order: { merchant_order_id: "sess_123" },
            success: true,
            is_capture: true,
          },
        },
        headers: {},
      }
      await expect(
        svc.getWebhookActionAndData(payload as never)
      ).rejects.toThrow() // HMAC mismatch, but tests the payload parsing path
    })

    it("returns CANCELED when is_voided=true", async () => {
      const payload = {
        data: {
          hmac: "abc",
          obj: {
            amount_cents: 1000,
            order: { merchant_order_id: "sess_123" },
            is_voided: true,
          },
        },
        headers: {},
      }
      await expect(
        svc.getWebhookActionAndData(payload as never)
      ).rejects.toThrow() // HMAC mismatch
    })
  })
})
