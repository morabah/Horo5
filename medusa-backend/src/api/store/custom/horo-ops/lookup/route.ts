import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { parseAdminOrderLookupQuery } from "../../../../../lib/admin-order-lookup"
import { assertOpsBackendAccess } from "../../../../../lib/horo-ops-backend-auth"

function friendlyFromDisplayId(display_id: unknown): string | null {
  if (typeof display_id === "number" && display_id > 0) return `HORO-${Math.floor(display_id)}`
  if (typeof display_id === "string") {
    const n = parseInt(display_id.trim(), 10)
    if (Number.isFinite(n) && n > 0) return `HORO-${n}`
  }
  return null
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return

  const rawQ = req.query.q
  const q =
    typeof rawQ === "string" ? rawQ : Array.isArray(rawQ) ? String(rawQ[0] ?? "") : ""

  const intent = parseAdminOrderLookupQuery(q)
  if (intent.kind === "invalid") {
    res.status(400).json({ message: "Invalid q", reason: intent.reason })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const fields = [
    "id",
    "display_id",
    "email",
    "created_at",
    "updated_at",
    "status",
    "currency_code",
    "total",
    "metadata",
    "fulfillment_status",
    "payment_status",
    "subtotal",
    "tax_total",
    "shipping_total",
    "discount_total",
    "items.*",
    "items.item.*",
    "items.detail.*",
    "summary.*",
    "shipping_address.*",
    "billing_address.*",
    "shipping_methods.*",
    "shipping_methods.shipping_method.*",
  ] as const

  try {
    const filters =
      intent.kind === "id"
        ? { id: intent.id }
        : { display_id: String(intent.value) }

    const { data: rows } = await query.graph({
      entity: "order",
      fields: [...fields],
      filters,
      pagination: { take: 5 },
    })

    const matches = ((rows || []) as Record<string, unknown>[]).filter((r) => String(r.id ?? "").length > 0)

    const friendly =
      intent.kind === "display_id"
        ? `HORO-${intent.value}`
        : matches[0]
          ? friendlyFromDisplayId(matches[0].display_id)
          : null

    res.status(200).json({ matches, friendly })
  } catch (e) {
    res.status(500).json({
      message: e instanceof Error ? e.message : "Lookup failed",
    })
  }
}
