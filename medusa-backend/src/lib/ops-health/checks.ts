import { HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { existsSync } from "node:fs"
import fs from "node:fs/promises"
import path from "node:path"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/types"

import { ARTIST_MODULE } from "../../modules/artist"
import type ArtistModuleService from "../../modules/artist/service"
import { HOMEPAGE_SECTION_MODULE } from "../../modules/homepage-section"
import type HomepageSectionModuleService from "../../modules/homepage-section/service"
import { MERCH_EVENT_MODULE } from "../../modules/merch-event"
import type MerchEventModuleService from "../../modules/merch-event/service"
import { OCCASION_MODULE } from "../../modules/occasion"
import type OccasionModuleService from "../../modules/occasion/service"
import { EGYPT_REGION_NAME, getEgyptRegionPaymentProviders } from "../../scripts/lib/egypt-checkout"
import { readCodConfirmationMetadata } from "../cod-confirmation"
import { createS3Client, resolveS3ConfigFromEnv, storeMediaPublicPath } from "../s3-env"
import { FEELINGS_ROOT_HANDLE } from "../storefront/feeling-category-metadata"

type Query = {
  graph: (query: Record<string, unknown>) => Promise<{ data?: unknown; metadata?: { count?: number } }>
}

type HealthStatus = "ok" | "warn" | "error"

export type HealthCheckResult<T = unknown> = {
  status: HealthStatus
  title: string
  summary: string
  details?: T
}

type CatRow = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  parent_category_id?: string | null
  rank?: number
}

export type ParitySnapshot = {
  meta: {
    generatedAt: string
    databaseHint: string
    medusaBackendUrl: string | null
  }
  snapshot: {
    productCategories: Array<{ path: string; handle: string; active: boolean | null }>
    productHandles: string[]
    productCount: number
    regions: Array<{ name: string; currency: string }>
    storeDefaultCurrency: string | null
    feelingSlugs: string[]
    subfeelingSlugs: string[]
    occasionSlugs: string[]
    artistSlugs: string[]
    merchEventSlugs: string[]
    homepageSections: Array<{ key: string; type: string; active: boolean; sortOrder: number }>
    productThumbnailHosts: string[]
  }
}

export type OpsHealthPayload = {
  generatedAt: string
  checks: {
    s3: HealthCheckResult
    paymentProviders: HealthCheckResult
    promotions: HealthCheckResult
    parity: HealthCheckResult
    orderQuality: HealthCheckResult
  }
}

export type ParityDetail = {
  local: ParitySnapshot
  remote: ParitySnapshot | null
  comparison: {
    status: "match" | "mismatch" | "missing_remote"
    remotePath: string
    productCountDelta: number | null
    productsOnlyLocal: string[]
    productsOnlyRemote: string[]
    categoriesOnlyLocal: string[]
    categoriesOnlyRemote: string[]
    differingFields: string[]
  }
}

function databaseHint(): string {
  const url = process.env.DATABASE_URL
  if (!url) return "(no DATABASE_URL)"
  try {
    const normalized = url.replace(/^postgres(ql)?:/i, "http:")
    const u = new URL(normalized)
    const db = u.pathname.replace(/^\//, "") || "(db)"
    return `${u.hostname}:${u.port || "5432"}/${db}`
  } catch {
    return "(unparsed DATABASE_URL)"
  }
}

function categoryPaths(rows: CatRow[]): Array<{ path: string; handle: string; active: boolean | null }> {
  const list = rows.slice()
  const byId = new Map(list.map((row) => [row.id, row]))

  function pathFor(row: CatRow): string {
    const parts: string[] = []
    let current: CatRow | undefined = row
    let guard = 0
    while (current && guard++ < 32) {
      parts.unshift(current.handle)
      current = current.parent_category_id ? byId.get(current.parent_category_id) : undefined
    }
    return parts.join(" / ")
  }

  return list
    .map((row) => ({
      path: pathFor(row),
      handle: row.handle,
      active: row.is_active ?? null,
    }))
    .sort((a, b) => a.handle.localeCompare(b.handle))
}

function mediaHost(url: string) {
  try {
    return new URL(url).host
  } catch {
    return "(bad-url)"
  }
}

export async function createParitySnapshot(container: MedusaContainer): Promise<ParitySnapshot> {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)
  const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  const artistService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const merchEventService = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)
  const homepageSectionService = container.resolve<HomepageSectionModuleService>(HOMEPAGE_SECTION_MODULE)

  const [
    rawCategoriesResult,
    rawProductsResult,
    rawRegionsResult,
    stores,
    feelingsRootResult,
    occasions,
    artists,
    merchEvents,
    homepageSections,
  ] = await Promise.all([
    query.graph({
      entity: "product_category",
      fields: ["id", "name", "handle", "is_active", "parent_category_id", "rank"],
    }),
    query.graph({
      entity: "product",
      fields: ["handle", "thumbnail"],
      pagination: { take: 5000, order: { handle: "ASC" } },
    }),
    query.graph({
      entity: "region",
      fields: ["name", "currency_code"],
    }),
    storeModule.listStores(),
    query.graph({
      entity: "product_category",
      fields: ["id"],
      filters: { handle: FEELINGS_ROOT_HANDLE },
    }),
    occasionService.listOccasions({}),
    artistService.listArtists({}),
    merchEventService.listMerchEvents({}),
    homepageSectionService.listHomepageSections({}),
  ])

  const feelingsRootId = (feelingsRootResult.data as Array<{ id: string }> | undefined)?.[0]?.id
  const feelingSlugs: string[] = []
  const subfeelingSlugs: string[] = []

  if (feelingsRootId) {
    const { data: topFeelings } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
      filters: { parent_category_id: feelingsRootId },
    })
    for (const row of (topFeelings || []) as Array<{ id: string; handle: string }>) {
      if (row.handle) feelingSlugs.push(row.handle)
      const { data: subs } = await query.graph({
        entity: "product_category",
        fields: ["handle"],
        filters: { parent_category_id: row.id },
      })
      for (const sub of (subs || []) as Array<{ handle: string }>) {
        if (sub.handle) subfeelingSlugs.push(sub.handle)
      }
    }
  }

  const products = ((rawProductsResult.data || []) as Array<{ handle: string; thumbnail?: string | null }>).slice()
  const mediaHosts = [...new Set(products.map((p) => p.thumbnail || "").filter(Boolean).map(mediaHost))].sort()
  const store = stores[0]

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      databaseHint: databaseHint(),
      medusaBackendUrl: process.env.MEDUSA_BACKEND_URL || null,
    },
    snapshot: {
      productCategories: categoryPaths((rawCategoriesResult.data || []) as CatRow[]),
      productHandles: products.map((p) => p.handle).sort(),
      productCount: products.length,
      regions: ((rawRegionsResult.data || []) as Array<{ name: string; currency_code: string }>)
        .map((region) => ({ name: region.name, currency: region.currency_code }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      storeDefaultCurrency: store?.supported_currencies?.find((c: { is_default?: boolean }) => c.is_default)?.currency_code ?? null,
      feelingSlugs: feelingSlugs.sort(),
      subfeelingSlugs: subfeelingSlugs.sort(),
      occasionSlugs: ((occasions || []) as Array<{ slug?: string | null }>).map((o) => o.slug || "").filter(Boolean).sort(),
      artistSlugs: ((artists || []) as Array<{ slug?: string | null }>).map((a) => a.slug || "").filter(Boolean).sort(),
      merchEventSlugs: ((merchEvents || []) as Array<{ slug?: string | null }>).map((e) => e.slug || "").filter(Boolean).sort(),
      homepageSections: ((homepageSections || []) as Array<{ active?: boolean; key?: string; sort_order?: number; type?: string }>)
        .map((section) => ({
          key: section.key || "",
          type: section.type || "",
          active: section.active !== false,
          sortOrder: Number(section.sort_order || 0),
        }))
        .filter((section) => Boolean(section.key))
        .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key)),
      productThumbnailHosts: mediaHosts,
    },
  }
}

function remoteParityPath() {
  return process.env.PARITY_REMOTE_SNAPSHOT_FILE?.trim() || path.resolve(process.cwd(), ".parity/railway.json")
}

export function snapshotOnly(value: unknown): ParitySnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  if (record.snapshot && typeof record.snapshot === "object") {
    return value as ParitySnapshot
  }
  return null
}

export function diffSet(left: string[], right: string[]) {
  const rightSet = new Set(right)
  return left.filter((item) => !rightSet.has(item)).sort()
}

export function categoryHandles(snapshot: ParitySnapshot) {
  return snapshot.snapshot.productCategories.map((category) => category.handle).sort()
}

export async function getParityDetail(container: MedusaContainer): Promise<ParityDetail> {
  const local = await createParitySnapshot(container)
  const remotePath = remoteParityPath()
  if (!existsSync(remotePath)) {
    return {
      local,
      remote: null,
      comparison: {
        status: "missing_remote",
        remotePath,
        productCountDelta: null,
        productsOnlyLocal: [],
        productsOnlyRemote: [],
        categoriesOnlyLocal: [],
        categoriesOnlyRemote: [],
        differingFields: [],
      },
    }
  }

  const parsed = JSON.parse(await fs.readFile(remotePath, "utf-8")) as unknown
  const remote = snapshotOnly(parsed)
  if (!remote) {
    throw new Error(`${remotePath}: missing .snapshot`)
  }

  const productsOnlyLocal = diffSet(local.snapshot.productHandles, remote.snapshot.productHandles)
  const productsOnlyRemote = diffSet(remote.snapshot.productHandles, local.snapshot.productHandles)
  const localCategories = categoryHandles(local)
  const remoteCategories = categoryHandles(remote)
  const categoriesOnlyLocal = diffSet(localCategories, remoteCategories)
  const categoriesOnlyRemote = diffSet(remoteCategories, localCategories)
  const differingFields: string[] = []
  for (const field of ["feelingSlugs", "subfeelingSlugs", "occasionSlugs", "artistSlugs", "merchEventSlugs"] as const) {
    if (JSON.stringify(local.snapshot[field]) !== JSON.stringify(remote.snapshot[field])) {
      differingFields.push(field)
    }
  }
  if (JSON.stringify(local.snapshot.regions) !== JSON.stringify(remote.snapshot.regions)) {
    differingFields.push("regions")
  }
  if (local.snapshot.storeDefaultCurrency !== remote.snapshot.storeDefaultCurrency) {
    differingFields.push("storeDefaultCurrency")
  }
  if (JSON.stringify(local.snapshot.productThumbnailHosts) !== JSON.stringify(remote.snapshot.productThumbnailHosts)) {
    differingFields.push("productThumbnailHosts")
  }

  const productCountDelta = local.snapshot.productCount - remote.snapshot.productCount
  const status =
    productCountDelta === 0 &&
    productsOnlyLocal.length === 0 &&
    productsOnlyRemote.length === 0 &&
    categoriesOnlyLocal.length === 0 &&
    categoriesOnlyRemote.length === 0 &&
    differingFields.length === 0
      ? "match"
      : "mismatch"

  return {
    local,
    remote,
    comparison: {
      status,
      remotePath,
      productCountDelta,
      productsOnlyLocal,
      productsOnlyRemote,
      categoriesOnlyLocal,
      categoriesOnlyRemote,
      differingFields,
    },
  }
}

export async function checkS3Health(): Promise<HealthCheckResult> {
  const config = resolveS3ConfigFromEnv()
  if (!config) {
    return {
      status: "warn",
      title: "S3",
      summary: "S3 is not fully configured.",
      details: {
        storeMediaPath: storeMediaPublicPath(),
        proxyEnv: process.env.S3_USE_STORE_MEDIA_PROXY ?? "(unset)",
        medusaBackendUrl: process.env.MEDUSA_BACKEND_URL ? "(set)" : "(unset)",
      },
    }
  }

  try {
    const client = createS3Client(config)
    await client.send(new HeadBucketCommand({ Bucket: config.bucket }))
    const listed = await client.send(new ListObjectsV2Command({ Bucket: config.bucket, MaxKeys: 5 }))
    const keys = (listed.Contents || []).map((item) => item.Key).filter(Boolean)
    return {
      status: "ok",
      title: "S3",
      summary: `Bucket reachable: ${config.bucket}.`,
      details: {
        bucket: config.bucket,
        region: config.region,
        endpoint: config.endpoint ?? "(default)",
        fileUrl: config.fileUrl,
        forcePathStyle: config.forcePathStyle,
        sampleKeys: keys,
      },
    }
  } catch (error) {
    return {
      status: "error",
      title: "S3",
      summary: error instanceof Error ? error.message : String(error),
      details: {
        bucket: config.bucket,
        endpoint: config.endpoint ?? "(default)",
      },
    }
  }
}

export async function checkPaymentProviders(container: MedusaContainer): Promise<HealthCheckResult> {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const expected = getEgyptRegionPaymentProviders()
  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
    filters: { name: EGYPT_REGION_NAME },
    pagination: { take: 1 },
  })
  const row = data?.[0] as
    | { id?: string; name?: string; currency_code?: string; payment_providers?: Array<{ id?: string }> }
    | undefined

  if (!row?.id) {
    return {
      status: "error",
      title: "Payment Providers",
      summary: `Region "${EGYPT_REGION_NAME}" not found.`,
      details: { expected },
    }
  }

  const linked = (row.payment_providers ?? []).map((provider) => provider.id).filter((id): id is string => Boolean(id))
  const missing = expected.filter((id) => !linked.includes(id))
  return {
    status: missing.length ? "warn" : "ok",
    title: "Payment Providers",
    summary: missing.length
      ? `${missing.length} expected provider(s) missing from ${row.name}.`
      : `${linked.length} payment provider(s) linked to ${row.name}.`,
    details: {
      region: { id: row.id, name: row.name, currency: row.currency_code },
      linked,
      expected,
      missing,
    },
  }
}

export async function checkPromotions(container: MedusaContainer): Promise<HealthCheckResult> {
  const promotionModule = container.resolve(Modules.PROMOTION) as {
    listPromotions: (filters: Record<string, unknown>, config?: Record<string, unknown>) => Promise<Array<{ code?: string | null; id?: string; status?: string; is_automatic?: boolean }>>
  }
  const [horoPromotions, activeAutomatic] = await Promise.all([
    promotionModule.listPromotions({}, { take: 200 }),
    promotionModule.listPromotions({ is_automatic: true, status: ["active"] }, { take: 50 }),
  ])
  const horo = horoPromotions.filter((promotion) => (promotion.code ?? "").toUpperCase().startsWith("HORO_"))
  return {
    status: activeAutomatic.length ? "ok" : "warn",
    title: "Promotions",
    summary: `${activeAutomatic.length} active automatic promotion(s); ${horo.length} HORO_* promotion(s).`,
    details: {
      activeAutomaticCount: activeAutomatic.length,
      horoPromotionCount: horo.length,
      activeAutomaticCodes: activeAutomatic.map((promotion) => promotion.code).filter(Boolean),
      horoCodes: horo.map((promotion) => promotion.code).filter(Boolean),
    },
  }
}

export async function checkParity(container: MedusaContainer): Promise<HealthCheckResult> {
  const detail = await getParityDetail(container)
  const snapshot = detail.local
  const status = detail.comparison.status === "mismatch" ? "warn" : "ok"
  return {
    status,
    title: "Parity Snapshot",
    summary:
      detail.comparison.status === "missing_remote"
        ? `${snapshot.snapshot.productCount} local product(s). Remote snapshot file not found.`
        : `${snapshot.snapshot.productCount} local product(s); parity ${detail.comparison.status}.`,
    details: {
      productCount: snapshot.snapshot.productCount,
      productCategoryCount: snapshot.snapshot.productCategories.length,
      regionCount: snapshot.snapshot.regions.length,
      mediaHosts: snapshot.snapshot.productThumbnailHosts,
      databaseHint: snapshot.meta.databaseHint,
      comparison: detail.comparison,
    },
  }
}

export async function checkOrderQuality(container: MedusaContainer): Promise<HealthCheckResult> {
  const query = container.resolve<Query>(ContainerRegistrationKeys.QUERY)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "metadata", "status", "total", "created_at"],
    pagination: { take: 500, order: { created_at: "DESC" } },
  })
  const rows = ((data || []) as Array<Record<string, unknown>>).filter((row) => {
    const createdAt = typeof row.created_at === "string" ? Date.parse(row.created_at) : NaN
    return Number.isFinite(createdAt) ? createdAt >= since.getTime() : true
  })

  const qualityScores = rows
    .map((row) => {
      const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {}
      const score = metadata.quality_score
      return typeof score === "number" && Number.isFinite(score) ? score : null
    })
    .filter((score): score is number => score != null)
  const averageQuality =
    qualityScores.length > 0
      ? Math.round((qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length) * 10) / 10
      : null
  const codCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const status = readCodConfirmationMetadata(row).codConfirmationStatus
    acc[status] = (acc[status] ?? 0) + 1
    return acc
  }, {})
  const lowQualityCount = qualityScores.filter((score) => score < 3).length
  const pendingCodCount = codCounts.pending ?? 0
  const status: HealthStatus =
    rows.length === 0
      ? "warn"
      : lowQualityCount > 0 || pendingCodCount > 0
        ? "warn"
        : "ok"

  return {
    status,
    title: "Order Quality",
    summary:
      rows.length === 0
        ? "No orders in the last 7 days."
        : `${rows.length} order(s) in 7 days; average quality ${averageQuality ?? "not scored"}; ${pendingCodCount} pending COD confirmation(s).`,
    details: {
      windowDays: 7,
      orderCount: rows.length,
      scoredOrderCount: qualityScores.length,
      averageQuality,
      lowQualityCount,
      codCounts,
    },
  }
}

async function settle<T>(fn: () => Promise<HealthCheckResult<T>>, title: string): Promise<HealthCheckResult<T>> {
  try {
    return await fn()
  } catch (error) {
    return {
      status: "error",
      title,
      summary: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function getOpsHealth(container: MedusaContainer): Promise<OpsHealthPayload> {
  const [s3, paymentProviders, promotions, parity, orderQuality] = await Promise.all([
    settle(() => checkS3Health(), "S3"),
    settle(() => checkPaymentProviders(container), "Payment Providers"),
    settle(() => checkPromotions(container), "Promotions"),
    settle(() => checkParity(container), "Parity Snapshot"),
    settle(() => checkOrderQuality(container), "Order Quality"),
  ])

  return {
    generatedAt: new Date().toISOString(),
    checks: {
      s3,
      paymentProviders,
      promotions,
      parity,
      orderQuality,
    },
  }
}
