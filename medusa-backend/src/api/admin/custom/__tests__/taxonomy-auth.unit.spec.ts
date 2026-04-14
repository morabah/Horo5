import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

function mockRes(): MedusaResponse {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  }
  return res as unknown as MedusaResponse
}

describe("assertTaxonomyAdminWrite", () => {
  const env = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...env }
  })

  afterAll(() => {
    process.env = env
  })

  it("allows when HORO_TAXONOMY_ADMIN_SECRET is unset (local)", () => {
    delete process.env.HORO_TAXONOMY_ADMIN_SECRET
    process.env.NODE_ENV = "development"
    const res = mockRes()
    expect(assertTaxonomyAdminWrite({ headers: {} } as MedusaRequest, res)).toBe(true)
  })

  it("returns 503 in production when secret is missing", () => {
    delete process.env.HORO_TAXONOMY_ADMIN_SECRET
    process.env.NODE_ENV = "production"
    const res = mockRes()
    expect(assertTaxonomyAdminWrite({ headers: {} } as MedusaRequest, res)).toBe(false)
    expect(res.status).toHaveBeenCalledWith(503)
  })

  it("allows when secret header matches", () => {
    process.env.HORO_TAXONOMY_ADMIN_SECRET = "abc"
    process.env.NODE_ENV = "production"
    const req = { headers: { "x-horo-taxonomy-secret": "abc" } } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertTaxonomyAdminWrite(req, res)).toBe(true)
  })

  it("allows when secret is set and auth_context.actor_id is present (Admin UI)", () => {
    process.env.HORO_TAXONOMY_ADMIN_SECRET = "abc"
    process.env.NODE_ENV = "production"
    const req = {
      headers: {},
      auth_context: { actor_id: "user_01" },
    } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertTaxonomyAdminWrite(req, res)).toBe(true)
  })

  it("returns 401 when secret is set and neither header nor session", () => {
    process.env.HORO_TAXONOMY_ADMIN_SECRET = "abc"
    process.env.NODE_ENV = "production"
    const req = { headers: {} } as MedusaRequest
    const res = mockRes()
    expect(assertTaxonomyAdminWrite(req, res)).toBe(false)
    expect(res.status).toHaveBeenCalledWith(401)
  })
})
