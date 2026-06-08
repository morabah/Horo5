import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import {
  createCampaignsWorkflow,
  createPromotionsWorkflow,
  deletePromotionsWorkflow,
  updateCampaignsWorkflow,
  updateProductsWorkflow,
  updatePromotionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

import { BUNDLE_CODE_PREFIX, FREE_SHIPPING_CODE_PREFIX, GIFT_WRAP_HANDLE, TIMED_OFFER_CAMPAIGN_PREFIX } from "../../../../../lib/shared/constants"
import {
  buildBundlePromotionConfig,
  cleanPromoLabel,
  describeUnknownError,
} from "../../../../../lib/promotions-studio/cart-incentives"
import { retrieveStorefrontIncentivesPayload } from "../../../../../lib/storefront/incentives"
import { runUpdateIncentiveThreshold } from "../../../../../scripts/seed-incentives"
import { assertTaxonomyAdminWrite } from "../../taxonomy-auth"

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
  campaign_id?: string | null
  campaign?: {
    id?: string
    starts_at?: string | Date | null
    ends_at?: string | Date | null
  } | null
  metadata?: Record<string, unknown> | null
  application_method?: Record<string, unknown> | null
}

type ProductRow = {
  id: string
  title?: string
  handle: string
  thumbnail?: string | null
  metadata?: Record<string, unknown> | null
}

const cleanLabel = cleanPromoLabel

function positiveInteger(value: unknown): number | null {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.trunc(parsed)
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const ms = Date.parse(String(value))
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

function futureIso(value: unknown): string | null {
  const iso = toIso(value)
  if (!iso) return null
  return Date.parse(iso) > Date.now() ? iso : null
}

function cleanTimedOfferScope(value: unknown): "storewide" | "collection" {
  return value === "collection" ? "collection" : "storewide"
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

async function listTimedOfferTargetPromotions(req: MedusaRequest): Promise<PromotionRow[]> {
  const promotionModule = req.scope.resolve(Modules.PROMOTION) as {
    listPromotions: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<PromotionRow[]>
  }
  const promotions = await promotionModule.listPromotions(
    { is_automatic: true, status: ["active"] },
    { take: 100, relations: ["application_method", "campaign"] },
  )
  return promotions.filter((promotion) => {
    const code = (promotion.code ?? "").toUpperCase()
    return code.startsWith(FREE_SHIPPING_CODE_PREFIX) || code.startsWith(BUNDLE_CODE_PREFIX)
  })
}

function promotionDisplayName(promotion: PromotionRow): string {
  const code = promotion.code?.trim()
  if (code) return code
  return promotion.type === "buyget" ? "Bundle promotion" : "Free-shipping promotion"
}

async function upsertTimedOffer(req: MedusaRequest, body: Record<string, unknown>) {
  const store = await retrieveStore(req)
  const metadata = store?.metadata ?? {}
  const enabled = body.enabled !== false
  const existingPromotionId =
    typeof metadata.timedOfferPromotionId === "string" ? metadata.timedOfferPromotionId : null

  if (!enabled) {
    if (existingPromotionId) {
      await updatePromotionsWorkflow(req.scope).run({
        input: {
          promotionsData: [{ id: existingPromotionId, campaign_id: null }],
        },
      })
    }
    await updateStoreMetadata(req, {
      timedOfferPromotionId: undefined,
      timedOfferLabel: undefined,
      timedOfferScope: undefined,
      timedOfferStartsAt: undefined,
      timedOfferEndsAt: undefined,
    })
    return
  }

  const targets = await listTimedOfferTargetPromotions(req)
  const requestedPromotionId = typeof body.promotionId === "string" ? body.promotionId : null
  const promotion =
    targets.find((target) => target.id === requestedPromotionId) ??
    targets.find((target) => target.id === existingPromotionId) ??
    targets[0]

  if (!promotion) {
    throw new Error("No active automatic free-shipping or bundle promotion exists for the timed offer.")
  }

  const endsAt = futureIso(body.endsAt)
  if (!endsAt) {
    throw new Error("Timed-offer end date must be a future ISO date.")
  }
  const startsAt = toIso(body.startsAt)
  if (startsAt && Date.parse(startsAt) >= Date.parse(endsAt)) {
    throw new Error("Timed-offer start date must be before the end date.")
  }

  let campaignId = promotion.campaign?.id ?? promotion.campaign_id ?? null
  if (campaignId) {
    await updateCampaignsWorkflow(req.scope).run({
      input: {
        campaignsData: [
          {
            id: campaignId,
            name: `${promotionDisplayName(promotion)} timed offer`,
            starts_at: startsAt ? new Date(startsAt) : null,
            ends_at: new Date(endsAt),
          },
        ],
      },
    })
  } else {
    const { result } = await createCampaignsWorkflow(req.scope).run({
      input: {
        campaignsData: [
          {
            name: `${promotionDisplayName(promotion)} timed offer`,
            campaign_identifier: `${TIMED_OFFER_CAMPAIGN_PREFIX}_${promotion.id}_${Date.now()}`,
            starts_at: startsAt ? new Date(startsAt) : null,
            ends_at: new Date(endsAt),
          },
        ],
      },
    })
    const created = result?.[0] as { id?: string } | undefined
    if (!created?.id) {
      throw new Error("Timed-offer campaign creation did not return an id.")
    }
    campaignId = created.id
    await updatePromotionsWorkflow(req.scope).run({
      input: {
        promotionsData: [{ id: promotion.id, campaign_id: campaignId }],
      },
    })
  }

  await updateStoreMetadata(req, {
    timedOfferPromotionId: promotion.id,
    timedOfferLabel: cleanLabel(body.label) ?? undefined,
    timedOfferScope: cleanTimedOfferScope(body.scope),
    timedOfferStartsAt: startsAt ?? undefined,
    timedOfferEndsAt: endsAt,
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

  const { code, applicationMethod } = buildBundlePromotionConfig(body)

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
      listAndCountProductVariants: (
        filters: Record<string, unknown>,
        config?: Record<string, unknown>
      ) => Promise<[Array<{ product_id?: string }>, number]>
    }

    // v2.15.1 enhancement: support SKU search for gift-wrap product lookup
    if (handleOrId) {
      const variants = await productModule.listAndCountProductVariants(
        { sku: handleOrId },
        { take: 1 }
      )
      const variantProductId = variants[0]?.[0]?.product_id
      if (variantProductId) {
        const products = await productModule.listProducts(
          { id: [variantProductId] },
          { take: 1 }
        )
        if (products[0]) return products[0]
      }
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
  const [store, incentives, giftWrapProduct, timedOfferTargets] = await Promise.all([
    retrieveStore(req).catch((err) => {
      console.warn("[promotions-studio] retrieveStore failed:", err)
      return null
    }),
    retrieveStorefrontIncentivesPayload(req.scope).catch((err) => {
      console.warn("[promotions-studio] retrieveStorefrontIncentivesPayload failed:", err)
      return {
        freeShipping: null,
        bundle: null,
        timedOffer: null,
        giftWrapProductHandle: null,
        giftWrapPriceEgp: null,
        giftWrapLabel: null,
      }
    }),
    findGiftWrapProduct(req, null),
    listTimedOfferTargetPromotions(req).catch((err) => {
      console.warn("[promotions-studio] listTimedOfferTargetPromotions failed:", err)
      return []
    }),
  ])
  const metadata = store?.metadata ?? {}
  return {
    ...incentives,
    freeShippingLabel: cleanLabel(metadata.freeShippingLabel),
    bundleLabel: cleanLabel(metadata.bundleLabel),
    timedOfferLabel: cleanLabel(metadata.timedOfferLabel),
    timedOfferPromotionId: typeof metadata.timedOfferPromotionId === "string" ? metadata.timedOfferPromotionId : null,
    timedOfferStartsAt:
      incentives.timedOffer?.startsAt ??
      toIso(metadata.timedOfferStartsAt),
    timedOfferEndsAt:
      incentives.timedOffer?.endsAt ??
      toIso(metadata.timedOfferEndsAt),
    timedOfferScope: cleanTimedOfferScope(metadata.timedOfferScope),
    timedOfferTargets: timedOfferTargets.map((promotion) => ({
      id: promotion.id,
      code: promotion.code ?? "",
      type: promotion.type ?? "standard",
      label: promotionDisplayName(promotion),
      startsAt: toIso(promotion.campaign?.starts_at),
      endsAt: toIso(promotion.campaign?.ends_at),
    })),
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
    const timedOffer = body.timedOffer && typeof body.timedOffer === "object"
      ? body.timedOffer as Record<string, unknown>
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
        throw new Error(`Failed to update free shipping: ${describeUnknownError(err)}`)
      }
    }

    if (bundle) {
      try {
        await upsertBundlePromotion(req, bundle)
      } catch (err) {
        throw new Error(`Failed to update bundle: ${describeUnknownError(err)}`)
      }
    }

    if (giftWrap) {
      try {
        await updateGiftWrap(req, giftWrap)
      } catch (err) {
        throw new Error(`Failed to update gift wrap: ${describeUnknownError(err)}`)
      }
    }

    if (timedOffer) {
      try {
        await upsertTimedOffer(req, timedOffer)
      } catch (err) {
        throw new Error(`Failed to update timed offer: ${describeUnknownError(err)}`)
      }
    }

    res.status(200).json(await retrieveCartIncentivesState(req))
  } catch (error) {
    console.error("[promotions-studio] PUT cart-incentives failed:", error)
    res.status(500).json({ message: describeUnknownError(error) })
  }
}
