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

export async function triggerStorefrontRevalidation(tags: string[] = DEFAULT_REVALIDATE_TAGS) {
  const url = resolveRevalidateUrl()
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim()

  if (!url || !secret) {
    return
  }

  await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify({ tags }),
  })
}
