import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import { assertOpsBackendAccess } from "../../../../../../lib/horo-ops-backend-auth"
import { executeHoroOpsOrderAction, type HoroOpsOrderActionKind } from "../../../../../../lib/horo-ops-order-actions"

type RequestWithAuthContext = MedusaRequest & {
  auth_context?: {
    actor_id?: string
    actor_type?: string
  }
}

function normalizeEnvSecret(raw: string | undefined): string {
  if (typeof raw !== "string") return ""
  return raw.replace(/^\ufeff/, "").replace(/\r$/, "").trim()
}

function resolveHoroOpsActorUserId(req: MedusaRequest): string {
  const fromEnv = normalizeEnvSecret(process.env.HORO_OPS_ACTOR_USER_ID)
  if (fromEnv.length > 0) return fromEnv
  const actor = (req as RequestWithAuthContext).auth_context?.actor_id
  if (typeof actor === "string" && actor.trim().length > 0) return actor.trim()
  return "horo_ops_ui"
}

const ACTIONS = new Set<HoroOpsOrderActionKind>([
  "capture_payment",
  "create_fulfillment",
  "mark_fulfillment_delivered",
])

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>
  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : ""
  const actionRaw = typeof body.action === "string" ? body.action.trim() : ""
  const fulfillmentId =
    typeof body.fulfillment_id === "string" && body.fulfillment_id.trim().length > 0 ? body.fulfillment_id.trim() : null

  if (!orderId) {
    res.status(400).json({ message: "order_id is required" })
    return
  }
  if (!actionRaw || !ACTIONS.has(actionRaw as HoroOpsOrderActionKind)) {
    res.status(400).json({
      message: `action must be one of: ${[...ACTIONS].join(", ")}`,
    })
    return
  }

  const action = actionRaw as HoroOpsOrderActionKind

  try {
    const { order } = await executeHoroOpsOrderAction({
      scope: req.scope,
      orderId,
      action,
      fulfillmentId,
      actorUserId: resolveHoroOpsActorUserId(req),
    })
    res.status(200).json({ ok: true, order })
  } catch (e) {
    if (e instanceof MedusaError) {
      res.status(400).json({ message: e.message, type: e.type })
      return
    }
    res.status(500).json({ message: e instanceof Error ? e.message : "Action failed" })
  }
}
