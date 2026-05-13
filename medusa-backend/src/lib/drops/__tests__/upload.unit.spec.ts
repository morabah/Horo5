import { dropMimeType } from "../upload"

describe("dropMimeType", () => {
  it("maps known image extensions", () => {
    expect(dropMimeType("image.png")).toBe("image/png")
    expect(dropMimeType("photo.jpg")).toBe("image/jpeg")
    expect(dropMimeType("photo.jpeg")).toBe("image/jpeg")
    expect(dropMimeType("banner.webp")).toBe("image/webp")
    expect(dropMimeType("animated.gif")).toBe("image/gif")
    expect(dropMimeType("icon.svg")).toBe("image/svg+xml")
  })

  it("defaults to octet-stream for unknown extensions", () => {
    expect(dropMimeType("file.pdf")).toBe("application/octet-stream")
    expect(dropMimeType("data")).toBe("application/octet-stream")
  })

  it("is case-insensitive", () => {
    expect(dropMimeType("IMAGE.PNG")).toBe("image/png")
    expect(dropMimeType("Photo.JPG")).toBe("image/jpeg")
  })
})
