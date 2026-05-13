import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GET, POST } from "../route"

describe("WhatsApp Webhook Route", () => {
  let req: Partial<MedusaRequest>
  let res: Partial<MedusaResponse> & { statusCode?: number; body?: unknown }

  beforeEach(() => {
    res = {
      statusCode: 200,
      setHeader: jest.fn(),
      status(code: number) {
        this.statusCode = code
        return this
      },
      send(data: unknown) {
        this.body = data
        return this
      },
      sendStatus(code: number) {
        this.statusCode = code
        return this
      },
    }
  })

  describe("GET (webhook verification)", () => {
    it("returns challenge when token matches", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token"
      req = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "secret_token",
          "hub.challenge": "challenge_123",
        },
      }
      await GET(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBe("challenge_123")
      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/plain; charset=utf-8"
      )
    })

    it("returns 403 when token does not match", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token"
      req = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong_token",
          "hub.challenge": "challenge_123",
        },
      }
      await GET(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(403)
      expect(res.body).toBe("Forbidden")
    })

    it("returns 403 when hub.mode is not subscribe", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token"
      req = {
        query: {
          "hub.mode": "unsubscribe",
          "hub.verify_token": "secret_token",
          "hub.challenge": "challenge_123",
        },
      }
      await GET(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(403)
    })

    it("returns 403 when verify_token env is not set", async () => {
      delete process.env.WHATSAPP_VERIFY_TOKEN
      req = {
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "secret_token",
          "hub.challenge": "challenge_123",
        },
      }
      await GET(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(403)
    })

    it("handles array query values", async () => {
      process.env.WHATSAPP_VERIFY_TOKEN = "secret_token"
      req = {
        query: {
          "hub.mode": ["subscribe"],
          "hub.verify_token": ["secret_token"],
          "hub.challenge": ["challenge_123"],
        },
      }
      await GET(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
      expect(res.body).toBe("challenge_123")
    })
  })

  describe("POST (incoming webhook)", () => {
    it("returns 200 for empty body", async () => {
      req = {
        body: {},
        scope: { resolve: jest.fn() } as unknown as MedusaRequest["scope"],
      }
      await POST(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
    })

    it("returns 200 for incoming message event", async () => {
      req = {
        body: {
          object: "whatsapp_business_account",
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: "201001234567",
                        id: "msg_123",
                        timestamp: "1715600000",
                        type: "text",
                        text: { body: "Hello HORO" },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        scope: { resolve: jest.fn() } as unknown as MedusaRequest["scope"],
      }
      await POST(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
    })

    it("returns 200 for status event", async () => {
      req = {
        body: {
          object: "whatsapp_business_account",
          entry: [
            {
              changes: [
                {
                  value: {
                    statuses: [
                      {
                        id: "msg_123",
                        status: "delivered",
                        timestamp: "1715600000",
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
        scope: { resolve: jest.fn() } as unknown as MedusaRequest["scope"],
      }
      await POST(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
    })

    it("returns 200 for string body that parses as JSON", async () => {
      req = {
        body: '{"object":"test"}',
        scope: { resolve: jest.fn() } as unknown as MedusaRequest["scope"],
      }
      await POST(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
    })

    it("returns 200 for invalid string body", async () => {
      req = {
        body: "not-json",
        scope: { resolve: jest.fn() } as unknown as MedusaRequest["scope"],
      }
      await POST(req as MedusaRequest, res as MedusaResponse)
      expect(res.statusCode).toBe(200)
    })
  })
})
