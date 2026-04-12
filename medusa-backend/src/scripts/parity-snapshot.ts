import fs from "node:fs"
import path from "node:path"

import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

import { FEELINGS_ROOT_HANDLE } from "../lib/storefront/feeling-category-metadata"
import { ARTIST_MODULE } from "../modules/artist"
import type ArtistModuleService from "../modules/artist/service"
import { MERCH_EVENT_MODULE } from "../modules/merch-event"
import type MerchEventModuleService from "../modules/merch-event/service"
import { OCCASION_MODULE } from "../modules/occasion"
import type OccasionModuleService from "../modules/occasion/service"

type CatRow = {
  id: string
  name: string
  handle: string
  is_active?: boolean
  parent_category_id?: string | null
  rank?: number
}

function databaseHint(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    return "(no DATABASE_URL)"
  }
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
  const list = ((rows || []) as CatRow[]).slice()
  const byId = new Map(list.map((r) => [r.id, r]))

  function pathFor(row: CatRow): string {
    const parts: string[] = []
    let cur: CatRow | undefined = row
    let guard = 0
    while (cur && guard++ < 32) {
      parts.unshift(cur.handle)
      const pid = cur.parent_category_id
      cur = pid ? byId.get(pid) : undefined
    }
    return parts.join(" / ")
  }

  return list
    .map((r) => ({
      path: pathFor(r),
      handle: r.handle,
      active: r.is_active ?? null,
    }))
    .sort((a, b) => a.handle.localeCompare(b.handle))
}

/**
 * Emits one JSON document: `meta` (volatile) + `snapshot` (compare local vs remote).
 *
 * Local:  npx medusa exec ./src/scripts/parity-snapshot.ts > .parity/local.json
 * Remote: railway run npm run parity:snapshot:public > .parity/railway.json
 * Diff:   node scripts/compare-parity-json.mjs .parity/local.json .parity/railway.json
 */
export default async function paritySnapshot({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const storeModule = container.resolve(Modules.STORE)

  const occasionService = container.resolve<OccasionModuleService>(OCCASION_MODULE)
  const artistService = container.resolve<ArtistModuleService>(ARTIST_MODULE)
  const merchEventService = container.resolve<MerchEventModuleService>(MERCH_EVENT_MODULE)

  const { data: rawCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "is_active", "parent_category_id", "rank"],
  })

  const { data: rawProducts } = await query.graph({
    entity: "product",
    fields: ["handle", "thumbnail"],
    pagination: { take: 5000, order: { handle: "ASC" } },
  })

  const { data: rawRegions } = await query.graph({
    entity: "region",
    fields: ["name", "currency_code"],
  })

  const stores = await storeModule.listStores()
  const store = stores[0]

  const { data: feelingsRootRows } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { handle: FEELINGS_ROOT_HANDLE },
  })
  const feelingsRootId = (feelingsRootRows as Array<{ id: string }> | undefined)?.[0]?.id

  const feelingSlugs: string[] = []
  const subfeelingSlugs: string[] = []

  if (feelingsRootId) {
    const { data: topFeelings } = await query.graph({
      entity: "product_category",
      fields: ["id", "handle"],
      filters: { parent_category_id: feelingsRootId },
    })
    for (const row of (topFeelings || []) as Array<{ handle: string }>) {
      if (row.handle) {
        feelingSlugs.push(row.handle)
      }
    }

    for (const row of (topFeelings || []) as Array<{ id: string }>) {
      const { data: subs } = await query.graph({
        entity: "product_category",
        fields: ["handle"],
        filters: { parent_category_id: row.id },
      })
      for (const sub of (subs || []) as Array<{ handle: string }>) {
        if (sub.handle) {
          subfeelingSlugs.push(sub.handle)
        }
      }
    }
  }

  feelingSlugs.sort()
  subfeelingSlugs.sort()

  const occasions = (await occasionService.listOccasions({})) as Array<{ slug?: string }>
  const artists = (await artistService.listArtists({})) as Array<{ slug?: string }>
  const merchEvents = (await merchEventService.listMerchEvents({})) as Array<{ slug?: string }>

  const products = ((rawProducts || []) as Array<{ handle: string; thumbnail?: string | null }>).slice()
  const thumbs = products
    .map((p) => p.thumbnail || "")
    .filter(Boolean)
  const mediaHosts = [...new Set(thumbs.map((u) => {
    try {
      return new URL(u).host
    } catch {
      return "(bad-url)"
    }
  }))].sort()

  const snapshot = {
    productCategories: categoryPaths((rawCategories || []) as CatRow[]),
    productHandles: products.map((p) => p.handle).sort(),
    productCount: products.length,
    regions: ((rawRegions || []) as Array<{ name: string; currency_code: string }>)
      .map((r) => ({ name: r.name, currency: r.currency_code }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    storeDefaultCurrency: store?.supported_currencies?.find((c: { is_default?: boolean }) => c.is_default)?.currency_code ?? null,
    feelingSlugs,
    subfeelingSlugs,
    occasionSlugs: occasions.map((o) => o.slug || "").filter(Boolean).sort(),
    artistSlugs: artists.map((a) => a.slug || "").filter(Boolean).sort(),
    merchEventSlugs: merchEvents.map((e) => e.slug || "").filter(Boolean).sort(),
    /** Thumbnail URL hosts (detect mixed localhost vs production media). */
    productThumbnailHosts: mediaHosts,
  }

  const out = {
    meta: {
      generatedAt: new Date().toISOString(),
      databaseHint: databaseHint(),
      medusaBackendUrl: process.env.MEDUSA_BACKEND_URL || null,
    },
    snapshot,
  }

  const json = JSON.stringify(out, null, 2)
  const outFile = process.env.PARITY_OUTPUT_FILE?.trim()

  if (outFile) {
    const dir = path.dirname(outFile)
    if (dir && dir !== ".") {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(outFile, json, "utf8")
    // eslint-disable-next-line no-console
    console.log(`parity-snapshot: wrote ${outFile}`)
  } else {
    // eslint-disable-next-line no-console
    console.log(json)
  }
}
