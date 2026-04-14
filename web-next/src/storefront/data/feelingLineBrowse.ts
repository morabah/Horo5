import type { FeelingBrowseAssignment } from "./catalog-types";
import { mapLegacyFeelingSlug } from "./legacy-slugs";

/**
 * Line pages (`/feelings/:pillar?line=:leaf`) must match Medusa leaf category links only,
 * not collapsed primary/legacy metadata (see feelingBrowseAssignments from catalog API).
 */
export function feelingLineMatchesAssignments(
  assignments: FeelingBrowseAssignment[] | undefined | null,
  feelingSlug: string,
  lineParam: string
): boolean {
  const resolved = mapLegacyFeelingSlug(feelingSlug);
  if (!assignments || assignments.length === 0) {
    return false;
  }
  return assignments.some(
    (a) => mapLegacyFeelingSlug(a.feelingSlug) === resolved && a.subfeelingSlug === lineParam
  );
}
