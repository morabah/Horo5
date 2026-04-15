import { retryWithBackoff } from "../retry-with-backoff"

describe("retryWithBackoff", () => {
  it("returns on first success", async () => {
    let n = 0
    const r = await retryWithBackoff(
      "t",
      3,
      async () => {
        n += 1
        return { ok: true }
      },
      (x) => x.ok,
      { warn: jest.fn() },
    )
    expect(r?.ok).toBe(true)
    expect(n).toBe(1)
  })

  it("retries until success", async () => {
    let n = 0
    const r = await retryWithBackoff(
      "t",
      4,
      async () => {
        n += 1
        return { ok: n >= 3 }
      },
      (x) => x.ok,
      { warn: jest.fn() },
    )
    expect(r?.ok).toBe(true)
    expect(n).toBe(3)
  })
})
