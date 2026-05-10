import { getEgyptRegionPaymentProviders, isFawryConfigured } from "../egypt-checkout"

describe("getEgyptRegionPaymentProviders", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("always includes system default and Instapay", () => {
    const providers = getEgyptRegionPaymentProviders()
    expect(providers).toContain("pp_system_default")
    expect(providers).toContain("pp_instapay_instapay")
  })

  it("includes Fawry when Paymob API key and Fawry integration ID are set", () => {
    process.env.PAYMOB_API_KEY = "test_key"
    process.env.PAYMOB_FAWRY_INTEGRATION_ID = "test_fawry"
    process.env.MEDUSA_BACKEND_URL = "https://test.com"

    jest.isolateModules(() => {
      const { getEgyptRegionPaymentProviders: freshGet } = require("../egypt-checkout")
      const providers = freshGet()
      expect(providers).toContain("pp_paymob_fawry")
    })
  })

  it("excludes Fawry when Fawry integration ID is missing", () => {
    process.env.PAYMOB_API_KEY = "test_key"
    delete (process.env as Record<string, string | undefined>).PAYMOB_FAWRY_INTEGRATION_ID
    process.env.MEDUSA_BACKEND_URL = "https://test.com"

    jest.isolateModules(() => {
      const { getEgyptRegionPaymentProviders: freshGet } = require("../egypt-checkout")
      const providers = freshGet()
      expect(providers).not.toContain("pp_paymob_fawry")
    })
  })
})

describe("isFawryConfigured", () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns true when all required env vars are present", () => {
    process.env.PAYMOB_API_KEY = "key"
    process.env.PAYMOB_FAWRY_INTEGRATION_ID = "id"
    process.env.MEDUSA_BACKEND_URL = "https://test.com"

    jest.isolateModules(() => {
      const { isFawryConfigured: freshCheck } = require("../egypt-checkout")
      expect(freshCheck()).toBe(true)
    })
  })

  it("returns false when PAYMOB_API_KEY is missing", () => {
    delete (process.env as Record<string, string | undefined>).PAYMOB_API_KEY
    process.env.PAYMOB_FAWRY_INTEGRATION_ID = "id"
    process.env.MEDUSA_BACKEND_URL = "https://test.com"

    jest.isolateModules(() => {
      const { isFawryConfigured: freshCheck } = require("../egypt-checkout")
      expect(freshCheck()).toBe(false)
    })
  })
})
