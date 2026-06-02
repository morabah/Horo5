import {
  parseHomepagePresentation,
  mergePresentationIntoPayload,
} from "../presentation"

describe("parseHomepagePresentation", () => {
  it("reads payload.presentation fields", () => {
    expect(
      parseHomepagePresentation({
        presentation: {
          layout: "image_overlay",
          textPlacement: "bottom-left",
          overlayOpacity: 0.4,
          showBody: false,
        },
      }),
    ).toMatchObject({
      layout: "image_overlay",
      textPlacement: "bottom-left",
      overlayOpacity: 0.4,
      showBody: false,
    })
  })

  it("maps legacy layout editorial to image_overlay", () => {
    expect(parseHomepagePresentation({ layout: "editorial" })).toMatchObject({
      layout: "image_overlay",
    })
  })

  it("prefers explicit presentation.layout over legacy layout", () => {
    expect(
      parseHomepagePresentation({
        layout: "editorial",
        presentation: { layout: "split" },
      }),
    ).toMatchObject({ layout: "split" })
  })
})

describe("mergePresentationIntoPayload", () => {
  it("merges presentation without dropping other keys", () => {
    expect(
      mergePresentationIntoPayload({ limit: 5 }, { showBody: false }),
    ).toEqual({
      limit: 5,
      presentation: { showBody: false },
    })
  })
})
