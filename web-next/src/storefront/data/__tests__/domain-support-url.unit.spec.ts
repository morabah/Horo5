import { isConfiguredExternalUrl, withSupportMessage } from "../domain-config"

describe("isConfiguredExternalUrl", () => {
  it("accepts http(s) URLs with non-whitespace path", () => {
    expect(isConfiguredExternalUrl("https://wa.me/201234567890")).toBe(true)
    expect(isConfiguredExternalUrl("http://example.com/x")).toBe(true)
  })

  it("rejects missing, non-http, or whitespace-only URLs", () => {
    expect(isConfiguredExternalUrl(null)).toBe(false)
    expect(isConfiguredExternalUrl(undefined)).toBe(false)
    expect(isConfiguredExternalUrl("")).toBe(false)
    expect(isConfiguredExternalUrl("ftp://x")).toBe(false)
    expect(isConfiguredExternalUrl("https://")).toBe(false)
    expect(isConfiguredExternalUrl("not-a-url")).toBe(false)
  })
})

describe("withSupportMessage", () => {
  it("appends URL-encoded text param for valid https URLs", () => {
    const out = withSupportMessage("https://wa.me/123", "Hello world")
    expect(out).toContain("text=")
    expect(out).toMatch(/^https:\/\/wa\.me\/123/)
    expect(decodeURIComponent(new URL(out!).searchParams.get("text")!)).toBe("Hello world")
  })

  it("returns null when URL is not configured", () => {
    expect(withSupportMessage("javascript:alert(1)", "x")).toBeNull()
  })
})
