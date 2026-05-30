import { buildAbandonedCartReminderHtml } from "../abandoned-cart-email"

describe("buildAbandonedCartReminderHtml", () => {
  it("includes checkout link and cart value in English", () => {
    const html = buildAbandonedCartReminderHtml({
      locale: "en",
      storeUrl: "https://horo.eg",
      cartValueEgp: 1200,
    })
    expect(html).toContain("https://horo.eg/checkout")
    expect(html).toContain("EGP 1200")
  })

  it("renders Arabic copy", () => {
    const html = buildAbandonedCartReminderHtml({
      locale: "ar",
      storeUrl: "https://horo.eg",
    })
    expect(html).toContain('dir="rtl"')
    expect(html).toContain("كمّل طلبك")
  })
})
