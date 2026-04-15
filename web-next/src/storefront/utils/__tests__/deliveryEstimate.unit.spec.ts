import {
  addBusinessDays,
  formatPdpExpressBadgeLabel,
  formatPdpStandardBadgeLabel,
} from "../deliveryEstimate"

describe("addBusinessDays", () => {
  it("returns same calendar day anchor when n <= 0", () => {
    const from = new Date(Date.UTC(2026, 3, 15, 18, 0, 0))
    const out = addBusinessDays(from, 0)
    expect(out.getUTCHours()).toBe(12)
  })

  it("skips weekends when advancing business days", () => {
    // Thursday 2026-04-16 UTC noon
    const thu = new Date(Date.UTC(2026, 3, 16, 12, 0, 0))
    const fri = addBusinessDays(thu, 1)
    expect(fri.getUTCDay()).toBe(5)

    // Friday + 1 business day → Monday
    const mon = addBusinessDays(thu, 2)
    expect(mon.getUTCDay()).toBe(1)
  })
})

describe("PDP badge labels", () => {
  const rules = {
    cutoffHourLocal: 14,
    cutoffMinuteLocal: 0,
    standardMaxBusinessDays: 5,
    standardMinDays: 3,
    standardMaxDays: 5,
    expressMinDays: 1,
    expressMaxDays: 2,
  }

  it("formats standard and express badge copy", () => {
    const enDash = "\u2013"
    expect(formatPdpStandardBadgeLabel(rules)).toBe(`Standard · 3${enDash}5 business days`)
    expect(formatPdpExpressBadgeLabel(rules)).toBe(`Express · 1${enDash}2 business days`)
  })
})
