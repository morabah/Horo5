import {
  derivePrimaryFeelingSlugsFromProductCategories,
  type FlatCategoryRow,
  validateProductFeelingCategoryAssignments,
  validateProductFeelingCategoryAssignmentsFlat,
} from "../feeling-category-tree"

describe("feeling-category-tree", () => {
  it("derives parent + sub slugs from a leaf under feelings", () => {
    const leaf = {
      handle: "i-care",
      parent_category: {
        handle: "mood",
        parent_category: {
          handle: "feelings",
          parent_category: null,
        },
      },
    }

    const derived = derivePrimaryFeelingSlugsFromProductCategories([leaf])
    expect(derived).toEqual({
      primaryFeelingSlug: "mood",
      primarySubfeelingSlug: "i-care",
    })
  })

  it("derives only parent when product sits on top-level feeling (no sub segment)", () => {
    const leaf = {
      handle: "mood",
      parent_category: {
        handle: "feelings",
        parent_category: null,
      },
    }

    const derived = derivePrimaryFeelingSlugsFromProductCategories([leaf])
    expect(derived).toEqual({
      primaryFeelingSlug: "mood",
      primarySubfeelingSlug: "",
    })
  })

  it("validates flat category map same as nested tree for a leaf under feelings", () => {
    const feelings = { id: "r", handle: "feelings", parent_category_id: null }
    const mood = { id: "m", handle: "mood", parent_category_id: "r" }
    const leaf = { id: "l", handle: "i-care", parent_category_id: "m" }
    const byId = new Map<string, FlatCategoryRow>([
      [feelings.id, feelings],
      [mood.id, mood],
      [leaf.id, leaf],
    ])
    const v = validateProductFeelingCategoryAssignmentsFlat([leaf.id], byId)
    expect(v.errors).toHaveLength(0)
    expect(v.feelingBranchCount).toBe(1)
  })

  it("flags multiple feeling-branch assignments", () => {
    const a = {
      handle: "a",
      parent_category: { handle: "mood", parent_category: { handle: "feelings", parent_category: null } },
    }
    const b = {
      handle: "b",
      parent_category: { handle: "zodiac", parent_category: { handle: "feelings", parent_category: null } },
    }

    const v = validateProductFeelingCategoryAssignments([a, b])
    expect(v.errors).toContain("multiple_feeling_branches")
  })
})
