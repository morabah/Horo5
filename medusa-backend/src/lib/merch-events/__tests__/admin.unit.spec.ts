import { buildAdminMerchEvent, normalizeMerchEventInput } from "../admin"

describe("buildAdminMerchEvent", () => {
  it("builds a complete event from a record", () => {
    const result = buildAdminMerchEvent({
      id: "me_1",
      slug: "summer-drop",
      name: "Summer Drop",
      type: "campaign",
      status: "active",
      starts_at: "2026-06-01T00:00:00Z",
      ends_at: "2026-06-30T23:59:59Z",
      sort_order: 1,
      active: true,
      product_handles: ["t-shirt-1", "hoodie-2"],
      occasion_slug: "summer",
    })

    expect(result.id).toBe("me_1")
    expect(result.slug).toBe("summer-drop")
    expect(result.name).toBe("Summer Drop")
    expect(result.type).toBe("campaign")
    expect(result.status).toBe("active")
    expect(result.startsAt).toBe("2026-06-01T00:00:00.000Z")
    expect(result.endsAt).toBe("2026-06-30T23:59:59.000Z")
    expect(result.sortOrder).toBe(1)
    expect(result.active).toBe(true)
    expect(result.productHandles).toEqual(["t-shirt-1", "hoodie-2"])
    expect(result.occasionSlug).toBe("summer")
  })

  it("falls back to defaults for minimal record", () => {
    const result = buildAdminMerchEvent({ id: "me_2" })
    expect(result.type).toBe("campaign")
    expect(result.status).toBe("scheduled")
    expect(result.active).toBe(true)
    expect(result.sortOrder).toBe(0)
    expect(result.productHandles).toEqual([])
  })

  it("sanitizes invalid type to campaign", () => {
    const result = buildAdminMerchEvent({ id: "me_3", type: "INVALID!!!" })
    expect(result.type).toBe("campaign")
  })

  it("sanitizes invalid status to scheduled", () => {
    const result = buildAdminMerchEvent({ id: "me_4", status: "unknown" })
    expect(result.status).toBe("scheduled")
  })

  it("deduplicates product handles", () => {
    const result = buildAdminMerchEvent({
      id: "me_5",
      product_handles: ["a", "a", "b", "a"],
    })
    expect(result.productHandles).toEqual(["a", "b"])
  })

  it("serializes Date objects", () => {
    const result = buildAdminMerchEvent({
      id: "me_6",
      starts_at: new Date("2026-01-01T00:00:00Z"),
    })
    expect(result.startsAt).toBe("2026-01-01T00:00:00.000Z")
  })
})

describe("normalizeMerchEventInput", () => {
  it("validates required fields on create", () => {
    const result = normalizeMerchEventInput({})
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.length).toBeGreaterThan(0)
    const fields = result.issues.map((i) => i.field)
    expect(fields).toContain("slug")
    expect(fields).toContain("name")
  })

  it("accepts valid create input", () => {
    const result = normalizeMerchEventInput({
      slug: "new-drop",
      name: "New Drop",
      type: "campaign",
      status: "draft",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.slug).toBe("new-drop")
    expect(result.data.name).toBe("New Drop")
    expect(result.data.type).toBe("campaign")
    expect(result.data.status).toBe("draft")
  })

  it("rejects invalid type", () => {
    const result = normalizeMerchEventInput({
      slug: "drop-1",
      name: "Drop",
      type: "INVALID!!!" as any,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "type")).toBe(true)
  })

  it("rejects invalid status transition", () => {
    const result = normalizeMerchEventInput(
      { slug: "drop-1", name: "Drop", status: "active" as any },
      { mode: "update", existing: { status: "archived" } as any }
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "status" && i.message.includes("Cannot transition"))).toBe(true)
  })

  it("allows valid status transition", () => {
    const result = normalizeMerchEventInput(
      { slug: "drop-1", name: "Drop", status: "archived" as any },
      { mode: "update", existing: { status: "active" } as any }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe("archived")
  })

  it("rejects invalid slug characters", () => {
    const result = normalizeMerchEventInput({
      slug: "bad slug!",
      name: "Bad",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "slug")).toBe(true)
  })

  it("parses dates on create", () => {
    const result = normalizeMerchEventInput({
      slug: "drop-1",
      name: "Drop",
      starts_at: "2026-06-01T00:00:00Z",
      ends_at: "2026-06-30T23:59:59Z",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.starts_at).toBe("2026-06-01T00:00:00.000Z")
    expect(result.data.ends_at).toBe("2026-06-30T23:59:59.000Z")
  })

  it("rejects invalid dates", () => {
    const result = normalizeMerchEventInput({
      slug: "drop-1",
      name: "Drop",
      starts_at: "not-a-date",
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues.some((i) => i.field === "starts_at")).toBe(true)
  })

  it("allows partial updates without requiring slug/name", () => {
    const result = normalizeMerchEventInput(
      { status: "active" as any },
      { mode: "update", existing: { status: "draft", slug: "drop-1", name: "Drop" } as any }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.status).toBe("active")
    expect(result.data.slug).toBeUndefined()
    expect(result.data.name).toBeUndefined()
  })
})
