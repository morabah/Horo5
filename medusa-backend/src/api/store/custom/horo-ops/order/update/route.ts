import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { updateOrderWorkflow } from "@medusajs/medusa/core-flows"

import { assertOpsBackendAccess } from "../../../../../../lib/horo-ops-backend-auth"
import { ORDER_OPS_GRAPH_FIELDS } from "../../../../../../lib/horo-ops-order-query-fields"

/** Native Medusa `order.status` enum (Postgres `order_status_enum`). */
const MEDUSA_ORDER_STATUSES = new Set([
  "pending",
  "completed",
  "draft",
  "archived",
  "canceled",
  "requires_action",
])

/** Ops-only handling flag stored under `order.metadata.horo_ops_handling` (storefront can read it). */
const HORO_OPS_HANDLING_VALUES = new Set(["pending", "received", "collected"])

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

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return { ...(v as Record<string, unknown>) }
  return {}
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertOpsBackendAccess(req, res)) return

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>
  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : ""

  const hasStatus = Object.prototype.hasOwnProperty.call(body, "status")
  const hasHandling = Object.prototype.hasOwnProperty.call(body, "horo_ops_handling")

  const statusRaw = body.status
  const status = typeof statusRaw === "string" ? statusRaw.trim() : null

  if (!orderId) {
    res.status(400).json({ message: "order_id is required" })
    return
  }
  if (!hasStatus && !hasHandling) {
    res.status(400).json({ message: "Provide status and/or horo_ops_handling" })
    return
  }
  if (hasStatus) {
    if (!status || !MEDUSA_ORDER_STATUSES.has(status)) {
      res.status(400).json({
        message: `Invalid status. Allowed: ${[...MEDUSA_ORDER_STATUSES].join(", ")}`,
      })
      return
    }
  }

  let handling: string | null | undefined
  if (hasHandling) {
    const h = body.horo_ops_handling
    if (h === null || h === "") {
      handling = null
    } else if (typeof h === "string") {
      const t = h.trim()
      if (!HORO_OPS_HANDLING_VALUES.has(t)) {
        res.status(400).json({
          message: `Invalid horo_ops_handling. Allowed: ${[...HORO_OPS_HANDLING_VALUES].join(", ")} or null to clear`,
        })
        return
      }
      handling = t
    } else {
      res.status(400).json({ message: "horo_ops_handling must be a string or null" })
      return
    }
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "metadata", "status"],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const existing = (data || [])[0] as Record<string, unknown> | undefined
    if (!existing) {
      res.status(404).json({ message: "Order not found" })
      return
    }

    const mergedMeta = asRecord(existing.metadata)
    if (hasHandling) {
      if (handling === null || handling === "") {
        delete mergedMeta.horo_ops_handling
      } else if (typeof handling === "string") {
        mergedMeta.horo_ops_handling = handling
      }
    }

    const userId = resolveHoroOpsActorUserId(req)

    const input: Record<string, unknown> = {
      id: orderId,
      user_id: userId,
    }
    if (hasHandling) {
      input.metadata = mergedMeta
    }
    if (hasStatus && status) {
      input.status = status
    }

    await updateOrderWorkflow(req.scope).run({
      input: input as never,
    })

    const { data: outRows } = await query.graph({
      entity: "order",
      fields: [...ORDER_OPS_GRAPH_FIELDS],
      filters: { id: orderId },
      pagination: { take: 1 },
    })
    const order = (outRows || [])[0] as Record<string, unknown> | undefined

    res.status(200).json({ ok: true, order: order ?? null })
  } catch (e) {
    if (e instanceof MedusaError) {
      res.status(400).json({ message: e.message, type: e.type })
      return
    }
    res.status(500).json({ message: e instanceof Error ? e.message : "Update failed" })
  }
}
