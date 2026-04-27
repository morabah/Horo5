import { parseDeliveryObject, parseSizeTablesObject, retrieveStorefrontSettingsPayload } from "../store-settings"

/**
 * Build a fake MedusaContainer scope that returns a single store with the given metadata.
 * Mirrors how `Modules.STORE` resolves in production but skips the framework dependency.
 */
function buildScope(metadata: Record<string, unknown> | null) {
  return {
    resolve(_key: string) {
      return {
        listStores: async () => [{ metadata }],
      }
    },
  } as unknown as Parameters<typeof retrieveStorefrontSettingsPayload>[0]
}

describe("storefront/store-settings parsers", () => {
  describe("parseDeliveryObject (existing)", () => {
    test("returns plain object as-is", () => {
      expect(parseDeliveryObject({ standardMaxDays: 5 })).toEqual({ standardMaxDays: 5 })
    })

    test("parses stringified JSON object", () => {
      expect(parseDeliveryObject('{"standardMaxDays":5}')).toEqual({ standardMaxDays: 5 })
    })

    test("returns null for arrays / non-objects / invalid JSON", () => {
      expect(parseDeliveryObject([1, 2, 3])).toBeNull()
      expect(parseDeliveryObject("not-json")).toBeNull()
      expect(parseDeliveryObject(undefined)).toBeNull()
    })
  })

  describe("parseSizeTablesObject (existing)", () => {
    test("parses presets object", () => {
      const out = parseSizeTablesObject({ regular: { measurements: [] } })
      expect(out).toEqual({ regular: { measurements: [] } })
    })
  })

  describe("retrieveStorefrontSettingsPayload — new blobs", () => {
    test("returns null for navigation/checkout/search when metadata absent", async () => {
      const out = await retrieveStorefrontSettingsPayload(buildScope({}))
      expect(out.navigation).toBeNull()
      expect(out.checkout).toBeNull()
      expect(out.search).toBeNull()
    })

    test("parses navigation with EN/AR labels and sortOrder", async () => {
      const meta = {
        navigation: {
          primary: [
            { key: "products", label: { en: "Shop", ar: "تسوق" }, href: "/products", active: true, sortOrder: 1 },
            { key: "gifts", label: { en: "Gifts", ar: "هدايا" }, href: "/gifts", active: true, sortOrder: 2 },
          ],
          drawer: [{ key: "home", label: "Home", href: "/", active: true, sortOrder: 0 }],
        },
      }
      const out = await retrieveStorefrontSettingsPayload(buildScope(meta))
      expect(out.navigation?.primary).toHaveLength(2)
      expect(out.navigation?.primary[0].key).toBe("products")
      expect(out.navigation?.drawer[0].label).toBe("Home")
    })

    test("drops navigation items missing required fields", async () => {
      const meta = {
        navigation: {
          primary: [
            { key: "products", label: "Shop", href: "/products", active: true, sortOrder: 1 },
            { label: "Missing key", href: "/x" }, // no key → drop
            { key: "no-href", label: "No href" }, // no href → drop
            { key: "no-label", href: "/no-label" }, // no label → drop
          ],
          drawer: [],
        },
      }
      const out = await retrieveStorefrontSettingsPayload(buildScope(meta))
      expect(out.navigation?.primary).toHaveLength(1)
    })

    test("parses checkout governorates with codEligible defaults to true", async () => {
      const meta = {
        checkout: {
          governorates: [
            { code: "cairo", name: { en: "Cairo", ar: "القاهرة" } },
            { code: "sinai", name: "South Sinai", codEligible: false, expressEligible: false },
          ],
          paymentMethodOrder: ["cod", "instapay", "card"],
        },
      }
      const out = await retrieveStorefrontSettingsPayload(buildScope(meta))
      expect(out.checkout?.governorates).toHaveLength(2)
      expect(out.checkout?.governorates[0].codEligible).toBe(true)
      expect(out.checkout?.governorates[1].codEligible).toBe(false)
      expect(out.checkout?.paymentMethodOrder).toEqual(["cod", "instapay", "card"])
    })

    test("parses search price bands with null bounds", async () => {
      const meta = {
        search: {
          priceBands: [
            { key: "under-700", minEgp: null, maxEgp: 699, label: { en: "Under 700 EGP", ar: "أقل من ٧٠٠" } },
            { key: "700-999", minEgp: 700, maxEgp: 999, label: "700-999 EGP" },
            { key: "1000+", minEgp: 1000, maxEgp: null, label: "1000+ EGP" },
          ],
        },
      }
      const out = await retrieveStorefrontSettingsPayload(buildScope(meta))
      expect(out.search?.priceBands).toHaveLength(3)
      expect(out.search?.priceBands[0].minEgp).toBeNull()
      expect(out.search?.priceBands[2].maxEgp).toBeNull()
    })

    test("parses stringified JSON metadata blobs (Admin sometimes stores strings)", async () => {
      const meta = {
        navigation: JSON.stringify({
          primary: [{ key: "products", label: "Shop", href: "/products", active: true, sortOrder: 1 }],
          drawer: [],
        }),
      }
      const out = await retrieveStorefrontSettingsPayload(buildScope(meta))
      expect(out.navigation?.primary).toHaveLength(1)
      expect(out.navigation?.primary[0].key).toBe("products")
    })
  })
})
