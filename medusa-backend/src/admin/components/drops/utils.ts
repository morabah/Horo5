import {
  DEFAULT_DROP_TRUST_BADGES,
  DROP_SIZE_KEYS,
  type DropArtistPaymentModel,
  type DropBuyerRoute,
  type DropImageTag,
  type DropPayload,
  type DropPrimaryAudience,
  type ProductSizeKey,
  type ValidationIssue,
} from "./types"

const tagPrefixes: Array<{ prefix: string; tag: DropImageTag }> = [
  { prefix: "main", tag: "main" },
  { prefix: "hero", tag: "main" },
  { prefix: "cover", tag: "main" },
  { prefix: "lifestyle", tag: "lifestyle" },
  { prefix: "flat_lay", tag: "flat_lay" },
  { prefix: "flat-lay", tag: "flat_lay" },
  { prefix: "proof_fabric", tag: "proof_fabric" },
  { prefix: "proof-fabric", tag: "proof_fabric" },
  { prefix: "proof_print", tag: "proof_print" },
  { prefix: "proof-print", tag: "proof_print" },
  { prefix: "proof_wash", tag: "proof_wash" },
  { prefix: "proof-wash", tag: "proof_wash" },
]

const artistPaymentModels: DropArtistPaymentModel[] = ["flat_fee", "royalty", "revenue_share", "hybrid", "unknown"]
const buyerRoutes: DropBuyerRoute[] = ["feeling", "moment", "gift", "personality", "artist_drop", "world"]
const primaryAudiences: DropPrimaryAudience[] = ["25-40", "18-24", "gift-buyer", "artist-aware", "40-plus"]
const firstWedgeBuyerRoutes = new Set<DropBuyerRoute>(["feeling", "moment", "gift"])

export function slugifyDropTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export function tagForFilename(filename: string): DropImageTag | undefined {
  const name = filename.split("/").pop()?.split(".").slice(0, -1).join(".").toLowerCase() || filename.toLowerCase()
  for (const { prefix, tag } of tagPrefixes) {
    if (name === prefix || name.startsWith(`${prefix}-`) || name.startsWith(`${prefix}_`)) {
      return tag
    }
  }
  return undefined
}

export function emptyDrop(): DropPayload {
  return {
    handle: "",
    title: "",
    status: "draft",
    story: "",
    description: "",
    occasions: [],
    sizes: [...DROP_SIZE_KEYS],
    stockPerSize: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    decorationType: "graphic",
    trustBadges: [...DEFAULT_DROP_TRUST_BADGES],
    artistPaymentModel: "unknown",
    firstWedgeEligible: false,
    giftable: false,
    giftOccasionTags: [],
    images: [],
    capsuleSlugs: [],
    complementarySlugs: [],
    frequentlyBoughtWithSlugs: [],
    customersAlsoBoughtSlugs: [],
  }
}

function hasImageTag(drop: DropPayload, tag: DropImageTag) {
  return (drop.images ?? []).some((image) => image.tag === tag && image.url?.trim())
}

function hasPositiveStock(drop: DropPayload) {
  const selectedSizes = orderedSizes(drop.sizes ?? [])
  if (!selectedSizes.length) return false
  return selectedSizes.some((size) => {
    const qty = drop.stockPerSize?.[size]
    return typeof qty === "number" && Number.isInteger(qty) && qty > 0
  })
}

export function validationIssues(drop: DropPayload, targetStatus = drop.status): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const publishing = targetStatus === "published"
  if (!drop.title.trim()) issues.push({ field: "title", message: "Title is required." })
  if (!drop.handle.trim()) issues.push({ field: "handle", message: "Handle is required." })
  if (publishing && !drop.story?.trim()) issues.push({ field: "story", message: "Story is required." })
  if (publishing && !drop.feeling) issues.push({ field: "feeling", message: "Feeling is required." })
  if (publishing && !drop.subfeeling) issues.push({ field: "subfeeling", message: "Subfeeling is required." })
  if (publishing && !drop.artist?.trim()) issues.push({ field: "artist", message: "Artist is required before publishing." })
  if (publishing && (!drop.priceEgp || drop.priceEgp <= 0)) {
    issues.push({ field: "priceEgp", message: "Price is required." })
  }
  if (publishing && !drop.sizeTableKey?.trim()) {
    issues.push({ field: "sizeTableKey", message: "Size table is required before publishing." })
  }
  if (publishing && !drop.fitLabel?.trim()) {
    issues.push({ field: "fitLabel", message: "Fit label is required before publishing." })
  }
  if (publishing && !hasPositiveStock(drop)) {
    issues.push({ field: "stockPerSize", message: "Stock per size is required before publishing." })
  }
  if (publishing && !drop.images?.some((image) => image.tag === "main")) {
    issues.push({ field: "images", message: "Tag one image as main." })
  }
  if (publishing && !hasImageTag(drop, "lifestyle")) {
    issues.push({ field: "images.lifestyle", message: "Lifestyle/on-body image is required before publishing." })
  }
  if (publishing && !hasImageTag(drop, "flat_lay")) {
    issues.push({ field: "images.flat_lay", message: "Flat-lay image is required before publishing." })
  }
  if (publishing && !hasImageTag(drop, "proof_fabric")) {
    issues.push({ field: "images.proof_fabric", message: "Fabric proof image is required before publishing." })
  }
  if (publishing && !hasImageTag(drop, "proof_print")) {
    issues.push({ field: "images.proof_print", message: "Print proof image is required before publishing." })
  }
  if ((drop.images ?? []).filter((image) => image.tag === "main").length > 1) {
    issues.push({ field: "images", message: "Only one image can be main." })
  }
  if (drop.artistPaymentModel && !artistPaymentModels.includes(drop.artistPaymentModel)) {
    issues.push({ field: "artistPaymentModel", message: "Artist payment model is invalid." })
  }
  if (drop.buyerRoute && !buyerRoutes.includes(drop.buyerRoute)) {
    issues.push({ field: "buyerRoute", message: "Buyer route is invalid." })
  }
  if (drop.primaryAudience && !primaryAudiences.includes(drop.primaryAudience)) {
    issues.push({ field: "primaryAudience", message: "Primary audience is invalid." })
  }
  if (publishing && drop.artistRightsApproved !== true) {
    issues.push({ field: "artistRightsApproved", message: "Artist rights must be approved before publishing." })
  }
  if (publishing && drop.artistCreditApproved !== true) {
    issues.push({ field: "artistCreditApproved", message: "Artist credit must be approved before publishing." })
  }
  if (publishing && drop.samplePrintApproved !== true) {
    issues.push({ field: "samplePrintApproved", message: "Sample print must be approved before publishing." })
  }
  if (publishing && drop.productPhotosApproved !== true) {
    issues.push({ field: "productPhotosApproved", message: "Product photos must be approved before publishing." })
  }
  if (publishing && !drop.buyerRoute) {
    issues.push({ field: "buyerRoute", message: "Buyer route is required before publishing." })
  }
  if (publishing && !drop.primaryAudience) {
    issues.push({ field: "primaryAudience", message: "Primary audience is required before publishing." })
  }
  if (drop.giftable === true && !(drop.giftOccasionTags ?? []).length) {
    issues.push({ field: "giftOccasionTags", message: "Giftable products need at least one gift occasion tag." })
  }
  if (drop.firstWedgeEligible === true && drop.buyerRoute && !firstWedgeBuyerRoutes.has(drop.buyerRoute)) {
    issues.push({ field: "firstWedgeEligible", message: "First-wedge products must use buyer route feeling, moment, or gift." })
  }
  return issues
}

export function issueFor(issues: ValidationIssue[], field: string) {
  return issues.find((issue) => issue.field === field)?.message
}

export function formatDateTimeLocal(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 16)
}

export function parseDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : undefined
}

export function orderedSizes(sizes: ProductSizeKey[]) {
  const order: ProductSizeKey[] = [...DROP_SIZE_KEYS]
  return order.filter((size) => sizes.includes(size))
}
