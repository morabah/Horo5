import { buildHomepageSection } from "../homepage"
import { DEFAULT_HOMEPAGE_SECTIONS } from "../../homepage-sections/defaults"

describe("storefront homepage sections", () => {
  it("projects localized copy, CTA, image, payload, and ordering fields", () => {
    expect(
      buildHomepageSection({
        id: "hps_1",
        key: "hero",
        type: "hero",
        body_en: "Artist-made tees",
        body_ar: "تيشيرتات فنانين",
        primary_cta_label_en: "Shop",
        primary_cta_href: "/products",
        image_src: "/hero.png",
        image_alt_en: "Hero image",
        payload: { tone: "launch" },
        sort_order: 10,
        active: true,
      })
    ).toMatchObject({
      key: "hero",
      body: { en: "Artist-made tees", ar: "تيشيرتات فنانين" },
      primaryCta: { label: { en: "Shop" }, href: "/products" },
      image: { src: "/hero.png", alt: { en: "Hero image" } },
      payload: { tone: "launch" },
      sortOrder: 10,
      active: true,
    })
  })

  it("keeps the seeded active homepage aligned with the compact web-next homepage", () => {
    const activeKeys = DEFAULT_HOMEPAGE_SECTIONS
      .filter((section) => section.active !== false)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((section) => section.key)

    expect(activeKeys).toEqual([
      "hero",
      "trust_ribbon",
      "founding_drop",
      "feeling_grid",
      "editorial_feature",
      "gift_block",
      "proof_strip",
      "why_horo",
    ])
  })
})
