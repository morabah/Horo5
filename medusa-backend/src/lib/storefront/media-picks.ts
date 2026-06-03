/**
 * Homepage / PLP media contract:
 * - card — homepage and PLP card image
 * - main — PDP primary hero
 * - artwork_detail — print close-up (editorial, cards)
 * - lifestyle — on-body front
 * - back — PDP gallery only (never card/main)
 * - flat_lay — folded product / proof
 * - gift — packaging / gift context (gift block)
 */
import type { DropImageInput } from "../drops/types"
import type { StorefrontMediaGalleryItemDTO, StorefrontMediaGalleryTag } from "./types"

/** Align with web-next `images.ts` — backview/back-view must not become card/main. */
const BACK_LIKE_URL_PATTERN = /(?:^|[/_-])(back|rear|backview|back-view)(?:[/_\-.]|$)/i
const FLAT_LAY_URL_PATTERN = /(?:^|[/_-])flat[-_]?lay(?:[/_\-.]|$)/i
/** Plain garment / blank tee — not a graphic-forward PDP or card lead. */
const PLAIN_GARMENT_URL_PATTERN =
  /(?:^|[/_-])(?:plain|blank|white[-_]?tee|garment[-_]?only|undecorated|no[-_]?print|tee[-_]?only|mock[-_]?blank|studio[-_]?blank)(?:[/_\-.]|$)/i

const BACK_LIKE_TAGS = new Set<StorefrontMediaGalleryTag | "main" | "card">([
  "back",
  "flat_lay",
])

export function isBackLikeMediaUrl(src: string | null | undefined): boolean {
  const value = src?.trim()
  if (!value) return false
  return BACK_LIKE_URL_PATTERN.test(value) || FLAT_LAY_URL_PATTERN.test(value)
}

export function isPlainGarmentMediaUrl(src: string | null | undefined): boolean {
  const value = src?.trim()
  if (!value) return false
  return PLAIN_GARMENT_URL_PATTERN.test(value)
}

function isGraphicForwardMediaUrl(src: string | null | undefined): boolean {
  const value = src?.trim()
  if (!value) return false
  if (isBackLikeMediaUrl(value) || isPlainGarmentMediaUrl(value)) return false
  if (value.includes("horo_vectorized") || value.includes("brand-placeholder")) return false
  if (value.includes("/images/proof/") && value.endsWith(".svg")) return false
  return true
}

export function isBackLikeGalleryTag(tag: string | undefined): boolean {
  if (!tag) return false
  return BACK_LIKE_TAGS.has(tag as StorefrontMediaGalleryTag)
}

/** Prefer front-facing drop images for card/main slots (homepage + PLP). */
export function pickDropFrontMediaUrls(images: DropImageInput[]): {
  main?: string
  card?: string
} {
  const byTag = (tag: DropImageInput["tag"]) =>
    images.find((image) => image.tag === tag && image.url?.trim())?.url?.trim()

  const frontOrder: DropImageInput["tag"][] = [
    "card",
    "artwork_detail",
    "lifestyle",
    "main",
    "proof_print",
  ]

  let card: string | undefined
  for (const tag of frontOrder) {
    const url = byTag(tag)
    if (url && !isBackLikeMediaUrl(url) && !isPlainGarmentMediaUrl(url) && !isBackLikeGalleryTag(tag)) {
      card = url
      break
    }
  }

  const mainCandidate = byTag("main")
  const main =
    mainCandidate && isGraphicForwardMediaUrl(mainCandidate)
      ? mainCandidate
      : card ?? byTag("artwork_detail") ?? byTag("lifestyle")

  if (!card) {
    card = main
  }

  return {
    ...(main ? { main } : {}),
    ...(card ? { card } : {}),
  }
}

const GALLERY_TAGS = new Set<StorefrontMediaGalleryTag>([
  "proof_fabric",
  "proof_print",
  "proof_wash",
  "lifestyle",
  "flat_lay",
  "artwork_detail",
  "back",
  "gift",
])

function asStorefrontGalleryTag(tag: DropImageInput["tag"]): StorefrontMediaGalleryTag | undefined {
  if (!tag || tag === "main" || tag === "card") return undefined
  return GALLERY_TAGS.has(tag as StorefrontMediaGalleryTag) ? (tag as StorefrontMediaGalleryTag) : undefined
}

export function galleryForStorefront(images: DropImageInput[]): StorefrontMediaGalleryItemDTO[] {
  return images.flatMap((image) => {
    const tag = asStorefrontGalleryTag(image.tag)
    if (!tag) return []
    return [{ url: image.url, tag }]
  })
}

/**
 * PDP gallery tag order (after safe `mainUrl`).
 * Lifestyle before artwork_detail so on-body fit precedes print close-ups.
 */
export const PDP_GALLERY_TAG_PRIORITY: StorefrontMediaGalleryTag[] = [
  "lifestyle",
  "artwork_detail",
  "proof_print",
  "proof_fabric",
  "proof_wash",
  "back",
  "gift",
  "flat_lay",
]

function dedupeGalleryItems(items: StorefrontMediaGalleryItemDTO[]): StorefrontMediaGalleryItemDTO[] {
  const seen = new Set<string>()
  const ordered: StorefrontMediaGalleryItemDTO[] = []
  for (const item of items) {
    const url = item.url?.trim()
    if (!url || seen.has(url)) continue
    seen.add(url)
    ordered.push({ url, ...(item.tag ? { tag: item.tag } : {}) })
  }
  return ordered
}

export function orderGalleryByTags(
  items: StorefrontMediaGalleryItemDTO[],
  options?: { mainUrl?: string | null },
): StorefrontMediaGalleryItemDTO[] {
  const mainUrl = options?.mainUrl?.trim()
  const byTag = new Map<StorefrontMediaGalleryTag, StorefrontMediaGalleryItemDTO[]>()
  const safeUntagged: StorefrontMediaGalleryItemDTO[] = []
  const backLikeUntagged: StorefrontMediaGalleryItemDTO[] = []

  for (const item of items) {
    const url = item.url?.trim()
    if (!url) continue
    const tag = item.tag
    if (tag && PDP_GALLERY_TAG_PRIORITY.includes(tag)) {
      const bucket = byTag.get(tag) ?? []
      bucket.push({ url, tag })
      byTag.set(tag, bucket)
    } else if (isBackLikeMediaUrl(url)) {
      backLikeUntagged.push({ url })
    } else {
      safeUntagged.push({ url })
    }
  }

  const ordered: StorefrontMediaGalleryItemDTO[] = []
  const plainMain: StorefrontMediaGalleryItemDTO[] = []
  if (mainUrl && !isBackLikeMediaUrl(mainUrl)) {
    if (isPlainGarmentMediaUrl(mainUrl)) {
      plainMain.push({ url: mainUrl })
    } else {
      ordered.push({ url: mainUrl })
    }
  }
  ordered.push(...safeUntagged)
  for (const tag of PDP_GALLERY_TAG_PRIORITY) {
    ordered.push(...(byTag.get(tag) ?? []))
  }
  ordered.push(...plainMain)
  ordered.push(...backLikeUntagged)
  return dedupeGalleryItems(ordered)
}
