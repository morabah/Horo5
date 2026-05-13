/**
 * @jest-environment node
 */

describe("revalidateStorefrontForDrop", () => {
  const originalFetch = global.fetch
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true })
    global.fetch = fetchMock
    delete process.env.STOREFRONT_REVALIDATE_URL
    delete process.env.STOREFRONT_REVALIDATE_SECRET
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("no-ops when env vars are missing", () => {
    const { revalidateStorefrontForDrop } = require("../revalidate-storefront")
    revalidateStorefrontForDrop("drop-1")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("fires fetch with correct tags when env is set", async () => {
    process.env.STOREFRONT_REVALIDATE_URL = "https://store.horo.local/api/revalidate"
    process.env.STOREFRONT_REVALIDATE_SECRET = "secret123"

    // Need to re-require after env is set (module reads env at load time)
    jest.resetModules()
    const { revalidateStorefrontForDrop } = require("../revalidate-storefront")
    revalidateStorefrontForDrop("my-drop")

    // Wait for microtask queue since fetch is fire-and-forget
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(fetchMock).toHaveBeenCalledWith(
      "https://store.horo.local/api/revalidate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-revalidate-secret": "secret123",
        }),
        body: JSON.stringify({ tags: ["product:my-drop", "catalog", "storefront"] }),
      })
    )
  })
})
