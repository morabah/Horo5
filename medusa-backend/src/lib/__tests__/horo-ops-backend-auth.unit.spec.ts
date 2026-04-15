import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { assertOpsBackendAccess } from "../horo-ops-backend-auth"

function mockRes() {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  return { status, json } as unknown as MedusaResponse
}

describe("assertOpsBackendAccess", () => {
  const prev = process.env.NODE_ENV
  const prevSecret = process.env.HORO_OPS_BACKEND_SECRET

  afterEach(() => {
    process.env.NODE_ENV = prev
    process.env.HORO_OPS_BACKEND_SECRET = prevSecret
  })

  it("allows when secret unset (non-production)", () => {
    process.env.NODE_ENV = "development"
    delete process.env.HORO_OPS_BACKEND_SECRET
    const req = { headers: {}, auth_context: {} } as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(true)
  })

  it("503 in production when secret missing", () => {
    process.env.NODE_ENV = "production"
    delete process.env.HORO_OPS_BACKEND_SECRET
    const req = { headers: {} } as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(false)
    expect((res as { status: jest.Mock }).status).toHaveBeenCalledWith(503)
  })

  it("allows matching x-horo-ops-secret", () => {
    process.env.NODE_ENV = "development"
    process.env.HORO_OPS_BACKEND_SECRET = "abc"
    const req = { headers: { "x-horo-ops-secret": "abc" }, auth_context: {} } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(true)
  })

  it("allows matching Authorization Bearer when x header absent", () => {
    process.env.NODE_ENV = "development"
    process.env.HORO_OPS_BACKEND_SECRET = "abc"
    const req = {
      headers: { authorization: "Bearer abc" },
      auth_context: {},
    } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(true)
  })

  it("allows admin actor when secret set", () => {
    process.env.NODE_ENV = "development"
    process.env.HORO_OPS_BACKEND_SECRET = "abc"
    const req = {
      headers: {},
      auth_context: { actor_id: "user_1" },
    } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(true)
  })

  it("401 when secret wrong and no actor", () => {
    process.env.NODE_ENV = "development"
    process.env.HORO_OPS_BACKEND_SECRET = "abc"
    const req = { headers: { "x-horo-ops-secret": "wrong" }, auth_context: {} } as unknown as MedusaRequest
    const res = mockRes()
    expect(assertOpsBackendAccess(req, res)).toBe(false)
    expect((res as { status: jest.Mock }).status).toHaveBeenCalledWith(401)
  })
})
