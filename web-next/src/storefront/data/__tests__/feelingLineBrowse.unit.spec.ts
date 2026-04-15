import { feelingLineMatchesAssignments } from "../feelingLineBrowse"

describe("feelingLineMatchesAssignments", () => {
  const assignments = [
    { feelingSlug: "mood", subfeelingSlug: "overthinking" },
    { feelingSlug: "trends", subfeelingSlug: "streetwear" },
  ]

  it("returns true when pillar + line match after legacy slug resolution", () => {
    expect(feelingLineMatchesAssignments(assignments, "emotions", "overthinking")).toBe(true)
  })

  it("returns false when line does not match", () => {
    expect(feelingLineMatchesAssignments(assignments, "mood", "numb")).toBe(false)
  })

  it("returns false for empty or missing assignments", () => {
    expect(feelingLineMatchesAssignments(undefined, "mood", "overthinking")).toBe(false)
    expect(feelingLineMatchesAssignments([], "mood", "overthinking")).toBe(false)
  })
})
