import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { OBJECTION_LOG_MODULE } from "../../../../modules/objection-log"
import type ObjectionLogModuleService from "../../../../modules/objection-log/service"
import { assertTaxonomyAdminWrite } from "../taxonomy-auth"

const VALID_SOURCES = ["pdp", "cart", "checkout", "post_purchase", "buyer_interview"] as const
const VALID_CATEGORIES = ["price", "size", "trust", "delivery", "gift_fit", "other"] as const
const VALID_PRIORITIES = ["low", "medium", "high"] as const

function sanitizeCreateInput(body: unknown): {
  source: string
  objection: string
  category: string
  product_slug?: string
  order_id?: string
  buyer_segment?: string
  priority: string
} | null {
  if (!body || typeof body !== "object") return null
  const b = body as Record<string, unknown>

  const source = typeof b.source === "string" ? b.source.trim().toLowerCase() : ""
  const objection = typeof b.objection === "string" ? b.objection.trim() : ""
  const category = typeof b.category === "string" ? b.category.trim().toLowerCase() : ""
  const priority = typeof b.priority === "string" ? b.priority.trim().toLowerCase() : "medium"

  if (!source || !VALID_SOURCES.includes(source as any)) return null
  if (!objection || objection.length < 2) return null
  if (!category || !VALID_CATEGORIES.includes(category as any)) return null
  if (!priority || !VALID_PRIORITIES.includes(priority as any)) return null

  return {
    source,
    objection,
    category,
    product_slug: typeof b.product_slug === "string" ? b.product_slug.trim() || undefined : undefined,
    order_id: typeof b.order_id === "string" ? b.order_id.trim() || undefined : undefined,
    buyer_segment: typeof b.buyer_segment === "string" ? b.buyer_segment.trim() || undefined : undefined,
    priority,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<ObjectionLogModuleService>(OBJECTION_LOG_MODULE)

  const skip = parseInt(req.query.skip as string) || 0
  const take = Math.min(200, parseInt(req.query.take as string) || 50)
  const resolved = req.query.resolved
  const category = typeof req.query.category === "string" ? req.query.category : undefined
  const source = typeof req.query.source === "string" ? req.query.source : undefined

  const filters: Record<string, unknown> = {}
  if (resolved === "true") filters.resolved = true
  if (resolved === "false") filters.resolved = false
  if (category) filters.category = category
  if (source) filters.source = source

  const [rows, count] = await service.listAndCountObjectionLogs(filters, { skip, take })

  res.status(200).json({
    objections: rows,
    total: count,
    skip,
    take,
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!assertTaxonomyAdminWrite(req, res)) {
    return
  }

  const input = sanitizeCreateInput(req.body)
  if (!input) {
    res.status(400).json({ message: "Invalid input. Required: source, objection, category." })
    return
  }

  const service = req.scope.resolve<ObjectionLogModuleService>(OBJECTION_LOG_MODULE)

  const created = await service.createObjectionLogs({
    source: input.source as any,
    objection: input.objection,
    category: input.category as any,
    product_slug: input.product_slug,
    order_id: input.order_id,
    buyer_segment: input.buyer_segment,
    priority: input.priority as any,
  })

  res.status(201).json({ objection: created })
}
