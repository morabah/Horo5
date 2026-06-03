import { buildImageLedSectionPatch, mergePresentationPayload } from "../image-led-sync"

describe("mergePresentationPayload", () => {
  it("fills missing fields on partial presentation objects", () => {
    const merged = mergePresentationPayload("founding_drop", {
      presentation: { showBody: true },
      limit: 5,
    })

    expect(merged).toBeDefined()
    expect(merged?.presentation).toMatchObject({
      layout: "image_overlay",
      showBody: true,
    })
    expect(merged?.limit).toBe(5)
  })

  it("returns undefined when presentation already matches merged defaults", () => {
    const payload = {
      presentation: {
        layout: "image_overlay",
        textPlacement: "bottom-left",
        showBody: false,
        showEyebrow: true,
        overlayOpacity: 0.45,
        mobileTextMode: "below",
      },
    }
    expect(mergePresentationPayload("founding_drop", payload)).toBeUndefined()
  })
})

describe("buildImageLedSectionPatch", () => {
  it("returns only changed fields", () => {
    const patch = buildImageLedSectionPatch(
      {
        key: "gift_block",
        title_en: "More than a gift.",
        body_en:
          "It's a feeling they'll wear. Thoughtful designs for birthdays, anniversaries, graduations, and just because.",
        payload: {},
      },
      {
        key: "gift_block",
        type: "gift_block",
        sort_order: 45,
        active: true,
        title_en: "More than a gift.",
        body_en: "A feeling they'll wear.",
      },
      {
        body_en:
          "It's a feeling they'll wear. Thoughtful designs for birthdays, anniversaries, graduations, and just because.",
      },
    )

    expect(patch).toMatchObject({
      body_en: "A feeling they'll wear.",
    })
    expect(patch).not.toHaveProperty("title_en")
    expect(patch?.payload?.presentation).toBeDefined()
  })

  it("fills missing founding_drop secondary CTA from seed", () => {
    const patch = buildImageLedSectionPatch(
      {
        key: "founding_drop",
        title_en: "Our first 5 pieces. Limited quantities.",
        payload: {
          presentation: {
            layout: "image_overlay",
            textPlacement: "bottom-left",
            showBody: false,
            showEyebrow: true,
            overlayOpacity: 0.45,
            mobileTextMode: "below",
          },
        },
      },
      {
        key: "founding_drop",
        type: "founding_drop",
        sort_order: 30,
        active: true,
        secondary_cta_label_en: "A Closer Look",
        secondary_cta_label_ar: "نظرة أقرب",
        secondary_cta_href: "/#editorial-feature",
      },
      undefined,
    )

    expect(patch).toMatchObject({
      secondary_cta_label_en: "A Closer Look",
      secondary_cta_href: "/#editorial-feature",
    })
  })
})
