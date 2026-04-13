import { feelingLineMatchesAssignments } from "../../../../../web/src/data/feelingLineBrowse"

describe("feelingLineMatchesAssignments (Medusa line parity)", () => {
  it("returns false when assignments are missing even if primary would say fire-sign", () => {
    expect(feelingLineMatchesAssignments(undefined, "zodiac", "fire-sign")).toBe(false)
    expect(feelingLineMatchesAssignments([], "zodiac", "fire-sign")).toBe(false)
  })

  it("matches only when a Medusa-derived assignment includes the pillar and leaf", () => {
    expect(
      feelingLineMatchesAssignments(
        [{ feelingSlug: "zodiac", subfeelingSlug: "fire-sign" }],
        "zodiac",
        "fire-sign"
      )
    ).toBe(true)
  })

  it("does not match fire line when assignments only place the product on earth-sign", () => {
    expect(
      feelingLineMatchesAssignments(
        [{ feelingSlug: "zodiac", subfeelingSlug: "earth-sign" }],
        "zodiac",
        "fire-sign"
      )
    ).toBe(false)
  })
})
