import {
  isBackLikeMediaUrl,
  orderGalleryByTags,
  pickDropFrontMediaUrls,
  PDP_GALLERY_TAG_PRIORITY,
} from "../media-picks"
import type { DropImageInput } from "../../drops/types"

function image(tag: DropImageInput["tag"], url: string): DropImageInput {
  return { tag, url, filename: `${tag}.jpg` }
}

describe("isBackLikeMediaUrl", () => {
  it("matches back, rear, backview, back-view, and flat_lay URL shapes", () => {
    expect(isBackLikeMediaUrl("https://cdn.example/tee-backview.jpg")).toBe(true)
    expect(isBackLikeMediaUrl("https://cdn.example/tee-back-view.jpg")).toBe(true)
    expect(isBackLikeMediaUrl("https://cdn.example/product_rear.png")).toBe(true)
    expect(isBackLikeMediaUrl("https://cdn.example/flat_lay.png")).toBe(true)
    expect(isBackLikeMediaUrl("https://cdn.example/flat-lay.png")).toBe(true)
    expect(isBackLikeMediaUrl("https://cdn.example/front-artwork.png")).toBe(false)
  })
})

describe("pickDropFrontMediaUrls", () => {
  it("prefers artwork_detail over back-tagged main for card", () => {
    const picked = pickDropFrontMediaUrls([
      image("main", "https://cdn.example/product-back.png"),
      image("back", "https://cdn.example/product-back.png"),
      image("artwork_detail", "https://cdn.example/art-front.png"),
      image("lifestyle", "https://cdn.example/on-body.jpg"),
    ])

    expect(picked.card).toBe("https://cdn.example/art-front.png")
    expect(picked.main).toBe("https://cdn.example/art-front.png")
  })

  it("rejects backview filename for main when card alternatives exist", () => {
    const picked = pickDropFrontMediaUrls([
      image("main", "https://cdn.example/quiet-revolt-backview.jpg"),
      image("lifestyle", "https://cdn.example/on-body-front.jpg"),
    ])

    expect(picked.card).toBe("https://cdn.example/on-body-front.jpg")
    expect(picked.main).toBe("https://cdn.example/on-body-front.jpg")
  })
})

describe("orderGalleryByTags", () => {
  it("orders main, lifestyle, then artwork_detail before back", () => {
    const ordered = orderGalleryByTags(
      [
        { url: "https://cdn.example/back.jpg", tag: "back" },
        { url: "https://cdn.example/lifestyle.jpg", tag: "lifestyle" },
        { url: "https://cdn.example/detail.jpg", tag: "artwork_detail" },
      ],
      { mainUrl: "https://cdn.example/main-front.jpg" },
    )

    expect(ordered.map((item) => item.url)).toEqual([
      "https://cdn.example/main-front.jpg",
      "https://cdn.example/lifestyle.jpg",
      "https://cdn.example/detail.jpg",
      "https://cdn.example/back.jpg",
    ])
  })

  it("places safe untagged images before tagged back", () => {
    const ordered = orderGalleryByTags(
      [
        { url: "https://cdn.example/back-tagged.jpg", tag: "back" },
        { url: "https://cdn.example/untagged-front.jpg" },
      ],
      { mainUrl: null },
    )

    expect(ordered.map((item) => item.url)).toEqual([
      "https://cdn.example/untagged-front.jpg",
      "https://cdn.example/back-tagged.jpg",
    ])
  })

  it("places back-like untagged URLs after tagged gallery", () => {
    const ordered = orderGalleryByTags(
      [
        { url: "https://cdn.example/lifestyle.jpg", tag: "lifestyle" },
        { url: "https://cdn.example/tee-backview.jpg" },
      ],
      { mainUrl: null },
    )

    expect(ordered.map((item) => item.url)).toEqual([
      "https://cdn.example/lifestyle.jpg",
      "https://cdn.example/tee-backview.jpg",
    ])
  })

  it("exports PDP tag priority with lifestyle before artwork_detail", () => {
    expect(PDP_GALLERY_TAG_PRIORITY.indexOf("lifestyle")).toBeLessThan(
      PDP_GALLERY_TAG_PRIORITY.indexOf("artwork_detail"),
    )
    expect(PDP_GALLERY_TAG_PRIORITY.indexOf("back")).toBeLessThan(PDP_GALLERY_TAG_PRIORITY.indexOf("gift"))
  })
})
