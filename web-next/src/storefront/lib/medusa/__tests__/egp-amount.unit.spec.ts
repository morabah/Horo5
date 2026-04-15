import { coerceMedusaMoneyToNumber, medusaAmountToEgp, medusaAmountToEgpUnknown } from "../egp-amount"

describe("coerceMedusaMoneyToNumber", () => {
  it("accepts finite numbers", () => {
    expect(coerceMedusaMoneyToNumber(60)).toBe(60)
    expect(coerceMedusaMoneyToNumber(0)).toBe(0)
    expect(coerceMedusaMoneyToNumber(NaN)).toBeNull()
    expect(coerceMedusaMoneyToNumber(Infinity)).toBeNull()
  })

  it("parses numeric strings", () => {
    expect(coerceMedusaMoneyToNumber("  1700  ")).toBe(1700)
    expect(coerceMedusaMoneyToNumber("")).toBeNull()
    expect(coerceMedusaMoneyToNumber("x")).toBeNull()
  })

  it("unwraps nested money shapes in priority order", () => {
    expect(coerceMedusaMoneyToNumber({ value: "99" })).toBe(99)
    expect(coerceMedusaMoneyToNumber({ numeric_: 42 })).toBe(42)
    expect(coerceMedusaMoneyToNumber({ calculated_amount: { amount: 5 } })).toBe(5)
    expect(coerceMedusaMoneyToNumber({ amount: "12" })).toBe(12)
  })

  it("returns null for nullish and unknown shapes", () => {
    expect(coerceMedusaMoneyToNumber(null)).toBeNull()
    expect(coerceMedusaMoneyToNumber(undefined)).toBeNull()
    expect(coerceMedusaMoneyToNumber({})).toBeNull()
    expect(coerceMedusaMoneyToNumber({ foo: 1 })).toBeNull()
  })
})

describe("medusaAmountToEgpUnknown", () => {
  it("rounds coerced values and maps invalid to 0", () => {
    expect(medusaAmountToEgpUnknown("60.4")).toBe(60)
    expect(medusaAmountToEgpUnknown({ value: "1700" })).toBe(1700)
    expect(medusaAmountToEgpUnknown(null)).toBe(0)
  })
})

describe("medusaAmountToEgp", () => {
  it("rounds numbers only", () => {
    expect(medusaAmountToEgp(60.2)).toBe(60)
    expect(medusaAmountToEgp(undefined)).toBe(0)
    expect(medusaAmountToEgp(null)).toBe(0)
  })
})
