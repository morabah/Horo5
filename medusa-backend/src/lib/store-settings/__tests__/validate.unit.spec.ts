import deliveryDefaults from "../../../scripts/data/store-delivery-defaults.json"
import sizeTableDefaults from "../../../scripts/data/size-tables-defaults.json"
import { normalizeStoreSettingsInput } from "../validate"

describe("store-settings validator", () => {
  it("accepts default delivery and size table metadata", () => {
    const result = normalizeStoreSettingsInput({
      delivery: deliveryDefaults,
      sizeTables: sizeTableDefaults.tables,
      defaultSizeTableKey: sizeTableDefaults.defaultSizeTableKey,
      storefrontUrl: "https://horo.test/",
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.settings.defaultSizeTableKey).toBe("regular")
      expect(result.settings.storefrontUrl).toBe("https://horo.test")
      expect(Object.keys(result.settings.sizeTables)).toEqual(["regular", "oversized", "fitted"])
    }
  })

  it("rejects delivery ranges where max is less than min", () => {
    const result = normalizeStoreSettingsInput({
      delivery: {
        ...deliveryDefaults,
        standardMinDays: 7,
        standardMaxDays: 3,
      },
      sizeTables: sizeTableDefaults.tables,
      defaultSizeTableKey: "regular",
      storefrontUrl: null,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "delivery.standardMaxDays" }),
      ]))
    }
  })

  it("requires defaultSizeTableKey to reference an existing table", () => {
    const result = normalizeStoreSettingsInput({
      delivery: deliveryDefaults,
      sizeTables: sizeTableDefaults.tables,
      defaultSizeTableKey: "missing",
      storefrontUrl: null,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "defaultSizeTableKey" }),
      ]))
    }
  })

  it("rejects invalid size table rows", () => {
    const result = normalizeStoreSettingsInput({
      delivery: deliveryDefaults,
      sizeTables: {
        regular: {
          measurements: [{ size: "M", chest: "", shoulder: "47 cm", length: "72 cm", sleeve: "21 cm" }],
          fitModels: [{ heightCm: 40, heightImperial: "", sizeWorn: "" }],
        },
      },
      defaultSizeTableKey: "regular",
      storefrontUrl: null,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues).toEqual(expect.arrayContaining([
        expect.objectContaining({ field: "sizeTables.regular.measurements.0.chest" }),
        expect.objectContaining({ field: "sizeTables.regular.fitModels.0.heightCm" }),
      ]))
    }
  })
})
