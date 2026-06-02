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
})
