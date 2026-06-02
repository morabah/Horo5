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

const BACK_LIKE_URL_PATTERN = /(?:^|[/_-])(back|rear)(?:[/_\-.]|$)/i
const FLAT_LAY_URL_PATTERN = /(?:^|[/_-])flat[-_]?lay(?:[/_\-.]|$)/i

const BACK_LIKE_TAGS = new Set<StorefrontMediaGalleryTag | "main" | "card">([
  "back",
  "flat_lay",
])

export function isBackLikeMediaUrl(src: string | null | undefined): boolean {
  const value = src?.trim()
  if (!value) return false
  return BACK_LIKE_URL_PATTERN.test(value) || FLAT_LAY_URL_PATTERN.test(value)
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
    if (url && !isBackLikeMediaUrl(url) && !isBackLikeGalleryTag(tag)) {
      card = url
      break
    }
  }

  const mainCandidate = byTag("main")
  const main =
    mainCandidate && !isBackLikeMediaUrl(mainCandidate) ? mainCandidate : card ?? byTag("artwork_detail")

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
