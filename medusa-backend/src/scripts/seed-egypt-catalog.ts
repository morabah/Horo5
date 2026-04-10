import fs from "node:fs/promises"
import path from "node:path"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createApiKeysWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { uploadFilesWorkflow } from "@medusajs/core-flows"

import { EGYPT_PRODUCT_PRICE_EGP, EGYPT_PRODUCT_SIZES, egyptProducts } from "./data/egypt-products"
import type { ApiKey } from "../../.medusa/types/query-entry-points"

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies-egypt",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[]
    store_id: string
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map((currency) => {
            return {
              currency_code: currency.currency_code,
              is_default: currency.is_default ?? false,
            }
          }),
        },
      }
    })

    const stores = updateStoresStep(normalizedInput)
    return new WorkflowResponse(stores)
  }
)

function toMimeType(filePath: string): string {
  if (filePath.endsWith(".png")) return "image/png"
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg"
  if (filePath.endsWith(".webp")) return "image/webp"
  return "application/octet-stream"
}

async function uploadImage(container: ExecArgs["container"], imagePath: string) {
  const absolutePath = path.resolve(process.cwd(), imagePath)
  const content = await fs.readFile(absolutePath)
  const filename = path.basename(absolutePath)

  const { result } = await uploadFilesWorkflow(container).run({
    input: {
      files: [
        {
          filename,
          mimeType: toMimeType(filename),
          content: content.toString("base64"),
          access: "public",
        },
      ],
    },
  })

  return result[0]?.url
}

export default async function seedEgyptCatalog({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const storeModuleService = container.resolve(Modules.STORE)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding Egypt catalog data...")

  const [store] = await storeModuleService.listStores()
  if (!store) {
    throw new Error("No store found. Run Medusa migrations before seeding.")
  }

  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  })

  if (!defaultSalesChannel.length) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [{ name: "Default Sales Channel" }],
      },
    })
    defaultSalesChannel = result
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [{ currency_code: "egp", is_default: true }],
    },
  })

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: { default_sales_channel_id: defaultSalesChannel[0].id },
    },
  })

  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: "Egypt" },
  })

  if (!existingRegions.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Egypt",
            currency_code: "egp",
            countries: ["eg"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })
  }

  let publishableApiKey: ApiKey | null = null
  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: { type: "publishable" },
  })
  publishableApiKey = (apiKeys?.[0] as ApiKey) || null

  if (!publishableApiKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [{ title: "Webshop", type: "publishable", created_by: "" }],
      },
    })
    publishableApiKey = result[0] as ApiKey
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  })

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
    filters: { handle: egyptProducts.map((item) => item.handle) },
  })
  const existingHandles = new Set((existingProducts || []).map((p: { handle: string }) => p.handle))

  const productsInput: any[] = []
  for (const product of egyptProducts) {
    if (existingHandles.has(product.handle)) {
      logger.info(`Skipping existing product: ${product.handle}`)
      continue
    }

    const uploadedImageUrl = await uploadImage(container, product.imagePath)
    if (!uploadedImageUrl) {
      throw new Error(`Failed to upload image for ${product.handle}`)
    }

    productsInput.push({
      title: product.titleEn,
      handle: product.handle,
      description: product.descriptionEn,
      status: ProductStatus.PUBLISHED,
      metadata: {
        titleEn: product.titleEn,
        descriptionEn: product.descriptionEn,
      },
      images: [{ url: uploadedImageUrl }],
      options: [{ title: "Size", values: [...EGYPT_PRODUCT_SIZES] }],
      variants: EGYPT_PRODUCT_SIZES.map((size) => ({
        title: size,
        sku: `${product.handle.toUpperCase()}-${size}`,
        options: { Size: size },
        prices: [{ amount: EGYPT_PRODUCT_PRICE_EGP, currency_code: "egp" }],
      })),
      sales_channels: [{ id: defaultSalesChannel[0].id }],
    })
  }

  if (productsInput.length) {
    await createProductsWorkflow(container).run({
      input: { products: productsInput },
    })
  }

  logger.info("Egypt catalog seed completed.")
}
