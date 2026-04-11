import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const DEFAULT_TAGS = ["catalog", "taxonomy"]

export async function POST(request: NextRequest) {
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET?.trim()
  const providedSecret = request.headers.get("x-revalidate-secret")?.trim()

  if (!secret || providedSecret !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as {
    tags?: string[]
  }

  const tags = Array.isArray(payload.tags) && payload.tags.length > 0 ? payload.tags : DEFAULT_TAGS

  for (const tag of tags) {
    revalidateTag(tag, "default")
  }

  return NextResponse.json({ ok: true, revalidated: tags })
}
