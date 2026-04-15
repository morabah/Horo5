import { absoluteUrl, getSiteUrl } from "../siteUrl"

describe("getSiteUrl / absoluteUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = prev
    }
  })

  it("strips trailing slash from env base", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com/"
    expect(getSiteUrl()).toBe("https://shop.example.com")
  })

  it("returns empty string when env unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(getSiteUrl()).toBe("")
  })

  it("absoluteUrl joins base and path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shop.example.com"
    expect(absoluteUrl("/cart")).toBe("https://shop.example.com/cart")
    expect(absoluteUrl("checkout")).toBe("https://shop.example.com/checkout")
  })

  it("absoluteUrl returns path-only when base missing", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    expect(absoluteUrl("/p")).toBe("/p")
  })
})
