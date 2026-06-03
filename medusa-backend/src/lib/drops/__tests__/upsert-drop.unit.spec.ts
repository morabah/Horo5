import { buildDropMetadata } from "../upsert-drop"
import { normalizeDropImages } from "../validate"
import type { ProductSizeKey } from "../types"

describe("drop upsert metadata", () => {
  it("keeps the HORO product metadata shape stable", () => {
    const payload = {
      handle: "quiet-revolt",
      title: "Quiet Revolt",
      status: "published" as const,
      story: "A quiet statement tee.",
      feeling: "streetwear",
      subfeeling: "statement",
      occasions: ["launch-day"],
      apparelCategory: "apparel/tops/t-shirts",
      priceEgp: 850,
      originalPriceEgp: 950,
      sizes: ["S", "M", "L"] as ProductSizeKey[],
      garmentColor: "Black",
      artist: "nada-ibrahim",
      decorationType: "graphic" as const,
      fitLabel: "Regular fit",
      trustBadges: ["premium cotton"],
      merchandisingBadge: "New",
      stockNote: "Limited run",
      sizeTableKey: "tee-standard",
      images: [
        { url: "https://cdn.test/main.jpg", tag: "main" as const },
        { url: "https://cdn.test/proof.jpg", tag: "proof_print" as const },
      ],
      capsuleSlugs: ["summer-capsule"],
      complementarySlugs: ["quiet-cap"],
      frequentlyBoughtWithSlugs: ["gift-wrap"],
      customersAlsoBoughtSlugs: ["plain-black-tee"],
      launchAt: "2026-05-01T00:00:00.000Z",
      sunsetAt: "2026-06-01T00:00:00.000Z",
    }

    expect(buildDropMetadata(
      payload,
      "published",
      ["S", "M", "L"],
      normalizeDropImages(payload),
      { name: "Nada Ibrahim", avatarUrl: "https://cdn.test/nada.jpg" },
    )).toMatchInlineSnapshot(`
{
  "apparelCategoryPath": "apparel/tops/t-shirts",
  "archived": false,
  "artist": {
    "avatarUrl": "https://cdn.test/nada.jpg",
    "name": "Nada Ibrahim",
  },
  "artistCreditApproved": false,
  "artistPaymentModel": "unknown",
  "artistRightsApproved": false,
  "artistSlug": "nada-ibrahim",
  "artworkSlug": "quiet-revolt",
  "availableSizes": [
    "S",
    "M",
    "L",
  ],
  "buyerRoute": null,
  "capsuleSlugs": [
    "summer-capsule",
  ],
  "catalogOrder": 0,
  "complementarySlugs": [
    "quiet-cap",
  ],
  "conceptApprovedAt": null,
  "customersAlsoBoughtSlugs": [
    "plain-black-tee",
  ],
  "decorationType": "graphic",
  "feelingSlug": "streetwear",
  "firstWedgeEligible": false,
  "fitLabel": "Regular fit",
  "frequentlyBoughtWithSlugs": [
    "gift-wrap",
  ],
  "garmentColors": [
    "Black",
  ],
  "giftOccasionTags": [],
  "giftable": false,
  "hasFlatLayImage": false,
  "hasLifestyleImage": false,
  "hasProofFabricImage": false,
  "hasProofPrintImage": true,
  "hasProofWashImage": false,
  "launchAt": "2026-05-01T00:00:00.000Z",
  "media": {
    "card": "https://cdn.test/main.jpg",
    "gallery": [
      {
        "tag": "proof_print",
        "url": "https://cdn.test/proof.jpg",
      },
    ],
    "main": "https://cdn.test/main.jpg",
  },
  "merchandisingBadge": "New",
  "mockupApprovedAt": null,
  "occasionSlugs": [
    "launch-day",
  ],
  "originalPriceEgp": 950,
  "priceEgp": 850,
  "primaryAudience": null,
  "primaryOccasionSlug": "launch-day",
  "printReadyApprovedAt": null,
  "productPhotosApproved": false,
  "samplePrintApproved": false,
  "samplePrintApprovedAt": null,
  "sizeTableKey": "tee-standard",
  "sketchApprovedAt": null,
  "stockNote": "Limited run",
  "story": "A quiet statement tee.",
  "sunsetAt": "2026-06-01T00:00:00.000Z",
  "trustBadges": [
    "premium cotton",
  ],
  "usageScope": null,
}
`)
  })
})
