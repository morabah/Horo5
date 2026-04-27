import { buildHomepageSection } from "../homepage"

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
})
