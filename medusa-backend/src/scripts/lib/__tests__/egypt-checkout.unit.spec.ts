import { getEgyptRegionPaymentProviders } from "../egypt-checkout"

describe("getEgyptRegionPaymentProviders", () => {
  it("always includes system default and Instapay", () => {
    const providers = getEgyptRegionPaymentProviders()
    expect(providers).toContain("pp_system_default")
    expect(providers).toContain("pp_instapay_instapay")
  })
})
