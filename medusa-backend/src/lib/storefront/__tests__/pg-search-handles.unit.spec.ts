/**
 * @jest-environment node
 */

import { isStorefrontPgSearchEnabled } from "../pg-search-handles"

describe("isStorefrontPgSearchEnabled", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.STOREFRONT_PG_SEARCH
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns false when env is not set", () => {
    delete process.env.STOREFRONT_PG_SEARCH
    expect(isStorefrontPgSearchEnabled()).toBe(false)
  })

  it("returns true for '1'", () => {
    process.env.STOREFRONT_PG_SEARCH = "1"
    expect(isStorefrontPgSearchEnabled()).toBe(true)
  })

  it("returns true for 'true'", () => {
    process.env.STOREFRONT_PG_SEARCH = "true"
    expect(isStorefrontPgSearchEnabled()).toBe(true)
  })

  it("returns true for 'yes'", () => {
    process.env.STOREFRONT_PG_SEARCH = "yes"
    expect(isStorefrontPgSearchEnabled()).toBe(true)
  })

  it("returns false for other values", () => {
    process.env.STOREFRONT_PG_SEARCH = "0"
    expect(isStorefrontPgSearchEnabled()).toBe(false)
    process.env.STOREFRONT_PG_SEARCH = "false"
    expect(isStorefrontPgSearchEnabled()).toBe(false)
    process.env.STOREFRONT_PG_SEARCH = "no"
    expect(isStorefrontPgSearchEnabled()).toBe(false)
  })
})
