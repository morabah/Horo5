import type { MedusaResponse } from "@medusajs/framework/http"

/**
 * Slug is immutable after creation. If PATCH payload includes a different slug, respond 422.
 * Always removes `slug` from `data` before persistence.
 * @returns false if response was already sent (422).
 */
export function applySlugImmutabilityToPatchData(
  res: MedusaResponse,
  data: Record<string, unknown>,
  existingSlug: string
): boolean {
  if (Object.prototype.hasOwnProperty.call(data, "slug")) {
    const next = data.slug

    if (typeof next === "string" && next.trim() !== "" && next.trim() !== existingSlug) {
      res.status(422).json({
        message:
          "Slug cannot be changed after creation. Create a new entity and migrate products if a rename is required.",
      })
      return false
    }
  }

  delete data.slug
  return true
}
