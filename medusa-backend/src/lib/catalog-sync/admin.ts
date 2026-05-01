import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"

import { asString } from "../shared/type-guards"
import type { CatalogSyncOptions, CatalogSyncReport } from "./types"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown; metadata?: { count?: number } }>
}

type StoreRow = {
  id?: string
  metadata?: Record<string, unknown> | null
}

export type AdminCatalogSyncRequest = {
  csvSource?: unknown
  only?: unknown
  force?: unknown
  noStock?: unknown
  noInventory?: unknown
  allowPartial?: unknown
}

export type CatalogSyncStatus = {
  lastCatalogSyncAt: string | null
  lastCatalogSyncSummary: string | null
  productCount: number | null
}

function asBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === 1
}

function parseOnlyHandles(value: unknown): Set<string> | undefined {
  const source = Array.isArray(value) ? value.join(",") : asString(value)
  if (!source) return undefined
  const handles = source
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean)
  return handles.length ? new Set(handles) : undefined
}

export function buildCatalogSyncOptionsFromAdminBody(
  body: AdminCatalogSyncRequest,
  dryRun: boolean,
  env: NodeJS.ProcessEnv = process.env,
): CatalogSyncOptions {
  return {
    dryRun,
    allowPartial: asBoolean(body.allowPartial),
    force: asBoolean(body.force),
    noStock: asBoolean(body.noStock),
    noInventory: asBoolean(body.noInventory),
    onlyHandles: parseOnlyHandles(body.only),
    csvSource: asString(body.csvSource) ?? env.CATALOG_SHEET_CSV_URL,
  }
}

function summarizeReport(report: CatalogSyncReport): string {
  return [
    `${report.selectedRows} selected`,
    `${report.readyRows} ready`,
    `${report.validationIssues.length} validation issue(s)`,
    `${report.importHandles.length} import handle(s)`,
    `${report.stageErrors.length} stage error(s)`,
  ].join(", ")
}

async function retrieveStore(container: MedusaContainer): Promise<StoreRow | undefined> {
  const storeModule = container.resolve(Modules.STORE)
  const stores = await storeModule.listStores()
  return stores[0] as StoreRow | undefined
}

export async function recordCatalogSyncStatus(
  container: MedusaContainer,
  report: CatalogSyncReport,
): Promise<CatalogSyncStatus> {
  const store = await retrieveStore(container)
  if (!store?.id) {
    throw new Error("No store row found.")
  }

  const lastCatalogSyncAt = new Date().toISOString()
  const lastCatalogSyncSummary = summarizeReport(report)
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        metadata: {
          ...(store.metadata ?? {}),
          lastCatalogSyncAt,
          lastCatalogSyncSummary,
        },
      },
    },
  })

  return {
    lastCatalogSyncAt,
    lastCatalogSyncSummary,
    productCount: null,
  }
}

export async function retrieveCatalogSyncStatus(container: MedusaContainer): Promise<CatalogSyncStatus> {
  const [store, productCount] = await Promise.all([
    retrieveStore(container),
    (async () => {
      try {
        const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
        const result = await query.graph({
          entity: "product",
          fields: ["id"],
          pagination: { take: 1 },
        })
        if (typeof result.metadata?.count === "number") return result.metadata.count
        return Array.isArray(result.data) ? result.data.length : null
      } catch {
        return null
      }
    })(),
  ])
  const metadata = store?.metadata ?? {}

  return {
    lastCatalogSyncAt: asString(metadata.lastCatalogSyncAt) ?? null,
    lastCatalogSyncSummary: asString(metadata.lastCatalogSyncSummary) ?? null,
    productCount,
  }
}
