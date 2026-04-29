import {
  filenameToDropImageTag,
  normalizeDropImages,
  slugifyDropTitle,
  validateDropPayload,
} from "../validate"

describe("drop validators", () => {
  it("slugifies titles for handles", () => {
    expect(slugifyDropTitle("Quiet Revolt Tee")).toBe("quiet-revolt-tee")
    expect(slugifyDropTitle("  Mood: I Care!! ")).toBe("mood-i-care")
  })

  it("maps filenames to image tags", () => {
    expect(filenameToDropImageTag("main.jpg")).toBe("main")
    expect(filenameToDropImageTag("lifestyle-1.webp")).toBe("lifestyle")
    expect(filenameToDropImageTag("flat_lay.png")).toBe("flat_lay")
    expect(filenameToDropImageTag("proof_print-close.jpg")).toBe("proof_print")
    expect(filenameToDropImageTag("detail.jpg")).toBeUndefined()
  })

  it("requires publish-ready fields and a main image", () => {
    const issues = validateDropPayload({
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "published",
      priceEgp: 850,
      images: [{ url: "https://cdn.test/lifestyle.jpg", tag: "lifestyle" }],
    })

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "story" }),
      expect.objectContaining({ field: "feeling" }),
      expect.objectContaining({ field: "subfeeling" }),
      expect.objectContaining({ field: "images" }),
    ]))
  })

  it("validates stock quantities against selected sizes", () => {
    const issues = validateDropPayload({
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "draft",
      sizes: ["S"],
      stockPerSize: { S: 5, M: 2 },
    })

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "stockPerSize.M" }),
    ]))
  })

  it("rejects ambiguous main image tags", () => {
    const issues = validateDropPayload({
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "draft",
      images: [
        { url: "https://cdn.test/main-1.jpg", tag: "main" },
        { url: "https://cdn.test/main-2.jpg", tag: "main" },
      ],
    })

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "images", message: "Only one image can be tagged main." }),
    ]))
  })

  it("normalizes imagesByTag into ordered image inputs", () => {
    expect(normalizeDropImages({
      imagesByTag: {
        main: { url: "https://cdn.test/main.jpg" },
        gallery: [
          { url: "https://cdn.test/proof.jpg", tag: "proof_print", order: 2 },
          { url: "https://cdn.test/lifestyle.jpg", tag: "main", order: 1 },
        ],
      },
    })).toEqual([
      { url: "https://cdn.test/main.jpg", tag: "main", order: 0 },
      { url: "https://cdn.test/lifestyle.jpg", tag: "lifestyle", order: 1 },
      { url: "https://cdn.test/proof.jpg", tag: "proof_print", order: 2 },
    ])
  })

  it("validates whole-pound pricing", () => {
    const issues = validateDropPayload({
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "draft",
      priceEgp: 120.5,
      originalPriceEgp: -1,
    })

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "priceEgp" }),
      expect.objectContaining({ field: "originalPriceEgp" }),
    ]))
  })
})
