import {
  checkoutStickyCostLine,
  governorateShippingBasisCopy,
  pdpCodTrustCopy,
  pdpExchangeTrustCopy,
  recoveryBodyCopy,
  shippingCalculatedAfterAddressCopy,
} from "../commerce-copy"

describe("commerce-copy", () => {
  it("uses hedged PDP and recovery copy", () => {
    expect(pdpCodTrustCopy(false)).toContain("when shown at checkout")
    expect(pdpExchangeTrustCopy(false)).toContain("according to policy")
    expect(recoveryBodyCopy(false)).toContain("when shown at checkout")
    expect(recoveryBodyCopy(true)).toContain("الاستبدال")
  })

  it("governorateShippingBasisCopy handles selection", () => {
    expect(governorateShippingBasisCopy(false, null)).toContain("Choose governorate")
    expect(governorateShippingBasisCopy(false, "Cairo")).toContain("Cairo")
  })

  it("shippingCalculatedAfterAddressCopy is explicit", () => {
    expect(shippingCalculatedAfterAddressCopy(false)).not.toBe("—")
    expect(shippingCalculatedAfterAddressCopy(false)).toContain("Calculated")
  })

  it("checkoutStickyCostLine includes shipping when known", () => {
    const line = checkoutStickyCostLine(false, {
      shippingPending: false,
      freeShippingUnlocked: false,
      shippingEgp: 60,
      giftWrapEgp: 0,
      merchandiseSubtotalEgp: 500,
      formatMoney: (n) => `EGP ${n}`,
    })
    expect(line).toContain("Shipping")
    expect(line).toContain("EGP 60")
  })

  it("checkoutStickyCostLine shows pending state", () => {
    const line = checkoutStickyCostLine(false, {
      shippingPending: true,
      freeShippingUnlocked: false,
      shippingEgp: 0,
      giftWrapEgp: 0,
      merchandiseSubtotalEgp: 500,
      formatMoney: (n) => `EGP ${n}`,
    })
    expect(line).toContain("finalizes after address")
  })
})
