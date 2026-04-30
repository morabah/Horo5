import { Badge } from "@medusajs/ui"

import type { HomepageSectionType } from "../../../lib/homepage-sections/types"

type SectionTypeBadgeProps = {
  type: HomepageSectionType
}

function color(type: HomepageSectionType) {
  if (type === "hero") return "blue"
  if (type === "feeling_grid" || type === "occasion_grid") return "purple"
  if (type === "gift_block") return "orange"
  if (type === "founding_drop" || type === "featured_piece" || type === "first_drop_circle") return "green"
  return "grey"
}

export function SectionTypeBadge({ type }: SectionTypeBadgeProps) {
  return (
    <Badge size="small" color={color(type)}>
      {type.replace(/_/g, " ")}
    </Badge>
  )
}
