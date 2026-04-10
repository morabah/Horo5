import { listProducts } from "./client"
import { toCatalog } from "./adapters"
import { setRuntimeProducts } from "../../data/site"

let hydrated = false

export async function hydrateRuntimeCatalog(): Promise<void> {
  if (hydrated) return
  try {
    const { products } = await listProducts()
    const mapped = toCatalog(products)
    if (mapped.length > 0) {
      setRuntimeProducts(mapped)
      hydrated = true
    }
  } catch {
    // Keep local fallback catalog when Medusa is unavailable.
  }
}
