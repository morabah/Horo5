import { NAV_DRAWER_ROUTE_KEYS, NAV_PRIMARY_ROUTE_KEYS, NAV_ROUTE } from "../navLinks"

describe("navLinks", () => {
  it("exposes stable primary shop paths", () => {
    expect(NAV_ROUTE.products.path).toBe("/products")
    expect(NAV_ROUTE.collection.path).toBe("/feelings")
    expect(NAV_ROUTE.gifts.path).toBe("/gifts")
    expect(NAV_ROUTE.cart.path).toBe("/cart")
  })

  it("keeps the primary navigation label model aligned with the audited IA", () => {
    expect([...NAV_PRIMARY_ROUTE_KEYS]).toEqual([
      "products",
      "collection",
      "gifts",
      "about",
      "sizeGuide",
    ])
  })

  it("keeps drawer keys as a superset of primary nav keys", () => {
    for (const key of NAV_PRIMARY_ROUTE_KEYS) {
      expect(NAV_DRAWER_ROUTE_KEYS).toContain(key)
    }
    expect(NAV_DRAWER_ROUTE_KEYS).toContain("home")
    expect(NAV_DRAWER_ROUTE_KEYS).toContain("search")
  })
})
