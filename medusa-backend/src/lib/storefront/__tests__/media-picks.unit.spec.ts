import { pickDropFrontMediaUrls } from "../media-picks"
import type { DropImageInput } from "../../drops/types"

function image(tag: DropImageInput["tag"], url: string): DropImageInput {
  return { tag, url, filename: `${tag}.jpg` }
}

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
})
