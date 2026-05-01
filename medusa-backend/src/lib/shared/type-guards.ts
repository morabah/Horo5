/**
 * Shared type-guard utilities used across Medusa backend scripts, services,
 * API routes, and storefront helpers.  Extracted to eliminate the ~10 copy-paste
 * clones of `asRecord`, `asString`, and `asStringArray` scattered through the
 * codebase.
 */

/** Coerce an unknown value into a plain object record (excluding arrays). */
export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Coerce an unknown value into a plain object record or return `null`. */
export function asRecordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

/** Return a non-empty trimmed string, or `undefined`. */
export function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined
}

/** Return a trimmed string (empty string on failure). */
export function asStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/** Return an array of non-empty strings, or `undefined` if not an array. */
export function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const items = value.filter(
    (entry): entry is string =>
      typeof entry === "string" && entry.trim().length > 0,
  )
  return items.length > 0 ? items : undefined
}

/** Return an array of non-empty strings (empty array on failure). */
export function asStringArrayOrEmpty(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((entry) => String(entry || "").trim())
    .filter(Boolean)
}

/** Return a finite number, or `undefined`. */
export function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

/** Parse an integer from a number or string, or return `null`. */
export function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed)
    }
  }
  return null
}
