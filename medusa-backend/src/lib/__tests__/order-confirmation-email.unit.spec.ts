import {
  buildOrderConfirmationHtml,
  GIFT_WRAP_PRODUCT_HANDLE,
  isGiftWrapLineItem,
} from "../order-confirmation-email"

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
    })

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
})
