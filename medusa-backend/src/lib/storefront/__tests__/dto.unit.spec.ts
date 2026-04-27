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
})
