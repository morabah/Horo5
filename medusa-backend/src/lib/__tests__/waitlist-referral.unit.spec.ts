import { generateReferralCode } from "../waitlist-referral"

describe("generateReferralCode", () => {
  it("generates an 8-character alphanumeric code", () => {
    const code = generateReferralCode("test@example.com")
    expect(code).toHaveLength(8)
    expect(code).toMatch(/^[a-z0-9]+$/)
  })

  it("produces different codes for the same email", () => {
    const code1 = generateReferralCode("test@example.com")
    const code2 = generateReferralCode("test@example.com")
    expect(code1).not.toBe(code2)
  })

  it("produces different codes for different emails", () => {
    const code1 = generateReferralCode("a@example.com")
    const code2 = generateReferralCode("b@example.com")
    expect(code1).not.toBe(code2)
  })
})
