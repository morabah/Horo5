import { buildPostHogOrderCompletedPayload } from "../posthog-order-analytics"

describe("posthog-order-analytics", () => {
  it("builds a non-PII order completed payload and excludes gift wrap", () => {
    const payload = buildPostHogOrderCompletedPayload({
      id: "order_123",
      display_id: 45,
      email: "customer@example.com",
      currency_code: "egp",
      subtotal: 1200,
      shipping_total: 80,
      tax_total: 0,
      discount_total: 100,
      total: 1180,
      items: [
        {
          product_handle: "midnight-compass",
          product_title: "Midnight Compass",
          variant_title: "M",
          quantity: 2,
          unit_price: 600,
          total: 1200,
        },
        {
          product_handle: "gift-wrap",
          product_title: "Gift wrap",
          variant_title: "Default",
          quantity: 1,
          unit_price: 50,
          total: 50,
        },
      ],
      shipping_address: {
        first_name: "Customer",
        phone: "+201000000000",
        address_1: "Street",
      },
      shipping_methods: [{ name: "Cairo delivery", total: 80 }],
    })

    expect(payload).toEqual({
      event: "commerce_order_completed",
      distinct_id: "order_123",
      properties: expect.objectContaining({
        $insert_id: "commerce_order_completed:order_123",
        $process_person_profile: false,
        commerce_event: "commerce_order_completed",
        source: "medusa_order_placed",
        transaction_id: "order_123",
        order_ref: "HORO-45",
        currency: "EGP",
        value: 1180,
        subtotal: 1200,
        shipping: 80,
        tax: 0,
        discount: 100,
        item_count: 2,
        line_count: 1,
        shipping_method: "Cairo delivery",
        items: [
          {
            item_id: "midnight-compass",
            item_name: "Midnight Compass",
            item_brand: "HORO Egypt",
            item_variant: "M",
            price: 600,
            quantity: 2,
          },
        ],
      }),
    })
    expect(JSON.stringify(payload)).not.toContain("customer@example.com")
    expect(JSON.stringify(payload)).not.toContain("+201000000000")
    expect(JSON.stringify(payload)).not.toContain("Street")
  })
})
