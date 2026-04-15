import { normalizeGraphOrderForEmail } from "../normalize-graph-order-for-email"
import { buildOrderConfirmationHtml } from "../order-confirmation-email"

describe("normalizeGraphOrderForEmail", () => {
  it("flattens nested items.item + detail and reads summary when root totals are zero", () => {
    const row: Record<string, unknown> = {
      id: "order_test123",
      display_id: 18,
      email: "buyer@test.com",
      currency_code: "egp",
      created_at: "2026-04-15T10:07:00.000Z",
      subtotal: 0,
      tax_total: 0,
      shipping_total: 0,
      discount_total: 0,
      total: 0,
      summary: [
        {
          totals: {
            subtotal: 1700,
            shipping_total: 60,
            tax_total: 0,
            discount_total: 0,
            total: 1760,
          },
        },
      ],
      items: [
        {
          quantity: "1",
          item: {
            product_title: "Signal Line",
            variant_title: "M",
            product_handle: "signal-line",
            unit_price: "1700",
          },
          detail: {
            unit_price: "1700",
            quantity: "1",
          },
        },
      ],
      shipping_methods: [
        {
          shipping_method: {
            name: "Standard",
            amount: "60",
          },
        },
      ],
      shipping_address: null,
      billing_address: null,
    }

    const input = normalizeGraphOrderForEmail(row, { storeUrl: "https://shop.example.com" })
    expect(input.items?.[0]?.unit_price).toBeDefined()
    expect(String(input.items?.[0]?.product_title)).toContain("Signal")
    const html = buildOrderConfirmationHtml(input)
    expect(html).toContain("1,700")
    expect(html).toContain("1,760")
    expect(html).toContain("60")
  })
})
