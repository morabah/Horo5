import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

import { revalidateStorefrontForDrop } from "../../../../lib/drops/revalidate-storefront"
import { normalizeStoreSettingsInput } from "../../../../lib/store-settings/validate"
import { parseDeliveryObject, parseSizeTablesObject } from "../../../../lib/storefront/store-settings"
import deliveryDefaults from "../../../../scripts/data/store-delivery-defaults.json"
import sizeTableDefaults from "../../../../scripts/data/size-tables-defaults.json"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

type StoreRow = {
  id?: string
  metadata?: Record<string, unknown> | null
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function currentSettingsFromMetadata(metadata: Record<string, unknown>) {
  const delivery = parseDeliveryObject(metadata.delivery) ?? deliveryDefaults
  const sizeTables = parseSizeTablesObject(metadata.sizeTables) ?? sizeTableDefaults.tables
  const defaultSizeTableKey = asString(metadata.defaultSizeTableKey) ?? sizeTableDefaults.defaultSizeTableKey
  const storefrontUrl = asString(metadata.storefrontUrl)

  return normalizeStoreSettingsInput({
    delivery,
    sizeTables,
    defaultSizeTableKey,
    storefrontUrl,
  })
}

async function retrieveStore(req: MedusaRequest): Promise<StoreRow | undefined> {
  const storeModule = req.scope.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  return stores[0] as StoreRow | undefined
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const store = await retrieveStore(req)
  if (!store?.id) {
    res.status(404).json({ message: "No store row found." })
    return
  }

  const result = currentSettingsFromMetadata(store.metadata ?? {})
  if (!result.ok) {
    res.status(200).json({
      delivery: deliveryDefaults,
      sizeTables: sizeTableDefaults.tables,
      defaultSizeTableKey: sizeTableDefaults.defaultSizeTableKey,
      storefrontUrl: asString(store.metadata?.storefrontUrl),
      issues: result.issues,
    })
    return
  }

  res.status(200).json(result.settings)
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const store = await retrieveStore(req)
  if (!store?.id) {
    res.status(404).json({ message: "No store row found." })
    return
  }

  const body = (req.body || {}) as Record<string, unknown>
  const rawSettings = body.settings && typeof body.settings === "object" ? body.settings : body
  const result = normalizeStoreSettingsInput(rawSettings)
  if (!result.ok) {
    res.status(400).json({ message: "Invalid store settings.", issues: result.issues })
    return
  }

  const metadata = { ...(store.metadata ?? {}) }
  metadata.delivery = result.settings.delivery
  metadata.sizeTables = result.settings.sizeTables
  metadata.defaultSizeTableKey = result.settings.defaultSizeTableKey
  if (result.settings.storefrontUrl) {
    metadata.storefrontUrl = result.settings.storefrontUrl
  } else {
    delete metadata.storefrontUrl
  }

  await updateStoresWorkflow(req.scope).run({
    input: {
      selector: { id: store.id },
      update: { metadata },
    },
  })

  revalidateStorefrontForDrop("*")
  res.status(200).json(result.settings)
}
