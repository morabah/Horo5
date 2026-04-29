const DEFAULT_REVALIDATE_TAGS = ["catalog", "taxonomy"]

function resolveRevalidateUrl() {
  const explicit = process.env.STOREFRONT_REVALIDATE_URL?.trim()
  if (explicit) {
    return explicit
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "")
  if (!siteUrl) {
    return null
  }

  return `${siteUrl}/api/revalidate/storefront`
}

const DEBOUNCE_MS = 500
let pendingTags = new Set<string>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null

async function postRevalidateTags(tags: string[]) {
  const url = resolveRevalidateUrl()
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim()

  if (!url || !secret) {
    if (String(process.env.STOREFRONT_REVALIDATE_DEBUG || "").trim() === "1") {
      console.info("[storefront/revalidate] skipped; STOREFRONT_REVALIDATE_URL or secret is unset")
    }
    return
  }

  const timeoutMs = Math.max(
    1000,
    Number(String(process.env.STOREFRONT_REVALIDATE_TIMEOUT_MS || "5000").trim()) || 5000
  )
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify({ tags }),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeout)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`Storefront revalidation failed (${response.status}): ${text.slice(0, 300)}`)
  }

  if (String(process.env.STOREFRONT_REVALIDATE_DEBUG || "").trim() === "1") {
    console.info(`[storefront/revalidate] posted tags=${tags.join(",")}`)
  }
}

export async function triggerStorefrontRevalidation(tags: string[] = DEFAULT_REVALIDATE_TAGS) {
  for (const tag of tags) {
    pendingTags.add(tag)
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    const merged = [...pendingTags]
    pendingTags = new Set()
    void postRevalidateTags(merged)
  }, DEBOUNCE_MS)
}
