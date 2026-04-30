import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

import { FEELINGS_ROOT_HANDLE } from "../../src/lib/storefront/feeling-category-metadata"

jest.setTimeout(90 * 1000)

async function seedDropsStudioPrerequisites(container: any) {
  const salesChannel = container.resolve(Modules.SALES_CHANNEL) as any
  const product = container.resolve(Modules.PRODUCT) as any
  const stockLocation = container.resolve(Modules.STOCK_LOCATION) as any

  await salesChannel.createSalesChannels({
    name: "Default Sales Channel",
    description: "Default test channel",
  })
  await stockLocation.createStockLocations({ name: "Main test stock" })

  const feelingsRoot = await product.createProductCategories({
    name: "Feelings",
    handle: FEELINGS_ROOT_HANDLE,
    is_active: true,
  })
  const feeling = await product.createProductCategories({
    name: "Streetwear",
    handle: "streetwear",
    is_active: true,
    parent_category_id: feelingsRoot.id,
  })
  await product.createProductCategories({
    name: "Statement",
    handle: "statement",
    is_active: true,
    parent_category_id: feeling.id,
  })

  const apparel = await product.createProductCategories({
    name: "Apparel",
    handle: "apparel",
    is_active: true,
  })
  const tops = await product.createProductCategories({
    name: "Tops",
    handle: "tops",
    is_active: true,
    parent_category_id: apparel.id,
  })
  await product.createProductCategories({
    name: "T-shirts",
    handle: "t-shirts",
    is_active: true,
    parent_category_id: tops.id,
  })
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ api, getContainer }) => {
    describe("Drops Studio admin API", () => {
      beforeEach(async () => {
        await seedDropsStudioPrerequisites(getContainer())
      })

      it("creates and fetches a stock-tracked drop end-to-end", async () => {
        const payload = {
          handle: "quiet-revolt-api",
          title: "Quiet Revolt API",
          status: "published",
          story: "A quiet statement tee.",
          feeling: "streetwear",
          subfeeling: "statement",
          occasions: ["launch-day"],
          apparelCategory: "apparel/tops/t-shirts",
          priceEgp: 850,
          sizes: ["S", "M"],
          stockPerSize: { S: 7, M: 11 },
          artist: "test-artist",
          images: [
            { url: "https://cdn.test/quiet-revolt/main.jpg", tag: "main" },
            { url: "https://cdn.test/quiet-revolt/proof.jpg", tag: "proof_print" },
          ],
        }

        const createResponse = await api.post("/admin/custom/drops", payload)
        expect(createResponse.status).toBe(201)
        expect(createResponse.data.drop).toMatchObject({
          handle: payload.handle,
          status: "published",
          created: true,
        })

        const detailResponse = await api.get(`/admin/custom/drops/${payload.handle}`)
        expect(detailResponse.status).toBe(200)
        expect(detailResponse.data.drop).toMatchObject({
          handle: payload.handle,
          title: payload.title,
          feeling: "streetwear",
          subfeeling: "statement",
          priceEgp: 850,
          stockPerSize: { S: 7, M: 11 },
        })
        expect(detailResponse.data.drop.images).toEqual(expect.arrayContaining([
          expect.objectContaining({ url: "https://cdn.test/quiet-revolt/main.jpg", tag: "main" }),
          expect.objectContaining({ url: "https://cdn.test/quiet-revolt/proof.jpg", tag: "proof_print" }),
        ]))

        const query = getContainer().resolve("query") as any
        const { data } = await query.graph({
          entity: "product",
          fields: ["handle", "categories.handle"],
          filters: { handle: payload.handle },
        })
        const categoryHandles = ((data?.[0]?.categories ?? []) as Array<{ handle: string }>).map((category) => category.handle)
        expect(categoryHandles).toEqual(expect.arrayContaining(["statement", "t-shirts"]))
      })

      it("updates a drop via PUT and reflects changes on fetch", async () => {
        const createPayload = {
          handle: "update-test",
          title: "Update Test",
          status: "published",
          story: "Original story.",
          feeling: "streetwear",
          subfeeling: "statement",
          priceEgp: 500,
          sizes: ["S"],
          images: [{ url: "https://cdn.test/main.jpg", tag: "main" }],
        }

        await api.post("/admin/custom/drops", createPayload)

        const updatePayload = {
          ...createPayload,
          title: "Updated Title",
          priceEgp: 750,
          sizes: ["S", "M"],
          stockPerSize: { S: 5, M: 10 },
        }

        const putResponse = await api.put(`/admin/custom/drops/${createPayload.handle}`, updatePayload)
        expect(putResponse.status).toBe(200)
        expect(putResponse.data.drop).toMatchObject({
          handle: createPayload.handle,
          status: "published",
          created: false,
        })

        const detailResponse = await api.get(`/admin/custom/drops/${createPayload.handle}`)
        expect(detailResponse.data.drop).toMatchObject({
          title: "Updated Title",
          priceEgp: 750,
          stockPerSize: { S: 5, M: 10 },
        })
      })

      it("creates multiple drops via the bulk endpoint", async () => {
        const drops = [
          {
            handle: "bulk-a",
            title: "Bulk A",
            status: "published",
            story: "Bulk story A.",
            feeling: "streetwear",
            subfeeling: "statement",
            priceEgp: 600,
            sizes: ["S"],
            images: [{ url: "https://cdn.test/a.jpg", tag: "main" }],
          },
          {
            handle: "bulk-b",
            title: "Bulk B",
            status: "published",
            story: "Bulk story B.",
            feeling: "streetwear",
            subfeeling: "statement",
            priceEgp: 700,
            sizes: ["M"],
            images: [{ url: "https://cdn.test/b.jpg", tag: "main" }],
          },
        ]

        const bulkResponse = await api.post("/admin/custom/drops/bulk", { drops, concurrency: 2 })
        expect(bulkResponse.status).toBe(207)
        expect(bulkResponse.data.results).toHaveLength(2)
        expect(bulkResponse.data.results.every((result: any) => result.ok)).toBe(true)

        for (const drop of drops) {
          const detailResponse = await api.get(`/admin/custom/drops/${drop.handle}`)
          expect(detailResponse.status).toBe(200)
          expect(detailResponse.data.drop.title).toBe(drop.title)
        }
      })
    })
  },
})
