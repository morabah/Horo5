import path from "node:path"

import {
  DROP_ARTIST_PAYMENT_MODELS,
  DROP_BUYER_ROUTES,
  DEFAULT_DROP_SIZES,
  DROP_DECORATION_TYPES,
  DROP_IMAGE_TAGS,
  DROP_PRIMARY_AUDIENCES,
  DROP_STATUSES,
  type DropImageInput,
  type DropImageTag,
  type DropStatus,
  type DropValidationIssue,
  type ProductSizeKey,
  type UpsertDropPayload,
} from "./types"
import { PRODUCT_SIZE_SET } from "../shared/constants"

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PATH_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/
const STATUS_SET = new Set<string>(DROP_STATUSES)
const DECORATION_SET = new Set<string>(DROP_DECORATION_TYPES)
const IMAGE_TAG_SET = new Set<string>(DROP_IMAGE_TAGS)
const ARTIST_PAYMENT_MODEL_SET = new Set<string>(DROP_ARTIST_PAYMENT_MODELS)
const BUYER_ROUTE_SET = new Set<string>(DROP_BUYER_ROUTES)
const PRIMARY_AUDIENCE_SET = new Set<string>(DROP_PRIMARY_AUDIENCES)
const FIRST_WEDGE_BUYER_ROUTES = new Set(["feeling", "moment", "gift"])

const TAG_PREFIXES: Array<{ prefix: string; tag: DropImageTag }> = [
  { prefix: "main", tag: "main" },
  { prefix: "hero", tag: "main" },
  { prefix: "cover", tag: "main" },
  { prefix: "card", tag: "card" },
  { prefix: "artwork_detail", tag: "artwork_detail" },
  { prefix: "artwork-detail", tag: "artwork_detail" },
  { prefix: "back", tag: "back" },
  { prefix: "lifestyle", tag: "lifestyle" },
  { prefix: "flat_lay", tag: "flat_lay" },
  { prefix: "flat-lay", tag: "flat_lay" },
  { prefix: "proof_fabric", tag: "proof_fabric" },
  { prefix: "proof-fabric", tag: "proof_fabric" },
  { prefix: "proof_print", tag: "proof_print" },
  { prefix: "proof-print", tag: "proof_print" },
  { prefix: "proof_wash", tag: "proof_wash" },
  { prefix: "proof-wash", tag: "proof_wash" },
  { prefix: "gift", tag: "gift" },
  { prefix: "packaging", tag: "gift" },
]

export class DropValidationError extends Error {
  readonly issues: DropValidationIssue[]

  constructor(issues: DropValidationIssue[]) {
    super(issues.map((issue) => `${issue.field}: ${issue.message}`).join("; "))
    this.name = "DropValidationError"
    this.issues = issues
  }
}

export function slugifyDropTitle(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function filenameToDropImageTag(filename: string): DropImageTag | undefined {
  const base = path.basename(filename, path.extname(filename)).toLowerCase()

  for (const { prefix, tag } of TAG_PREFIXES) {
    if (base === prefix || base.startsWith(`${prefix}-`) || base.startsWith(`${prefix}_`)) {
      return tag
    }
  }

  return undefined
}

export function normalizeDropStatus(value: unknown): DropStatus {
  return value === "draft" || value === "archived" || value === "published" ? value : "published"
}

export function normalizeDropImages(payload: Pick<UpsertDropPayload, "images" | "imagesByTag">): DropImageInput[] {
  const images: DropImageInput[] = []

  if (payload.imagesByTag?.main?.url) {
    images.push({
      ...payload.imagesByTag.main,
      tag: "main",
      order: payload.imagesByTag.main.order ?? 0,
    })
  }

  for (const image of payload.imagesByTag?.gallery ?? []) {
    images.push({ ...image, tag: image.tag === "main" ? "lifestyle" : image.tag })
  }

  for (const image of payload.images ?? []) {
    images.push(image)
  }

  const byKey = new Map<string, DropImageInput>()
  for (const image of images) {
    if (!image.url) continue
    const key = `${image.url}\0${image.tag ?? ""}`
    byKey.set(key, image)
  }

  return [...byKey.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export function mainDropImage(payload: Pick<UpsertDropPayload, "images" | "imagesByTag">): DropImageInput | undefined {
  return normalizeDropImages(payload).find((image) => image.tag === "main")
}

export function normalizeDropSizes(sizes?: ProductSizeKey[]): ProductSizeKey[] {
  const parsed = sizes?.length ? sizes : [...DEFAULT_DROP_SIZES]
  return parsed.filter((size, index) => parsed.indexOf(size) === index)
}

function pushIssue(issues: DropValidationIssue[], field: string, message: string) {
  issues.push({ field, message })
}

function validateSlug(issues: DropValidationIssue[], field: string, value: string | undefined) {
  if (value && !SLUG_RE.test(value)) {
    pushIssue(issues, field, `Invalid slug "${value}". Use lowercase letters, numbers, and hyphens.`)
  }
}

function validateSlugList(issues: DropValidationIssue[], field: string, values: string[] | undefined) {
  for (const value of values ?? []) {
    validateSlug(issues, field, value)
  }
}

function validateIsoDate(issues: DropValidationIssue[], field: string, value: string | undefined) {
  if (!value) return
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value) || Number.isNaN(Date.parse(value))) {
    pushIssue(issues, field, `${field} must be an ISO datetime, e.g. 2026-05-01T00:00:00Z.`)
  }
}

function imageCountByTag(images: DropImageInput[], tag: DropImageTag): number {
  return images.filter((image) => image.tag === tag && image.url?.trim()).length
}

function hasPositiveStockForSelectedSize(
  sizes: ProductSizeKey[],
  stockPerSize: Partial<Record<ProductSizeKey, number>> | undefined,
): boolean {
  if (!stockPerSize) return false
  return sizes.some((size) => {
    const qty = stockPerSize[size]
    return typeof qty === "number" && Number.isInteger(qty) && qty > 0
  })
}

export function validateDropPayload(payload: UpsertDropPayload): DropValidationIssue[] {
  const issues: DropValidationIssue[] = []
  const status = normalizeDropStatus(payload.status)
  const publishing = status === "published"

  if (!payload.handle?.trim()) {
    pushIssue(issues, "handle", "Handle is required.")
  } else {
    validateSlug(issues, "handle", payload.handle.trim())
  }

  if (!payload.title?.trim()) {
    pushIssue(issues, "title", "Title is required.")
  }

  if (publishing) {
    for (const field of ["story", "feeling", "subfeeling"] as const) {
      if (!payload[field]?.trim()) {
        pushIssue(issues, field, `${field} is required before publishing.`)
      }
    }
  }

  validateSlug(issues, "feeling", payload.feeling)
  validateSlug(issues, "subfeeling", payload.subfeeling)
  validateSlug(issues, "artist", payload.artist)
  validateSlugList(issues, "occasions", payload.occasions)
  validateSlugList(issues, "capsuleSlugs", payload.capsuleSlugs)
  validateSlugList(issues, "complementarySlugs", payload.complementarySlugs)
  validateSlugList(issues, "frequentlyBoughtWithSlugs", payload.frequentlyBoughtWithSlugs)
  validateSlugList(issues, "customersAlsoBoughtSlugs", payload.customersAlsoBoughtSlugs)
  validateSlugList(issues, "giftOccasionTags", payload.giftOccasionTags)

  if (payload.status && !STATUS_SET.has(payload.status)) {
    pushIssue(issues, "status", "Status must be draft, published, or archived.")
  }

  if (payload.apparelCategory && !PATH_RE.test(payload.apparelCategory)) {
    pushIssue(issues, "apparelCategory", "Apparel category must be a slash-separated category path.")
  }

  if (payload.decorationType && !DECORATION_SET.has(payload.decorationType)) {
    pushIssue(issues, "decorationType", "Decoration type must be plain, graphic, embroidered, or mixed.")
  }

  if (payload.artistPaymentModel && !ARTIST_PAYMENT_MODEL_SET.has(payload.artistPaymentModel)) {
    pushIssue(issues, "artistPaymentModel", "Artist payment model must be flat_fee, royalty, revenue_share, hybrid, or unknown.")
  }

  if (payload.buyerRoute && !BUYER_ROUTE_SET.has(payload.buyerRoute)) {
    pushIssue(issues, "buyerRoute", "Buyer route must be feeling, moment, gift, personality, artist_drop, or world.")
  }

  if (payload.primaryAudience && !PRIMARY_AUDIENCE_SET.has(payload.primaryAudience)) {
    pushIssue(issues, "primaryAudience", "Primary audience must be 25-40, 18-24, gift-buyer, artist-aware, or 40-plus.")
  }

  if (payload.priceEgp === undefined) {
    if (publishing) pushIssue(issues, "priceEgp", "priceEgp is required before publishing.")
  } else if (!Number.isSafeInteger(payload.priceEgp) || payload.priceEgp <= 0) {
    pushIssue(issues, "priceEgp", "priceEgp must be a whole EGP integer greater than 0.")
  }

  if (
    payload.originalPriceEgp !== undefined &&
    payload.originalPriceEgp !== null &&
    (!Number.isSafeInteger(payload.originalPriceEgp) || payload.originalPriceEgp <= 0)
  ) {
    pushIssue(issues, "originalPriceEgp", "originalPriceEgp must be a whole EGP integer greater than 0.")
  }

  const sizes = normalizeDropSizes(payload.sizes)
  for (const size of sizes) {
    if (!PRODUCT_SIZE_SET.has(size)) {
      pushIssue(issues, "sizes", `Invalid size "${size}". Use S, M, L, XL, or XXL.`)
    }
  }

  for (const [size, qty] of Object.entries(payload.stockPerSize ?? {})) {
    if (!PRODUCT_SIZE_SET.has(size)) {
      pushIssue(issues, `stockPerSize.${size}`, `Invalid size "${size}".`)
      continue
    }
    if (!sizes.includes(size as ProductSizeKey)) {
      pushIssue(issues, `stockPerSize.${size}`, `${size} is not selected in sizes.`)
    }
    if (!Number.isInteger(qty) || (qty as number) < 0) {
      pushIssue(issues, `stockPerSize.${size}`, "Stock quantity must be a non-negative integer.")
    }
  }

  const images = normalizeDropImages(payload)
  for (const [index, image] of images.entries()) {
    if (!image.url?.trim()) {
      pushIssue(issues, `images.${index}.url`, "Image URL is required.")
    }
    if (image.tag && !IMAGE_TAG_SET.has(image.tag)) {
      pushIssue(issues, `images.${index}.tag`, `Invalid image tag "${image.tag}".`)
    }
  }

  const mainImageCount = images.filter((image) => image.tag === "main").length
  if (mainImageCount > 1) {
    pushIssue(issues, "images", "Only one image can be tagged main.")
  }

  if (publishing && mainImageCount === 0) {
    pushIssue(issues, "images", "One image must be tagged main before publishing.")
  }

  if (publishing) {
    if (!payload.artist?.trim()) {
      pushIssue(issues, "artist", "Artist is required before publishing.")
    }
    if (!payload.sizeTableKey?.trim()) {
      pushIssue(issues, "sizeTableKey", "Size table is required before publishing.")
    }
    if (!payload.fitLabel?.trim()) {
      pushIssue(issues, "fitLabel", "Fit label is required before publishing.")
    }
    if (!hasPositiveStockForSelectedSize(sizes, payload.stockPerSize)) {
      pushIssue(issues, "stockPerSize", "Stock per size is required before publishing.")
    }
    if (imageCountByTag(images, "lifestyle") === 0) {
      pushIssue(issues, "images.lifestyle", "Lifestyle/on-body image is required before publishing.")
    }
    if (imageCountByTag(images, "flat_lay") === 0) {
      pushIssue(issues, "images.flat_lay", "Flat-lay image is required before publishing.")
    }
    if (imageCountByTag(images, "proof_fabric") === 0) {
      pushIssue(issues, "images.proof_fabric", "Fabric proof image is required before publishing.")
    }
    if (imageCountByTag(images, "proof_print") === 0) {
      pushIssue(issues, "images.proof_print", "Print proof image is required before publishing.")
    }
    if (payload.artistRightsApproved !== true) {
      pushIssue(issues, "artistRightsApproved", "Artist rights must be approved before publishing.")
    }
    if (payload.artistCreditApproved !== true) {
      pushIssue(issues, "artistCreditApproved", "Artist credit must be approved before publishing.")
    }
    if (payload.samplePrintApproved !== true) {
      pushIssue(issues, "samplePrintApproved", "Sample print must be approved before publishing.")
    }
    if (payload.productPhotosApproved !== true) {
      pushIssue(issues, "productPhotosApproved", "Product photos must be approved before publishing.")
    }
    if (!payload.buyerRoute) {
      pushIssue(issues, "buyerRoute", "Buyer route is required before publishing.")
    }
    if (!payload.primaryAudience) {
      pushIssue(issues, "primaryAudience", "Primary audience is required before publishing.")
    }
    if (payload.giftable === true && !(payload.giftOccasionTags ?? []).length) {
      pushIssue(issues, "giftOccasionTags", "Giftable products need at least one gift occasion tag.")
    }
    if (payload.giftable === true && !payload.giftTrustCopy?.trim()) {
      pushIssue(issues, "giftTrustCopy", "Giftable products must have gift trust copy before publishing.")
    }
    if (
      payload.giftable === true &&
      payload.buyerRoute &&
      payload.buyerRoute !== "gift" &&
      payload.firstWedgeEligible !== true
    ) {
      pushIssue(
        issues,
        "giftable",
        "Giftable products must use buyer route 'gift' or be first-wedge eligible."
      )
    }
  }

  if (payload.firstWedgeEligible === true && payload.buyerRoute && !FIRST_WEDGE_BUYER_ROUTES.has(payload.buyerRoute)) {
    pushIssue(issues, "firstWedgeEligible", "First-wedge products must use buyer route feeling, moment, or gift.")
  }

  validateIsoDate(issues, "launchAt", payload.launchAt)
  validateIsoDate(issues, "sunsetAt", payload.sunsetAt)
  validateIsoDate(issues, "conceptApprovedAt", payload.conceptApprovedAt)
  validateIsoDate(issues, "sketchApprovedAt", payload.sketchApprovedAt)
  validateIsoDate(issues, "mockupApprovedAt", payload.mockupApprovedAt)
  validateIsoDate(issues, "printReadyApprovedAt", payload.printReadyApprovedAt)
  validateIsoDate(issues, "samplePrintApprovedAt", payload.samplePrintApprovedAt)

  return issues
}

export function assertValidDropPayload(payload: UpsertDropPayload): void {
  const issues = validateDropPayload(payload)
  if (issues.length) {
    throw new DropValidationError(issues)
  }
}
