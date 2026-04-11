/** Admin + seed: canonical taxonomy slug (lowercase kebab, 2–40 chars). */
const TAXONOMY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateTaxonomySlug(slug: string): string | null {
  const s = slug.trim()
  if (s.length < 2 || s.length > 40) {
    return "Slug must be between 2 and 40 characters."
  }

  if (!TAXONOMY_SLUG_RE.test(s)) {
    return "Slug must be lowercase kebab-case (letters, digits, single hyphens)."
  }

  return null
}
