import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const DEFAULT_TAGS = ["catalog", "taxonomy"]
const MAX_TAGS = 40
const TAG_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim()
  const providedSecret = request.headers.get("x-revalidate-secret")?.trim()

  if (!secret || providedSecret !== secret) {
    console.warn("[storefront/revalidate] unauthorized request")
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as {
    tags?: string[]
  }

  const rawTags = Array.isArray(payload.tags) && payload.tags.length > 0 ? payload.tags : DEFAULT_TAGS
  const tags = [...new Set(rawTags)]
    .filter((tag): tag is string => typeof tag === "string" && TAG_PATTERN.test(tag))
    .slice(0, MAX_TAGS)

  if (tags.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid tags" }, { status: 400 })
  }

  for (const tag of tags) {
    revalidateTag(tag, "default")
  }

  console.info("[storefront/revalidate] completed", {
    durationMs: Date.now() - startedAt,
    tags,
  })

  return NextResponse.json({ ok: true, revalidated: tags })
}
