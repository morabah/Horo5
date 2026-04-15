import { isMissingMedusaPublishableKeyError, isStaleMedusaCartCustomerError } from "../client"

/** Keep in sync with `missingPublishableKeyMessage` in client.ts */
const MISSING_PUBLISHABLE_KEY_MESSAGE =
  "Missing Medusa publishable key. Set NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in web-next/.env.local (or VITE_MEDUSA_PUBLISHABLE_KEY for the Vite app) and restart the frontend."

describe("isStaleMedusaCartCustomerError", () => {
  it("matches Medusa stale customer message pattern", () => {
    expect(
      isStaleMedusaCartCustomerError(new Error("Customer with id: user_01abc was not found")),
    ).toBe(true)
  })

  it("returns false for unrelated errors", () => {
    expect(isStaleMedusaCartCustomerError(new Error("Network down"))).toBe(false)
    expect(isStaleMedusaCartCustomerError("string")).toBe(false)
  })
})

describe("isMissingMedusaPublishableKeyError", () => {
  it("matches the publishable key guard error", () => {
    expect(isMissingMedusaPublishableKeyError(new Error(MISSING_PUBLISHABLE_KEY_MESSAGE))).toBe(true)
  })

  it("returns false for other errors", () => {
    expect(isMissingMedusaPublishableKeyError(new Error("Missing Medusa publishable key. (typo)"))).toBe(false)
  })
})
