import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WAITLIST_MODULE } from "../../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../../modules/waitlist/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200)
  const minCount = Math.max(parseInt(req.query.min_count as string) || 1, 0)

  const [rows, count] = await service.listAndCountWaitlists(
    {
      referral_count: { $gte: minCount },
      unsubscribed_at: null,
    },
    {
      take: limit,
      order: { referral_count: "DESC" },
    }
  )

  const tiers = [
    { threshold: 1, label: "Early Access" },
    { threshold: 3, label: "Launch Discount" },
    { threshold: 5, label: "Founding Circle" },
  ]

  const enriched = rows.map((r) => {
    const c = r.referral_count ?? 0
    return {
      id: r.id,
      email: r.email,
      referral_code: r.referral_code,
      referral_count: c,
      locale: r.locale,
      created_at: r.created_at,
      tier: tiers.filter((t) => t.threshold <= c).map((t) => t.label),
      next_tier: tiers.find((t) => t.threshold > c) || null,
    }
  })

  res.status(200).json({
    referrals: enriched,
    count,
  })
}
