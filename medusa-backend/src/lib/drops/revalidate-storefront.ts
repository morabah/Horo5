/**
 * Fire-and-forget revalidation of the Next.js storefront ISR cache after a drop is saved.
 *
 * Uses the storefront's /api/revalidate/storefront endpoint (secured by
 * STOREFRONT_REVALIDATE_SECRET) to bust the `product:<handle>` and `catalog`
 * ISR tags so the next page load reflects the updated product data.
 */

const REVALIDATE_URL = process.env.STOREFRONT_REVALIDATE_URL?.trim()
const REVALIDATE_SECRET = process.env.STOREFRONT_REVALIDATE_SECRET?.trim()

export function revalidateStorefrontForDrop(handle: string): void {
  if (!REVALIDATE_URL || !REVALIDATE_SECRET) {
    return
  }

  const tags = [
    `product:${handle}`,
    "catalog",
    "storefront",
  ]

  // Fire-and-forget — do not block the admin response on this.
  fetch(REVALIDATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-revalidate-secret": REVALIDATE_SECRET,
    },
    body: JSON.stringify({ tags }),
  })
    .then((res) => {
      if (!res.ok) {
        console.warn("[drops/revalidate] storefront revalidation failed", res.status)
      }
    })
    .catch((err) => {
      console.warn("[drops/revalidate] storefront revalidation error", err instanceof Error ? err.message : err)
    })
}
