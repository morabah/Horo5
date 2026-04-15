import type { Product } from "../../data/catalog-types"
import { setRuntimeCatalog } from "../../data/site"
import { fetchStorefrontCatalog } from "../storefront/client"

const LAST_CATALOG_STORAGE_KEY = "horo:lastCatalog"

/** Fallback when `getProduct` is not hydrated yet but `horo:lastCatalog` was primed (e.g. E2E / fast taps). */
export function readProductFromLastCatalogStorage(slug: string): Product | undefined {
  if (typeof globalThis.window === "undefined") return undefined
  try {
    const raw = window.sessionStorage.getItem(LAST_CATALOG_STORAGE_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as { products?: Product[] }
    return parsed.products?.find((p) => p.slug === slug)
  } catch {
    return undefined
  }
}

let hydrated = false

export async function hydrateRuntimeCatalog(): Promise<void> {
  if (hydrated) return
  try {
    const catalog = await fetchStorefrontCatalog()
    if (
      catalog.products.length > 0 ||
      catalog.feelings.length > 0 ||
      catalog.subfeelings.length > 0 ||
      catalog.artists.length > 0
    ) {
      setRuntimeCatalog(catalog)
      hydrated = true
      try {
        sessionStorage.setItem(LAST_CATALOG_STORAGE_KEY, JSON.stringify(catalog))
      } catch {
        /* ignore */
      }
    }
  } catch {
    // Keep local fallback catalog when Medusa is unavailable.
  }
}
