import {
  buildAdminHomepageSection,
  normalizeHomepageSectionInput,
  validateHomepageSectionInput,
  homepageSectionInputToRecord,
  adminHomepageSectionToInput,
} from "../admin"

describe("buildAdminHomepageSection", () => {
  it("maps a complete record", () => {
    const result = buildAdminHomepageSection({
      id: "hs_1",
      key: "hero-summer",
      type: "hero",
      title_en: "Summer Drop",
      title_ar: "تشكيلة الصيف",
      body_en: "Hot season ahead.",
      sort_order: 2,
      active: true,
      payload: { items: ["a", "b"] },
      created_at: "2026-01-01T00:00:00Z",
    })

    expect(result.id).toBe("hs_1")
    expect(result.key).toBe("hero-summer")
    expect(result.type).toBe("hero")
    expect(result.titleEn).toBe("Summer Drop")
    expect(result.titleAr).toBe("تشكيلة الصيف")
    expect(result.bodyEn).toBe("Hot season ahead.")
    expect(result.bodyAr).toBeNull()
    expect(result.sortOrder).toBe(2)
    expect(result.active).toBe(true)
    expect(result.payload).toEqual({ items: ["a", "b"] })
    expect(result.createdAt).toBe("2026-01-01T00:00:00.000Z")
  })

  it("defaults type to hero when invalid", () => {
    const result = buildAdminHomepageSection({ id: "hs_2", type: "unknown" })
    expect(result.type).toBe("hero")
  })

  it("defaults active to true when null/undefined", () => {
    const result = buildAdminHomepageSection({ id: "hs_3" })
    expect(result.active).toBe(true)
  })

  it("sets active to false when explicitly false", () => {
    const result = buildAdminHomepageSection({ id: "hs_4", active: false })
    expect(result.active).toBe(false)
  })
})

describe("normalizeHomepageSectionInput", () => {
  it("validates required fields on create", () => {
    const result = normalizeHomepageSectionInput({})
    expect(result.ok).toBe(false)
    if (result.ok) return
    const fields = result.issues.map((i) => i.field)
    expect(fields).toContain("key")
    expect(fields).toContain("title_en")
    expect(fields).toContain("primary_cta_href")
  })

  it("accepts a valid hero section", () => {
    const result = normalizeHomepageSectionInput({
      key: "hero-1",
      type: "hero",
      title_en: "Welcome",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop Now",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.key).toBe("hero-1")
    expect(result.data.type).toBe("hero")
  })

  it("rejects hero without title", () => {
    const result = normalizeHomepageSectionInput({
      key: "hero-1",
      type: "hero",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "title_en")).toBe(true)
  })

  it("rejects invalid key format", () => {
    const result = normalizeHomepageSectionInput({
      key: "a",
      type: "hero",
      title_en: "Welcome",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "key")).toBe(true)
  })

  it("rejects invalid type", () => {
    const result = normalizeHomepageSectionInput({
      key: "hero-1",
      type: "invalid" as any,
      title_en: "Welcome",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "type")).toBe(true)
  })

  it("validates trust_ribbon needs body or items", () => {
    const result = normalizeHomepageSectionInput({
      key: "trust-1",
      type: "trust_ribbon",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "body_en")).toBe(true)
  })

  it("accepts trust_ribbon with payload items", () => {
    const result = normalizeHomepageSectionInput({
      key: "trust-1",
      type: "trust_ribbon",
      payload: { items: [{ label: "Free shipping" }] },
    })
    expect(result.ok).toBe(true)
  })

  it("rejects non-object payload", () => {
    const result = normalizeHomepageSectionInput({
      key: "hero-1",
      type: "hero",
      title_en: "Welcome",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop",
      payload: "not-an-object" as any,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "payload")).toBe(true)
  })

  it("allows partial updates without requiring key", () => {
    const result = normalizeHomepageSectionInput(
      { title_en: "Updated", primary_cta_href: "/shop", primary_cta_label_en: "Go" },
      "update"
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.title_en).toBe("Updated")
    expect(result.data.key).toBeUndefined()
  })
})

describe("validateHomepageSectionInput", () => {
  it("returns empty for valid input", () => {
    expect(
      validateHomepageSectionInput({
        key: "hero-1",
        type: "hero",
        title_en: "Welcome",
        primary_cta_href: "/shop",
        primary_cta_label_en: "Shop",
      })
    ).toEqual([])
  })

  it("returns issues for invalid input", () => {
    const issues = validateHomepageSectionInput({})
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe("homepageSectionInputToRecord", () => {
  it("round-trips through buildAdminHomepageSection", () => {
    const input = {
      key: "hero-1",
      type: "hero" as const,
      title_en: "Welcome",
      primary_cta_href: "/shop",
      primary_cta_label_en: "Shop",
    }
    const record = homepageSectionInputToRecord(input)
    expect(record.key).toBe("hero-1")
    expect(record.title_en).toBe("Welcome")
    expect(record.type).toBe("hero")
  })
})

describe("adminHomepageSectionToInput", () => {
  it("converts admin section back to input shape", () => {
    const admin = buildAdminHomepageSection({
      id: "hs_1",
      key: "hero-1",
      type: "hero",
      title_en: "Welcome",
    })
    const input = adminHomepageSectionToInput(admin)
    expect(input.key).toBe("hero-1")
    expect(input.type).toBe("hero")
    expect(input.title_en).toBe("Welcome")
  })
})
