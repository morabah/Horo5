import { DEFAULT_HOMEPAGE_SECTIONS } from "../../homepage-sections/defaults"
import { parseHomepagePresentation } from "../../homepage-sections/presentation"
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

  it("seeds image-led presentation on campaign sections", () => {
    for (const key of ["founding_drop", "editorial_feature", "gift_block", "why_horo"] as const) {
      const section = DEFAULT_HOMEPAGE_SECTIONS.find((row) => row.key === key)
      const presentation = parseHomepagePresentation(
        section?.payload as Record<string, unknown> | undefined,
      )
      expect(presentation.layout).toBe("image_overlay")
    }

    const founding = DEFAULT_HOMEPAGE_SECTIONS.find((row) => row.key === "founding_drop")
    expect(parseHomepagePresentation(founding?.payload as Record<string, unknown>).showBody).toBe(
      false,
    )

    const story = DEFAULT_HOMEPAGE_SECTIONS.find((row) => row.key === "why_horo")
    expect(parseHomepagePresentation(story?.payload as Record<string, unknown>).showPillars).toBe(
      false,
    )
  })
})
