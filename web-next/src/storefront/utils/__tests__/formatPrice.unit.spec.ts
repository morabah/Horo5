import { formatEgp } from "../formatPrice"

describe("formatEgp", () => {
  it("formats whole EGP with grouping and suffix", () => {
    expect(formatEgp(799)).toMatch(/799/)
    expect(formatEgp(799)).toContain("EGP")
    expect(formatEgp(1700)).toMatch(/1,?700/)
  })

  it("rounds fractional input per Intl", () => {
    expect(formatEgp(60.4)).toMatch(/60/)
  })
})
