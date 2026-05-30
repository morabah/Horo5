import {
  buildAbandonedCartReminderHtml,
  resolveAbandonedCartCtaUrl,
} from "../abandoned-cart-email"

describe("buildAbandonedCartReminderHtml", () => {
  it("uses cart restore CTA and conditional copy in English", () => {
    const html = buildAbandonedCartReminderHtml({
      locale: "en",
      storeUrl: "https://horo.eg",
      cartValueEgp: 1200,
      ctaUrl: "https://horo.eg/cart",
    })
    expect(html).toContain("https://horo.eg/cart")
    expect(html).not.toContain("/checkout")
    expect(html).toContain("when shown at checkout")
    expect(html).toContain("EGP 1200")
  })

  it("renders Arabic conditional copy", () => {
    const html = buildAbandonedCartReminderHtml({
      locale: "ar",
      storeUrl: "https://horo.eg",
      ctaUrl: "https://horo.eg/cart",
    })
    expect(html).toContain('dir="rtl"')
    expect(html).toContain("عند ظهوره في الدفع")
  })
})

describe("resolveAbandonedCartCtaUrl", () => {
  it("falls back to /cart without cart id", () => {
    expect(
      resolveAbandonedCartCtaUrl({ storeUrl: "https://horo.eg", email: "a@b.com" }),
    ).toBe("https://horo.eg/cart")
  })
})
