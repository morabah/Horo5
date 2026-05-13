import { coerceMoneyAmount, medusaAmountToEgp } from "../egp-amount"

describe("coerceMoneyAmount", () => {
  it("returns numbers as-is", () => {
    expect(coerceMoneyAmount(100)).toBe(100)
    expect(coerceMoneyAmount(0)).toBe(0)
    expect(coerceMoneyAmount(-50)).toBe(-50)
    expect(coerceMoneyAmount(3.99)).toBe(3.99)
  })

  it("returns null for non-finite numbers", () => {
    expect(coerceMoneyAmount(NaN)).toBeNull()
    expect(coerceMoneyAmount(Infinity)).toBeNull()
  })

  it("parses numeric strings", () => {
    expect(coerceMoneyAmount("100")).toBe(100)
    expect(coerceMoneyAmount("  42  ")).toBe(42)
    expect(coerceMoneyAmount("3.50")).toBe(3.5)
  })

  it("returns null for non-numeric strings", () => {
    expect(coerceMoneyAmount("abc")).toBeNull()
    expect(coerceMoneyAmount("")).toBeNull()
    expect(coerceMoneyAmount("   ")).toBeNull()
  })

  it("unwraps nested value objects", () => {
    expect(coerceMoneyAmount({ value: 100 })).toBe(100)
    expect(coerceMoneyAmount({ value: "200" })).toBe(200)
    expect(coerceMoneyAmount({ value: { value: 300 } })).toBe(300)
  })

  it("unwraps numeric_ fields", () => {
    expect(coerceMoneyAmount({ numeric_: "150" })).toBe(150)
  })

  it("unwraps calculated_amount fields", () => {
    expect(coerceMoneyAmount({ calculated_amount: 75 })).toBe(75)
  })

  it("unwraps amount fields", () => {
    expect(coerceMoneyAmount({ amount: 99 })).toBe(99)
  })

  it("returns null for null/undefined", () => {
    expect(coerceMoneyAmount(null)).toBeNull()
    expect(coerceMoneyAmount(undefined)).toBeNull()
  })

  it("handles bigint values", () => {
    expect(coerceMoneyAmount(BigInt(100))).toBe(100)
  })

  it("stops at max depth", () => {
    const v9 = { value: 1 }
    const v8 = { value: v9 }
    const v7 = { value: v8 }
    const v6 = { value: v7 }
    const v5 = { value: v6 }
    const v4 = { value: v5 }
    const v3 = { value: v4 }
    const v2 = { value: v3 }
    const v1 = { value: v2 }
    const v0 = { value: v1 }
    expect(coerceMoneyAmount(v0)).toBeNull()
  })
})

describe("medusaAmountToEgp", () => {
  it("rounds to nearest integer", () => {
    expect(medusaAmountToEgp(100)).toBe(100)
    expect(medusaAmountToEgp(99.4)).toBe(99)
    expect(medusaAmountToEgp(99.6)).toBe(100)
  })

  it("returns 0 for null/undefined", () => {
    expect(medusaAmountToEgp(null)).toBe(0)
    expect(medusaAmountToEgp(undefined)).toBe(0)
  })

  it("parses and rounds strings", () => {
    expect(medusaAmountToEgp("150.7")).toBe(151)
  })
})
