import type { DropImageTag, DropPayload, ProductSizeKey, ValidationIssue } from "./types"

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
    sizes: ["S", "M", "L", "XL", "XXL"],
    stockPerSize: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
    decorationType: "graphic",
    trustBadges: ["premium cotton", "Free exchange 14d", "COD available"],
    images: [],
    capsuleSlugs: [],
    complementarySlugs: [],
    frequentlyBoughtWithSlugs: [],
    customersAlsoBoughtSlugs: [],
  }
}

export function validationIssues(drop: DropPayload, targetStatus = drop.status): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const publishing = targetStatus === "published"
  if (!drop.title.trim()) issues.push({ field: "title", message: "Title is required." })
  if (!drop.handle.trim()) issues.push({ field: "handle", message: "Handle is required." })
  if (publishing && !drop.story?.trim()) issues.push({ field: "story", message: "Story is required." })
  if (publishing && !drop.feeling) issues.push({ field: "feeling", message: "Feeling is required." })
  if (publishing && !drop.subfeeling) issues.push({ field: "subfeeling", message: "Subfeeling is required." })
  if (publishing && (!drop.priceEgp || drop.priceEgp <= 0)) {
    issues.push({ field: "priceEgp", message: "Price is required." })
  }
  if (publishing && !drop.images?.some((image) => image.tag === "main")) {
    issues.push({ field: "images", message: "Tag one image as main." })
  }
  if ((drop.images ?? []).filter((image) => image.tag === "main").length > 1) {
    issues.push({ field: "images", message: "Only one image can be main." })
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
  const order: ProductSizeKey[] = ["S", "M", "L", "XL", "XXL"]
  return order.filter((size) => sizes.includes(size))
}
