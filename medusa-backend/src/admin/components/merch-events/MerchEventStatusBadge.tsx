import { Badge } from "@medusajs/ui"

import type { MerchEventStatus } from "../../../lib/merch-events/types"

type MerchEventStatusBadgeProps = {
  status: MerchEventStatus
}

function statusColor(status: MerchEventStatus) {
  if (status === "active") return "green"
  if (status === "scheduled") return "blue"
  if (status === "archived") return "orange"
  return "grey"
}

export function MerchEventStatusBadge({ status }: MerchEventStatusBadgeProps) {
  return (
    <Badge size="small" color={statusColor(status)}>
      {status}
    </Badge>
  )
}
