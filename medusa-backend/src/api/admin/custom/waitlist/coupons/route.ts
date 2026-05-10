import { randomBytes } from "crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { WAITLIST_MODULE } from "../../../../../modules/waitlist"
import type WaitlistModuleService from "../../../../../modules/waitlist/service"

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function generateCouponCode(length = 10): string {
  const bytes = randomBytes(length)
  let code = ""
  for (let i = 0; i < length; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return code
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  const [rows] = await service.listAndCountWaitlists(
    {
      unsubscribed_at: null,
      coupon_code: null,
    },
    { take: 5000 }
  )

  let generated = 0
  let skipped = 0
  const results: { email: string; coupon_code: string }[] = []

  for (const entry of rows) {
    let code = generateCouponCode()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const existing = await service.listWaitlists(
        { coupon_code: code },
        { take: 1 }
      )
      if (existing.length === 0) break
      code = generateCouponCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      skipped++
      continue
    }

    await service.updateWaitlists(
      { id: entry.id },
      { coupon_code: code }
    )

    generated++
    results.push({ email: entry.email, coupon_code: code })
  }

  res.status(200).json({
    ok: true,
    total: rows.length,
    generated,
    skipped,
    results,
  })
}
