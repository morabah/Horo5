import { Badge } from "@medusajs/ui"

import type { ReviewStatus } from "../../../lib/reviews/types"

type ReviewStatusBadgeProps = {
  status: ReviewStatus
}

function color(status: ReviewStatus) {
  if (status === "approved") return "green"
  if (status === "pending") return "orange"
  return "red"
}

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <Badge size="small" color={color(status)}>
      {status}
    </Badge>
  )
}
