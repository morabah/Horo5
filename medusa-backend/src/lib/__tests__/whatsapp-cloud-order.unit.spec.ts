import {
  buildPaymentLabelFromOrderRow,
  buildWhatsAppOrderTemplateBody,
  buildWhatsAppTemplateMessagePayload,
  extractWhatsAppIncomingMessageEvents,
  extractWhatsAppStatusEvents,
  extractWhatsAppWebhookChangeMeta,
  normalizeBuyerPhoneE164,
  orderRefLabelForWhatsapp,
  resolveMetaWhatsAppToFromOrderRow,
  stringifyWebhookBodyForLog,
  toMetaWhatsAppRecipientDigits,
  WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX,
} from "../whatsapp-cloud-order"

describe("whatsapp-cloud-order", () => {
  it("normalizes Egyptian phone and produces Meta digits", () => {
    expect(normalizeBuyerPhoneE164("01005038293")).toBe("+201005038293")
    expect(toMetaWhatsAppRecipientDigits("+201005038293")).toBe("201005038293")
    expect(resolveMetaWhatsAppToFromOrderRow({ shipping_address: { phone: "01005038293" } })).toBe("201005038293")
  })

  it("orderRefLabelForWhatsapp uses display_id when valid", () => {
    expect(orderRefLabelForWhatsapp("ord_x", 16)).toBe("HORO-16")
    expect(orderRefLabelForWhatsapp("ord_x", "16")).toBe("HORO-16")
    expect(orderRefLabelForWhatsapp("ord_x", null)).toBe("ord_x")
  })

  it("buildPaymentLabelFromOrderRow maps Paymob and COD", () => {
    expect(
      buildPaymentLabelFromOrderRow({
        payment_collections: [
          {
            payment_sessions: [{ provider_id: "pp_paymob_paymob", status: "authorized" }],
          },
        ],
      }),
    ).toBe("Card")
    expect(
      buildPaymentLabelFromOrderRow({
        payment_collections: [
          {
            payment_sessions: [{ provider_id: "pp_system_default", status: "pending" }],
          },
        ],
      }),
    ).toBe("Cash on delivery")
  })

  it("buildWhatsAppTemplateMessagePayload has four body parameters", () => {
    const body = buildWhatsAppOrderTemplateBody(
      {
        display_id: 2,
        total: "859",
        currency_code: "egp",
        shipping_address: { first_name: "Sam", phone: "+201005038293" },
        payment_collections: [
          { payment_sessions: [{ provider_id: "pp_paymob_paymob", status: "authorized" }] },
        ],
      },
      "ord_1",
    )
    const payload = buildWhatsAppTemplateMessagePayload({
      toDigits: "201005038293",
      templateName: "order_confirmation",
      templateLang: "en",
      body,
    })
    const components = (payload.template as { components?: unknown[] }).components
    const params = (components?.[0] as { parameters?: unknown[] }).parameters
    expect(Array.isArray(params)).toBe(true)
    expect(params).toHaveLength(4)
    expect((params![0] as { text: string }).text).toBe("Sam")
    expect((params![1] as { text: string }).text).toBe("HORO-2")
    expect((params![2] as { text: string }).text).toContain("859")
    expect((params![3] as { text: string }).text).toBe("Card")
  })

  it("extractWhatsAppStatusEvents parses nested webhook body", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [{ id: "wamid.x", status: "delivered", errors: undefined }],
              },
            },
          ],
        },
      ],
    }
    expect(extractWhatsAppStatusEvents(body)).toEqual([
      { id: "wamid.x", status: "delivered", errors: undefined },
    ])
  })

  it("extractWhatsAppIncomingMessageEvents parses buyer text messages", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                messages: [
                  {
                    from: "201234567890",
                    id: "wamid.in",
                    type: "text",
                    timestamp: "1234567890",
                    text: { body: "Hello HORO" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }
    expect(extractWhatsAppIncomingMessageEvents(body)).toEqual([
      {
        from: "201234567890",
        messageId: "wamid.in",
        type: "text",
        textBody: "Hello HORO",
        timestamp: "1234567890",
      },
    ])
  })

  it("extractWhatsAppWebhookChangeMeta reports field and payload shape", () => {
    const body = {
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                messages: [{ from: "1", id: "a", type: "text", text: { body: "x" } }],
                statuses: [{ id: "wamid.s", status: "sent" }],
              },
            },
          ],
        },
      ],
    }
    expect(extractWhatsAppWebhookChangeMeta(body)).toEqual([
      { field: "messages", hasMessages: true, hasStatuses: true },
    ])
  })

  it("stringifyWebhookBodyForLog truncates very large payloads", () => {
    const huge = { x: "y".repeat(WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX + 500) }
    const s = stringifyWebhookBodyForLog(huge)
    expect(s.length).toBeLessThanOrEqual(WHATSAPP_WEBHOOK_RAW_JSON_LOG_MAX + 80)
    expect(s).toContain("...(truncated, total_chars=")
  })
})
