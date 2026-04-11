import type { MedusaResponse } from "@medusajs/framework/http"

import { applySlugImmutabilityToPatchData } from "../slug-patch-guard"

function createMockRes() {
  let statusCode = 200
  let body: unknown
  const res = {
    get statusCode() {
      return statusCode
    },
    get body() {
      return body
    },
    status(code: number) {
      statusCode = code
      return res
    },
    json(payload: unknown) {
      body = payload
      return res
    },
  }
  return res as unknown as MedusaResponse & { statusCode: number; body: unknown }
}

describe("applySlugImmutabilityToPatchData", () => {
  it("returns false and 422 when slug changes", () => {
    const res = createMockRes()
    const data = { slug: "new-slug", name: "X" }
    const ok = applySlugImmutabilityToPatchData(res, data, "mood")
    expect(ok).toBe(false)
    expect(res.statusCode).toBe(422)
  })

  it("strips slug when unchanged", () => {
    const res = createMockRes()
    const data = { slug: "mood", name: "Mood" }
    expect(applySlugImmutabilityToPatchData(res, data, "mood")).toBe(true)
    expect("slug" in data).toBe(false)
    expect(data.name).toBe("Mood")
  })
})
