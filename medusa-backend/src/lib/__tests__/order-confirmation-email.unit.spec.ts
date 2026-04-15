import { normalizeGraphOrderForEmail } from "../normalize-graph-order-for-email"
import {
  buildOrderConfirmationHtml,
  GIFT_WRAP_PRODUCT_HANDLE,
  isGiftWrapLineItem,
  validateOrderConfirmationPricing,
} from "../order-confirmation-email"

describe("validateOrderConfirmationPricing", () => {
  it("passes when lines, subtotal, shipping, and total are consistent", () => {
    const r = validateOrderConfirmationPricing({
      id: "o1",
      subtotal: 239700,
      shipping_total: 6000,
      tax_total: 0,
      discount_total: 0,
      total: 245700,
      items: [
        { product_title: "A", quantity: 1, unit_price: 119850, total: 119850 },
        { product_title: "B", quantity: 1, unit_price: 119850, total: 119850 },
      ],
      shipping_methods: [{ name: "Standard", total: 6000 }],
    })
    expect(r.ok).toBe(true)
  })

  it("fails when a catalog line has no money", () => {
    const r = validateOrderConfirmationPricing({
      id: "o1",
      subtotal: 100,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      total: 100,
      items: [{ product_title: "A", quantity: 1, unit_price: 0, total: 0 }],
      shipping_methods: [],
    })
    expect(r.ok).toBe(false)
    expect(r.errors.some((e) => e.includes("normalize to 0"))).toBe(true)
  })
})

describe("order-confirmation-email", () => {
  it("filters gift-wrap line from item table", () => {
    expect(isGiftWrapLineItem({ product_handle: GIFT_WRAP_PRODUCT_HANDLE })).toBe(true)
    expect(isGiftWrapLineItem({ product_handle: "some-tee" })).toBe(false)
  })

  it("escapes HTML in product titles and builds totals", () => {
    const html = buildOrderConfirmationHtml({
      id: "ord_1",
      display_id: 42,
      email: "buyer@test.com",
      currency_code: "egp",
      created_at: "2026-01-15T12:00:00.000Z",
      subtotal: 799,
      shipping_total: 60,
      tax_total: 0,
      discount_total: 0,
      total: 859,
      items: [
        {
          product_title: 'Evil <script>',
          variant_title: "M",
          quantity: 1,
          unit_price: 799,
          total: 799,
          product_handle: "feelings-tee",
        },
        {
          product_title: "Gift wrap",
          quantity: 1,
          unit_price: 200,
          total: 200,
          product_handle: GIFT_WRAP_PRODUCT_HANDLE,
        },
      ],
      shipping_address: {
        first_name: "Sam",
        last_name: "Buyer",
        address_1: "1 Nile St",
        city: "Cairo",
        country_code: "eg",
        phone: "+201234567890",
      },
      billing_address: null,
      shipping_methods: [{ name: "Standard", total: 60 }],
      storeUrl: "https://shop.example.com",
      estimated_delivery_window: "20 Apr – 24 Apr",
    })

    expect(html).toContain("Estimated delivery (standard)")
    expect(html).toContain("20 Apr – 24 Apr")
    expect(html).toContain("HORO-42")
    expect(html).toContain("Evil &lt;script&gt;")
    expect(html).not.toContain("<script>")
    expect(html).toContain("799")
    expect(html).toContain("Gift add-on")
    expect(html).toContain("checkout/success?order_id=")
  })

  it("formats money when graph returns numeric strings (Medusa query.graph)", () => {
    const html = buildOrderConfirmationHtml({
      id: "ord_graph",
      display_id: "16",
      email: "buyer@test.com",
      currency_code: "egp",
      created_at: "2026-04-14T12:00:00.000Z",
      subtotal: "799",
      shipping_total: "60",
      tax_total: "0",
      discount_total: "0",
      total: "859",
      items: [
        {
          product_title: "Astral Body",
          variant_title: "M",
          quantity: "1",
          unit_price: "799",
          total: "799",
          product_handle: "astral-body",
        },
      ],
      shipping_address: null,
      billing_address: null,
      shipping_methods: [{ name: "Standard", amount: "60", total: null }],
      storeUrl: null,
    })

    expect(html).toContain("HORO-16")
    expect(html).toContain("799")
    expect(html).toContain("859")
    expect(html).toContain("Standard")
    expect(html).toContain("60")
  })

  it("builds non-zero prices from Medusa-shaped graph row via normalizeGraphOrderForEmail", () => {
    const graphRow: Record<string, unknown> = {
      id: "order_graph_nested",
      display_id: 22,
      email: "nested@test.com",
      currency_code: "egp",
      created_at: "2026-04-15T12:00:00.000Z",
      subtotal: 0,
      total: 0,
      shipping_total: 0,
      tax_total: 0,
      discount_total: 0,
      items: [
        {
          quantity: 2,
          item: {
            product_title: "Nested Tee",
            variant_title: "L",
            unit_price: 400,
          },
        },
      ],
      shipping_methods: [{ name: "Standard", total: 50 }],
      shipping_address: null,
      billing_address: null,
      summary: [{ totals: { subtotal: 800, shipping_total: 50, total: 850, tax_total: 0, discount_total: 0 } }],
    }

    const input = normalizeGraphOrderForEmail(graphRow, { storeUrl: null })
    const html = buildOrderConfirmationHtml(input)
    expect(html).toContain("Nested Tee")
    expect(html).toContain("800")
    expect(html).toContain("850")
    expect(html).toContain("50")
  })
})
