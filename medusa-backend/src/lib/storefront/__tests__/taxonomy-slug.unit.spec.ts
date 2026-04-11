import { validateTaxonomySlug } from "../taxonomy-slug"

describe("validateTaxonomySlug", () => {
  it("accepts valid kebab slugs", () => {
    expect(validateTaxonomySlug("mood")).toBeNull()
    expect(validateTaxonomySlug("gift-something-real")).toBeNull()
    expect(validateTaxonomySlug("ab")).toBeNull()
  })

  it("rejects invalid slugs", () => {
    expect(validateTaxonomySlug("")).not.toBeNull()
    expect(validateTaxonomySlug("a")).not.toBeNull()
    expect(validateTaxonomySlug("BadCase")).not.toBeNull()
    expect(validateTaxonomySlug("double--hyphen")).not.toBeNull()
  })
})
