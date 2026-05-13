import { isReviewStatus, validateReviewStatusTransition } from "../admin"

describe("validateReviewStatusTransition", () => {
  it("allows same-status transitions", () => {
    expect(validateReviewStatusTransition("pending", "pending")).toBe(true)
    expect(validateReviewStatusTransition("approved", "approved")).toBe(true)
    expect(validateReviewStatusTransition("rejected", "rejected")).toBe(true)
  })

  it("allows pending to approved or rejected", () => {
    expect(validateReviewStatusTransition("pending", "approved")).toBe(true)
    expect(validateReviewStatusTransition("pending", "rejected")).toBe(true)
  })

  it("allows approved to pending or rejected", () => {
    expect(validateReviewStatusTransition("approved", "pending")).toBe(true)
    expect(validateReviewStatusTransition("approved", "rejected")).toBe(true)
  })

  it("allows rejected to pending or approved", () => {
    expect(validateReviewStatusTransition("rejected", "pending")).toBe(true)
    expect(validateReviewStatusTransition("rejected", "approved")).toBe(true)
  })

  it("rejects invalid transitions", () => {
    expect(validateReviewStatusTransition("approved", "unknown" as any)).toBe(false)
  })
})

describe("isReviewStatus", () => {
  it("returns true for valid statuses", () => {
    expect(isReviewStatus("pending")).toBe(true)
    expect(isReviewStatus("approved")).toBe(true)
    expect(isReviewStatus("rejected")).toBe(true)
  })

  it("returns false for invalid values", () => {
    expect(isReviewStatus("spam")).toBe(false)
    expect(isReviewStatus(123)).toBe(false)
    expect(isReviewStatus(null)).toBe(false)
    expect(isReviewStatus(undefined)).toBe(false)
  })
})
