import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WAITLIST_MODULE } from "../../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../../modules/waitlist/service"
import { sendWaitlistLaunchResend } from "../../../../../lib/waitlist-email"

const RESEND_API_KEY = process.env.RESEND_API_KEY || ""
const RESEND_FROM = process.env.RESEND_FROM || ""
const STORE_URL = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_SITE_URL || ""

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!RESEND_API_KEY || !RESEND_FROM) {
    res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY or RESEND_FROM env." })
    return
  }

  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const [rows] = await service.listAndCountWaitlists(
    {
      unsubscribed_at: null,
      notified_at: null,
    },
    { take: 5000 }
  )

  const results: { email: string; ok: boolean; error?: string }[] = []
  let sent = 0
  let failed = 0

  for (const entry of rows) {
    const locale = (entry.locale === "ar" ? "ar" : "en") as "en" | "ar"
    const result = await sendWaitlistLaunchResend({
      apiKey: RESEND_API_KEY,
      from: RESEND_FROM,
      to: entry.email,
      locale,
      storeUrl: STORE_URL || null,
      referralCode: entry.referral_code || null,
      couponCode: entry.coupon_code || null,
    })

    results.push({ email: entry.email, ok: result.ok, error: result.error })

    if (result.ok) {
      sent++
      await service.updateWaitlists(
        { id: entry.id },
        { notified_at: new Date() }
      )
    } else {
      failed++
    }
  }

  res.status(200).json({
    ok: true,
    total: rows.length,
    sent,
    failed,
    results,
  })
}
