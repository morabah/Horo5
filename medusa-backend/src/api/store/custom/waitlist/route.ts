import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { WAITLIST_MODULE } from "../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../modules/waitlist/service"
import { retryWithBackoff } from "../../../../lib/retry-with-backoff"
import { sendWaitlistWelcomeResend } from "../../../../lib/waitlist-email"
import { generateReferralCode } from "../../../../lib/waitlist-referral"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, unknown>
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const locale = typeof body.locale === "string" ? body.locale.trim().toLowerCase() : "en"
  const source = typeof body.source === "string" ? body.source.trim() : "unknown"
  const referralCode = typeof body.referral_code === "string" ? body.referral_code.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    res.status(400).json({ ok: false, error: "A valid email is required." })
    return
  }

  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const existing = await service.listWaitlists(
    { email },
    { take: 1, withDeleted: true }
  )

  const row = existing[0]

  if (row) {
    if (row.unsubscribed_at) {
      await service.updateWaitlists({
        selector: { id: row.id },
        data: { unsubscribed_at: null },
      })
      res.status(200).json({ ok: true, duplicate: false, reactivated: true })
      return
    }
    res.status(200).json({ ok: true, duplicate: true })
    return
  }

  const newReferralCode = generateReferralCode(email)

  const created = await service.createWaitlists({
    email,
    locale: locale === "ar" ? "ar" : "en",
    source,
    referral_code: newReferralCode,
  })

  if (referralCode) {
    const referrers = await service.listWaitlists({ referral_code: referralCode }, { take: 1 })
    const referrer = referrers[0]
    if (referrer) {
      await service.updateWaitlists({
        selector: { id: referrer.id },
        data: { referral_count: (referrer.referral_count ?? 0) + 1 },
      })
    }
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.WAITLIST_WELCOME_FROM?.trim()
  if (apiKey && from) {
    const storeUrl = process.env.STORE_URL?.trim() || process.env.STORE_CORS?.split(",")[0]?.trim() || ""
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    void retryWithBackoff(
      `[waitlist-welcome] email=${email}`,
      3,
      () =>
        sendWaitlistWelcomeResend({
          apiKey,
          from,
          to: email,
          locale: locale === "ar" ? "ar" : "en",
          storeUrl,
        }),
      (r) => r.ok,
      logger,
    )
  }

  res.status(201).json({
    ok: true,
    duplicate: false,
    referral_code: newReferralCode,
    waitlist: created,
  })
}
