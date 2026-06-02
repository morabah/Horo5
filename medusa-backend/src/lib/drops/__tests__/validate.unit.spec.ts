import {
  filenameToDropImageTag,
  normalizeDropImages,
  slugifyDropTitle,
  validateDropPayload,
} from "../validate"
import type { UpsertDropPayload } from "../types"

function publishReadyDrop(overrides: Partial<UpsertDropPayload> = {}): UpsertDropPayload {
  return {
    handle: "quiet-revolt",
    title: "Quiet Revolt",
    status: "published",
    story: "A tee about quiet confidence.",
    feeling: "confidence",
    subfeeling: "quiet-revolt",
    artist: "nada-ibrahim",
    priceEgp: 850,
    sizeTableKey: "regular",
    fitLabel: "Regular fit",
    stockPerSize: { S: 0, M: 8, L: 3 },
    images: [
      { url: "https://cdn.test/main.jpg", tag: "main" },
      { url: "https://cdn.test/lifestyle.jpg", tag: "lifestyle" },
      { url: "https://cdn.test/flat.jpg", tag: "flat_lay" },
      { url: "https://cdn.test/fabric.jpg", tag: "proof_fabric" },
      { url: "https://cdn.test/print.jpg", tag: "proof_print" },
    ],
    artistRightsApproved: true,
    artistCreditApproved: true,
    samplePrintApproved: true,
    productPhotosApproved: true,
    buyerRoute: "feeling",
    primaryAudience: "25-40",
    firstWedgeEligible: true,
    giftable: true,
    giftOccasionTags: ["birthday"],
    giftTrustCopy: "Gift packaging is being tested. Current orders include standard HORO packaging.",
    ...overrides,
  }
}

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
    expect(filenameToDropImageTag("gift-box.jpg")).toBe("gift")
    expect(filenameToDropImageTag("packaging-front.png")).toBe("gift")
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

  it("allows draft drops to omit V1.4 readiness fields", () => {
    const issues = validateDropPayload({
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "draft",
    })

    expect(issues).toEqual([])
  })

  it("fails published drops without proof images", () => {
    const issues = validateDropPayload(publishReadyDrop({
      images: [{ url: "https://cdn.test/main.jpg", tag: "main" }],
    }))

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "images.lifestyle", message: "Lifestyle/on-body image is required before publishing." }),
      expect.objectContaining({ field: "images.flat_lay", message: "Flat-lay image is required before publishing." }),
      expect.objectContaining({ field: "images.proof_fabric", message: "Fabric proof image is required before publishing." }),
      expect.objectContaining({ field: "images.proof_print", message: "Print proof image is required before publishing." }),
    ]))
  })

  it("fails published drops without artist rights approval", () => {
    const issues = validateDropPayload(publishReadyDrop({ artistRightsApproved: false }))

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "artistRightsApproved", message: "Artist rights must be approved before publishing." }),
    ]))
  })

  it("fails published drops without sample approval", () => {
    const issues = validateDropPayload(publishReadyDrop({ samplePrintApproved: false }))

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "samplePrintApproved", message: "Sample print must be approved before publishing." }),
    ]))
  })

  it("fails published drops without stock", () => {
    const issues = validateDropPayload(publishReadyDrop({ stockPerSize: { S: 0, M: 0, L: 0 } }))

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "stockPerSize", message: "Stock per size is required before publishing." }),
    ]))
  })

  it("passes published drops when all V1.4 fields are present", () => {
    expect(validateDropPayload(publishReadyDrop())).toEqual([])
  })

  it("fails first-wedge eligible drops outside feeling, moment, or gift routes", () => {
    for (const buyerRoute of ["personality", "world", "artist_drop"] as const) {
      const issues = validateDropPayload(publishReadyDrop({ buyerRoute, firstWedgeEligible: true }))

      expect(issues).toEqual(expect.arrayContaining([
        expect.objectContaining({
          field: "firstWedgeEligible",
          message: "First-wedge products must use buyer route feeling, moment, or gift.",
        }),
      ]))
    }
  })

  it("fails giftable published drops without giftTrustCopy", () => {
    const issues = validateDropPayload(publishReadyDrop({ giftTrustCopy: "" }))

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "giftTrustCopy", message: "Giftable products must have gift trust copy before publishing." }),
    ]))
  })

  it("fails giftable published drops with non-gift buyer route when not first-wedge eligible", () => {
    const issues = validateDropPayload(
      publishReadyDrop({ buyerRoute: "personality", firstWedgeEligible: false })
    )

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "giftable",
        message: "Giftable products must use buyer route 'gift' or be first-wedge eligible.",
      }),
    ]))
  })

  it("passes giftable published drops with buyer route 'gift'", () => {
    expect(validateDropPayload(publishReadyDrop({ buyerRoute: "gift" }))).toEqual([])
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
