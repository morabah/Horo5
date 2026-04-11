import { setRuntimeCatalog } from "../../data/site"
import { fetchStorefrontCatalog } from "../storefront/client"

const LAST_CATALOG_STORAGE_KEY = "horo:lastCatalog"

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
