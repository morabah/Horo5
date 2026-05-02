import { storefrontProductSchema } from "../dto"
import type { StorefrontProductDTO } from "../types"

const baseProduct: StorefrontProductDTO = {
  artistSlug: "artist",
  feelingSlug: "mood",
  name: "Tagged Proof Tee",
  occasionSlugs: [],
  primaryFeelingSlug: "mood",
  primarySubfeelingSlug: "",
  priceEgp: 900,
  slug: "tagged-proof-tee",
  story: "",
  variantsBySize: {},
}

describe("storefront DTO schemas", () => {
  it("allows tagged gallery proof images on product media", () => {
    const parsed = storefrontProductSchema.parse({
      ...baseProduct,
      media: {
        main: "https://cdn.example.com/main.jpg",
        gallery: [
          { url: "https://cdn.example.com/fabric.jpg", tag: "proof_fabric" },
          { url: "https://cdn.example.com/wash.jpg", tag: "proof_wash" },
        ],
      },
    })

    expect(parsed.media?.gallery?.[0]).toEqual({
      url: "https://cdn.example.com/fabric.jpg",
      tag: "proof_fabric",
    })
  })

  it("allows localized product promo metadata", () => {
    const parsed = storefrontProductSchema.parse({
      ...baseProduct,
      promoLabel: { en: "Eid Sale", ar: "خصم العيد" },
      promoStartsAt: "2026-05-03T10:00:00.000Z",
      promoEndsAt: "2026-05-05T10:00:00.000Z",
      promoShowCountdown: false,
    })

    expect(parsed.promoLabel).toEqual({ en: "Eid Sale", ar: "خصم العيد" })
    expect(parsed.promoShowCountdown).toBe(false)
  })

  it("keeps legacy string promo labels valid", () => {
    const parsed = storefrontProductSchema.parse({
      ...baseProduct,
      promoLabel: "Eid Sale",
    })

    expect(parsed.promoLabel).toBe("Eid Sale")
  })
})
