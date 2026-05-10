import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WAITLIST_MODULE } from "../../../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../../../modules/waitlist/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = (req.params?.code as string | undefined) || ""

  if (!code) {
    res.status(400).json({ ok: false, error: "Referral code is required." })
    return
  }

  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const rows = await service.listWaitlists(
    { referral_code: code },
    { take: 1 }
  )

  const row = rows[0]

  if (!row) {
    res.status(404).json({ ok: false, error: "Referral code not found." })
    return
  }

  const count = row.referral_count ?? 0
  const tiers = [
    { threshold: 1, label: "Early Access" },
    { threshold: 3, label: "Launch Discount" },
    { threshold: 5, label: "Founding Circle" },
  ]

  const nextTier = tiers.find((t) => t.threshold > count) || null
  const unlockedTiers = tiers.filter((t) => t.threshold <= count)

  res.status(200).json({
    ok: true,
    referral_count: count,
    unlocked_tiers: unlockedTiers,
    next_tier: nextTier,
  })
}
