import { medusaIntegrationTestRunner } from "@medusajs/test-utils"

jest.setTimeout(60 * 1000)

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api }) => {
    describe("Storefront public routes", () => {
      it("GET /storefront/settings returns delivery + size table keys", async () => {
        const response = await api.get("/storefront/settings")
        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty("delivery")
        expect(response.data).toHaveProperty("sizeTables")
        expect(response.data).toHaveProperty("defaultSizeTableKey")
      })

      it("GET /storefront/search returns a product list envelope", async () => {
        const response = await api.get("/storefront/search?q=a&page=1")
        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty("products")
        expect(response.data).toHaveProperty("total")
        expect(response.data).toHaveProperty("facets")
      })

      it("GET /storefront/facets returns total + feeling facets", async () => {
        const response = await api.get("/storefront/facets")
        expect(response.status).toEqual(200)
        expect(response.data).toHaveProperty("total")
        expect(response.data).toHaveProperty("facets")
        expect(response.data.facets).toHaveProperty("feelings")
      })
    })
  },
})
