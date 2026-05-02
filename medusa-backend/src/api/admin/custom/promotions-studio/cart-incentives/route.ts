import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow, deletePromotionsWorkflow, updateProductsWorkflow, updatePromotionsWorkflow, updateStoresWorkflow } from "@medusajs/medusa/core-flows"

import { BUNDLE_CODE_PREFIX, FREE_SHIPPING_CODE_PREFIX, GIFT_WRAP_HANDLE } from "../../../../../lib/shared/constants"
import { retrieveStorefrontIncentivesPayload } from "../../../../../lib/storefront/incentives"
import { runUpdateIncentiveThreshold } from "../../../../../scripts/seed-incentives"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

type LocalizedLabel = string | { en?: string; ar?: string }

type StoreRow = {
  id: string
  metadata?: Record<string, unknown> | null
}

type PromotionRow = {
  id: string
  code?: string
  status?: "draft" | "active" | "inactive"
  is_automatic?: boolean
  type?: "standard" | "buyget"
  application_method?: Record<string, unknown> | null
}

type ProductRow = {
  id: string
  title?: string
  handle: string
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
}

function cleanLabel(value: unknown): LocalizedLabel | null {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const raw = value as Record<string, unknown>
    const en = typeof raw.en === "string" && raw.en.trim() ? raw.en.trim() : undefined
    const ar = typeof raw.ar === "string" && raw.ar.trim() ? raw.ar.trim() : undefined
    if (!en && !ar) return null
    return { ...(en ? { en } : {}), ...(ar ? { ar } : {}) }
  }
  return null
}

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.trunc(parsed)
}

async function retrieveStore(req: MedusaRequest): Promise<StoreRow | null> {
  const storeModule = req.scope.resolve(Modules.STORE) as {
    listStores: () => Promise<StoreRow[]>
  }
  const stores = await storeModule.listStores()
  return stores[0] ?? null
}

async function updateStoreMetadata(req: MedusaRequest, patch: Record<string, unknown>) {
  const store = await retrieveStore(req)
  if (!store?.id) return
  const metadata = { ...(store.metadata ?? {}), ...patch }
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) delete metadata[key]
  }
  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: { metadata },
    },
  })
}

async function listHoroPromotions(req: MedusaRequest, prefix: string): Promise<PromotionRow[]> {
  const promotionModule = req.scope.resolve(Modules.PROMOTION) as {
    listPromotions: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<PromotionRow[]>
  }
  const promotions = await promotionModule.listPromotions(
    {},
    { take: 200, relations: ["application_method", "rules", "rules.values"] },
  )
  return promotions.filter((promotion) => (promotion.code ?? "").toUpperCase().startsWith(prefix))
}

async function deactivateSiblingPromotions(req: MedusaRequest, prefix: string, keepCode: string) {
  const siblings = await listHoroPromotions(req, prefix)
  const toDisable = siblings.filter((promotion) => {
    return promotion.code !== keepCode && promotion.status !== "inactive"
  })
  if (toDisable.length === 0) return
  await updatePromotionsWorkflow(req.scope).run({
    input: {
      promotionsData: toDisable.map((promotion) => ({ id: promotion.id, status: "inactive" })),
    },
  })
}

async function upsertBundlePromotion(req: MedusaRequest, body: Record<string, unknown>) {
  const enabled = body.enabled !== false
  const existing = await listHoroPromotions(req, BUNDLE_CODE_PREFIX)
  if (!enabled) {
    // Disable all existing bundle promotions
    if (existing.length > 0) {
      try {
        await deletePromotionsWorkflow(req.scope).run({
          input: { ids: existing.map((promotion) => promotion.id) },
        })
      } catch (err) {
        // Fall back to deactivation if delete fails
        const active = existing.filter((promotion) => promotion.status !== "inactive")
        if (active.length > 0) {
          await updatePromotionsWorkflow(req.scope).run({
            input: {
              promotionsData: active.map((promotion) => ({ id: promotion.id, status: "inactive" })),
            },
          })
        }
      }
    }
    await updateStoreMetadata(req, { bundleLabel: undefined })
    return
  }

  const requireQuantity = positiveInteger(body.requireQuantity) ?? 2
  const applyToQuantity = positiveInteger(body.applyToQuantity) ?? 1
  const applicationKind = body.applicationKind === "fixed" ? "fixed" : "percentage"
  const applicationValue = positiveInteger(body.applicationValue) ?? (applicationKind === "fixed" ? 100 : 100)
  const code = `${BUNDLE_CODE_PREFIX}_${requireQuantity}_${applyToQuantity}_${applicationKind.toUpperCase()}_${applicationValue}`
  const applicationMethod = {
    type: applicationKind,
    target_type: "items",
    allocation: "each",
    value: applicationValue,
    currency_code: "egp",
    buy_rules_min_quantity: requireQuantity,
    apply_to_quantity: applyToQuantity,
    buy_rules: [],
    target_rules: [],
  } as const

  // Check if an exact match already exists and is active — skip recreation
  const exactMatch = existing.find((promotion) => promotion.code === code && promotion.status === "active")
  if (exactMatch) {
    // Nothing to change on the promotion itself; just ensure siblings are cleaned up
    await deactivateSiblingPromotions(req, BUNDLE_CODE_PREFIX, code)
    const label = cleanLabel(body.label)
    await updateStoreMetadata(req, { bundleLabel: label ?? undefined })
    return
  }

  // Delete all existing bundle promotions, then create fresh.
  // Medusa v2 does not allow updating immutable fields (type, application_method) on promotions.
  if (existing.length > 0) {
    try {
      await deletePromotionsWorkflow(req.scope).run({
        input: { ids: existing.map((promotion) => promotion.id) },
      })
    } catch (err) {
      // Fall back to deactivation if delete workflow is unavailable
      const active = existing.filter((promotion) => promotion.status !== "inactive")
      if (active.length > 0) {
        await updatePromotionsWorkflow(req.scope).run({
          input: {
            promotionsData: active.map((promotion) => ({ id: promotion.id, status: "inactive" })),
          },
        })
      }
    }
  }

  await createPromotionsWorkflow(req.scope).run({
    input: {
      promotionsData: [
        {
          code,
          type: "buyget",
          is_automatic: true,
          status: "active",
          application_method: applicationMethod,
        },
      ],
    },
  })
  const label = cleanLabel(body.label)
  await updateStoreMetadata(req, { bundleLabel: label ?? undefined })
}

async function findGiftWrapProduct(req: MedusaRequest, handleOrId: string | null): Promise<ProductRow | null> {
  try {
    const productModule = req.scope.resolve(Modules.PRODUCT) as {
      listProducts: (filters: Record<string, unknown>, config?: Record<string, unknown>) => Promise<ProductRow[]>
    }
    const byHandle = handleOrId && !handleOrId.startsWith("prod_")
      ? handleOrId
      : GIFT_WRAP_HANDLE
    const products = await productModule.listProducts(
      handleOrId?.startsWith("prod_") ? { id: [handleOrId] } : { handle: byHandle },
      { take: 1 },
    )
    return products[0] ?? null
  } catch (err) {
    console.warn("[promotions-studio] findGiftWrapProduct failed:", err)
    return null
  }
}

async function updateGiftWrap(req: MedusaRequest, body: Record<string, unknown>) {
  const product = await findGiftWrapProduct(req, typeof body.productId === "string" ? body.productId : typeof body.handle === "string" ? body.handle : null)
  if (!product) {
    // Gift-wrap product not found — skip silently so the rest of the save succeeds
    console.warn("[promotions-studio] Gift-wrap product not found, skipping gift-wrap update.")
    return
  }
  const metadata = { ...(product.metadata ?? {}) }
  const label = cleanLabel(body.label)
  const priceEgp = positiveInteger(body.priceEgp)
  if (label) metadata.giftWrapLabel = label
  else delete metadata.giftWrapLabel
  if (priceEgp !== null) metadata.priceEgp = priceEgp
  else delete metadata.priceEgp
  await updateProductsWorkflow(req.scope).run({
    input: {
      selector: { id: product.id },
      update: { metadata },
    },
  })
}

async function retrieveCartIncentivesState(req: MedusaRequest) {
  // Run each leg independently so a single failure doesn't crash the whole response
  const [store, incentives, giftWrapProduct] = await Promise.all([
    retrieveStore(req).catch((err) => {
      console.warn("[promotions-studio] retrieveStore failed:", err)
      return null
    }),
    retrieveStorefrontIncentivesPayload(req.scope).catch((err) => {
      console.warn("[promotions-studio] retrieveStorefrontIncentivesPayload failed:", err)
      return {
        freeShipping: null,
        bundle: null,
        giftWrapProductHandle: null,
        giftWrapPriceEgp: null,
        giftWrapLabel: null,
      }
    }),
    findGiftWrapProduct(req, null),
  ])
  const metadata = store?.metadata ?? {}
  return {
    ...incentives,
    freeShippingLabel: cleanLabel(metadata.freeShippingLabel),
    bundleLabel: cleanLabel(metadata.bundleLabel),
    giftWrapProduct: giftWrapProduct
      ? {
          id: giftWrapProduct.id,
          title: giftWrapProduct.title ?? giftWrapProduct.handle,
          handle: giftWrapProduct.handle,
          thumbnail: giftWrapProduct.thumbnail ?? null,
        }
      : null,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    res.status(200).json(await retrieveCartIncentivesState(req))
  } catch (error) {
    console.error("[promotions-studio] GET cart-incentives failed:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  try {
    const body = (req.body || {}) as Record<string, unknown>
    const freeShipping = body.freeShipping && typeof body.freeShipping === "object"
      ? body.freeShipping as Record<string, unknown>
      : null
    const bundle = body.bundle && typeof body.bundle === "object"
      ? body.bundle as Record<string, unknown>
      : null
    const giftWrap = body.giftWrap && typeof body.giftWrap === "object"
      ? body.giftWrap as Record<string, unknown>
      : null

    if (freeShipping) {
      const threshold = positiveInteger(freeShipping.thresholdEgp)
      if (!threshold) {
        res.status(400).json({ message: "Free-shipping threshold must be a positive EGP amount." })
        return
      }
      try {
        const result = await runUpdateIncentiveThreshold(req.scope, { thresholdEgp: threshold })
        await deactivateSiblingPromotions(req, FREE_SHIPPING_CODE_PREFIX, result.details.code)
        await updateStoreMetadata(req, {
          freeShippingThresholdEgp: threshold,
          freeShippingLabel: cleanLabel(freeShipping.label) ?? undefined,
        })
      } catch (err) {
        throw new Error(`Failed to update free shipping: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (bundle) {
      try {
        await upsertBundlePromotion(req, bundle)
      } catch (err) {
        throw new Error(`Failed to update bundle: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (giftWrap) {
      try {
        await updateGiftWrap(req, giftWrap)
      } catch (err) {
        throw new Error(`Failed to update gift wrap: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    res.status(200).json(await retrieveCartIncentivesState(req))
  } catch (error) {
    console.error("[promotions-studio] PUT cart-incentives failed:", error)
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
  }
}
