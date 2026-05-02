import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

type PromotionCodeRow = {
  id: string
  code?: string
  type?: "standard" | "buyget"
  status?: "draft" | "active" | "inactive"
  is_automatic?: boolean
  limit?: number | null
  used?: number
  application_method?: {
    type?: "fixed" | "percentage"
    target_type?: "order" | "shipping_methods" | "items"
    value?: number
    currency_code?: string
    allocation?: string
    buy_rules_min_quantity?: number | null
    apply_to_quantity?: number | null
  } | null
  campaign?: {
    starts_at?: string | Date | null
    ends_at?: string | Date | null
  } | null
}

function toIso(value: string | Date | null | undefined): string | null {
  if (!value) return null
  const ms = Date.parse(String(value))
  if (!Number.isFinite(ms)) return null
  return new Date(ms).toISOString()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const promotionModule = req.scope.resolve(Modules.PROMOTION) as {
      listPromotions: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<PromotionCodeRow[]>
    }
    const promotions = await promotionModule.listPromotions(
      { is_automatic: false },
      {
        take: 100,
        relations: ["application_method", "campaign"],
      },
    )
    res.status(200).json({
      promotions: promotions.map((promotion) => ({
        id: promotion.id,
        code: promotion.code ?? "",
        type: promotion.type ?? "standard",
        application_method: promotion.application_method ?? null,
        status: promotion.status ?? "draft",
        starts_at: toIso(promotion.campaign?.starts_at),
        ends_at: toIso(promotion.campaign?.ends_at),
        usage_count: promotion.used ?? 0,
        usage_limit: promotion.limit ?? null,
      })),
    })
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : String(error) })
  }
}
