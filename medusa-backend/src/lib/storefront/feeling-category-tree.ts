import { FEELINGS_ROOT_HANDLE } from "./feeling-category-metadata"

export type CategoryNode = {
  description?: string | null
  handle?: string | null
  id?: string
  is_active?: boolean | null
  metadata?: Record<string, unknown> | null
  name?: string | null
  parent_category?: CategoryNode | null
  rank?: number | null
}

/** Handles from tree root to leaf (e.g. `feelings`, `mood`, `i-care`). */
export function categoryAncestorHandlesFromLeaf(category: CategoryNode | null | undefined): string[] {
  const handles: string[] = []
  let current: CategoryNode | null | undefined = category

  while (current?.handle) {
    handles.unshift(current.handle)
    current = current.parent_category
  }

  return handles
}

export function indexOfFeelingsRoot(chain: string[], feelingsRoot: string = FEELINGS_ROOT_HANDLE): number {
  return chain.indexOf(feelingsRoot)
}

/** Path segments under the feelings root (excluding the root handle). */
export function feelingBranchSegments(
  chain: string[],
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): string[] {
  const idx = indexOfFeelingsRoot(chain, feelingsRoot)
  if (idx === -1) {
    return []
  }

  return chain.slice(idx + 1)
}

export function categoryIsDescendantOfFeelings(
  category: CategoryNode | null | undefined,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): boolean {
  const chain = categoryAncestorHandlesFromLeaf(category)
  return chain.includes(feelingsRoot)
}

/**
 * Assigned product categories that sit in the feelings subtree (any node at or below `feelings`,
 * excluding the root itself when it appears as a linked category).
 */
export function collectFeelingSubtreeAssignments(
  categories: CategoryNode[] | null | undefined,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): CategoryNode[] {
  const list = categories || []
  const matches: CategoryNode[] = []

  for (const category of list) {
    const chain = categoryAncestorHandlesFromLeaf(category)
    const idx = indexOfFeelingsRoot(chain, feelingsRoot)
    if (idx === -1) {
      continue
    }

    const leafHandle = chain[chain.length - 1]
    if (leafHandle === feelingsRoot) {
      continue
    }

    matches.push(category)
  }

  return matches
}

export type DerivedFeelingSlugs = {
  primaryFeelingSlug: string
  primarySubfeelingSlug: string
}

/**
 * Pick the deepest assigned category under the feelings root, then derive parent feeling + optional leaf slug.
 */
export function derivePrimaryFeelingSlugsFromProductCategories(
  categories: CategoryNode[] | null | undefined,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): DerivedFeelingSlugs | null {
  const candidates = collectFeelingSubtreeAssignments(categories, feelingsRoot)
  if (candidates.length === 0) {
    return null
  }

  const scored = candidates.map((category) => {
    const chain = categoryAncestorHandlesFromLeaf(category)
    const segments = feelingBranchSegments(chain, feelingsRoot)
    return { category, depth: segments.length, segments }
  })

  scored.sort((left, right) => right.depth - left.depth)
  const best = scored[0]
  if (!best || best.segments.length === 0) {
    return null
  }

  const primaryFeelingSlug = best.segments[0]
  const primarySubfeelingSlug =
    best.segments.length >= 2 ? best.segments[best.segments.length - 1]! : ""

  return { primaryFeelingSlug, primarySubfeelingSlug }
}

export type FeelingTaxonomyValidation = {
  errors: string[]
  feelingBranchCount: number
}

export function validateProductFeelingCategoryAssignments(
  categories: CategoryNode[] | null | undefined,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): FeelingTaxonomyValidation {
  const errors: string[] = []
  const assignments = collectFeelingSubtreeAssignments(categories, feelingsRoot)
  const feelingBranchCount = assignments.length

  if (feelingBranchCount === 0) {
    errors.push("missing_feeling_branch")
  } else if (feelingBranchCount > 1) {
    errors.push("multiple_feeling_branches")
  }

  return { errors, feelingBranchCount }
}

export type FlatCategoryRow = {
  handle: string
  id: string
  parent_category_id?: string | null
}

/** Build root→leaf handle chain by walking `parent_category_id` (same result as nested `parent_category` when graph is complete). */
export function ancestorHandlesFromCategoryId(
  leafId: string,
  byId: Map<string, FlatCategoryRow>
): string[] {
  const handles: string[] = []
  let cur: FlatCategoryRow | undefined = byId.get(leafId)
  let guard = 0
  while (cur?.handle && guard++ < 64) {
    handles.unshift(cur.handle)
    cur = cur.parent_category_id ? byId.get(cur.parent_category_id) : undefined
  }
  return handles
}

/**
 * Same rules as {@link validateProductFeelingCategoryAssignments} but resolves ancestry from a flat
 * category map (reliable when Query API omits nested `parent_category` on product categories).
 */
export function validateProductFeelingCategoryAssignmentsFlat(
  categoryIds: string[],
  byId: Map<string, FlatCategoryRow>,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): FeelingTaxonomyValidation {
  const assignments: string[] = []

  for (const id of categoryIds) {
    const chain = ancestorHandlesFromCategoryId(id, byId)
    const idx = chain.indexOf(feelingsRoot)
    if (idx === -1) {
      continue
    }

    const leafHandle = chain[chain.length - 1]
    if (leafHandle === feelingsRoot) {
      continue
    }

    assignments.push(id)
  }

  const errors: string[] = []
  const feelingBranchCount = assignments.length

  if (feelingBranchCount === 0) {
    errors.push("missing_feeling_branch")
  } else if (feelingBranchCount > 1) {
    errors.push("multiple_feeling_branches")
  }

  return { errors, feelingBranchCount }
}

/** Raw handle pair from category graph (before storefront legacy slug normalization). */
export type FeelingBrowseAssignmentRaw = {
  feelingSlug: string
  /** Empty when the product is linked only to a pillar category (e.g. `mood` under `feelings`). */
  subfeelingSlug: string
}

/**
 * Every distinct (pillar, leaf) pair implied by product category ids under `feelings`.
 * Used so browse/search can match Medusa placements even when {@link derivePrimaryFeelingSlugsFromFlat} picks another branch.
 */
export function collectFeelingBrowseAssignmentsFromFlatCategoryIds(
  categoryIds: string[] | null | undefined,
  byId: Map<string, FlatCategoryRow>,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): FeelingBrowseAssignmentRaw[] {
  const seen = new Set<string>()
  const out: FeelingBrowseAssignmentRaw[] = []

  for (const id of categoryIds || []) {
    const chain = ancestorHandlesFromCategoryId(id, byId)
    const idx = chain.indexOf(feelingsRoot)
    if (idx === -1) {
      continue
    }

    const leafHandle = chain[chain.length - 1]
    if (leafHandle === feelingsRoot) {
      continue
    }

    const segments = feelingBranchSegments(chain, feelingsRoot)
    if (segments.length === 0) {
      continue
    }

    const feelingSlug = segments[0]!
    const subfeelingSlug = segments.length >= 2 ? segments[segments.length - 1]! : ""
    const key = `${feelingSlug}\0${subfeelingSlug}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    out.push({ feelingSlug, subfeelingSlug })
  }

  return out
}

/** Same as {@link collectFeelingBrowseAssignmentsFromFlatCategoryIds} using nested `parent_category` chains from the Query API. */
export function collectFeelingBrowseAssignmentsFromNestedCategories(
  categories: CategoryNode[] | null | undefined,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): FeelingBrowseAssignmentRaw[] {
  const matches = collectFeelingSubtreeAssignments(categories, feelingsRoot)
  const seen = new Set<string>()
  const out: FeelingBrowseAssignmentRaw[] = []

  for (const category of matches) {
    const chain = categoryAncestorHandlesFromLeaf(category)
    const segments = feelingBranchSegments(chain, feelingsRoot)
    if (segments.length === 0) {
      continue
    }

    const feelingSlug = segments[0]!
    const subfeelingSlug = segments.length >= 2 ? segments[segments.length - 1]! : ""
    const key = `${feelingSlug}\0${subfeelingSlug}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    out.push({ feelingSlug, subfeelingSlug })
  }

  return out
}

export function derivePrimaryFeelingSlugsFromFlat(
  categoryIds: string[] | null | undefined,
  byId: Map<string, FlatCategoryRow>,
  feelingsRoot: string = FEELINGS_ROOT_HANDLE
): DerivedFeelingSlugs | null {
  const ids = categoryIds || []
  if (ids.length === 0) {
    return null
  }

  const scored: { id: string; depth: number; segments: string[] }[] = []
  for (const id of ids) {
    const chain = ancestorHandlesFromCategoryId(id, byId)
    const segments = feelingBranchSegments(chain, feelingsRoot)
    if (segments.length > 0) {
      scored.push({ id, depth: segments.length, segments })
    }
  }

  if (scored.length === 0) {
    return null
  }

  scored.sort((left, right) => right.depth - left.depth || left.id.localeCompare(right.id))
  const best = scored[0]
  if (!best || best.segments.length === 0) {
    return null
  }

  const primaryFeelingSlug = best.segments[0]
  const primarySubfeelingSlug =
    best.segments.length >= 2 ? best.segments[best.segments.length - 1]! : ""

  return { primaryFeelingSlug, primarySubfeelingSlug }
}
