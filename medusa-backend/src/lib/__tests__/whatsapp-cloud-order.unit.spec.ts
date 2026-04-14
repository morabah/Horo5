import {
  buildPaymentLabelFromOrderRow,
  buildWhatsAppOrderTemplateBody,
  buildWhatsAppTemplateMessagePayload,
  extractWhatsAppStatusEvents,
  normalizeBuyerPhoneE164,
  orderRefLabelForWhatsapp,
  resolveMetaWhatsAppToFromOrderRow,
  toMetaWhatsAppRecipientDigits,
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
})
