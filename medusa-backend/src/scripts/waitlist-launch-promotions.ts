import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"
import { WAITLIST_MODULE } from "../modules/waitlist"
import type WaitlistModuleService from "../modules/waitlist/service"

function calculateDiscount(referrals: number): number {
  if (referrals >= 5) return 25
  if (referrals >= 3) return 20
  if (referrals >= 1) return 15
  return 10 // Base discount for waitlist members
}

function generateCouponCode(): string {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HORO-WL-${random}`
}

export default async function generateWaitlistPromotions({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const waitlistService = container.resolve<WaitlistModuleService>(WAITLIST_MODULE)

  logger.info("[waitlist-launch] Fetching waitlist members to generate launch coupons...")

  const members = await waitlistService.listWaitlists({
    unsubscribed_at: null,
  })

  if (!members.length) {
    logger.info("[waitlist-launch] No active waitlist members found.")
    return
  }

  logger.info(`[waitlist-launch] Found ${members.length} active waitlist members.`)

  let createdCount = 0
  let skippedCount = 0

  for (const member of members) {
    if (member.coupon_code) {
      skippedCount++
      continue
    }

    const discountValue = calculateDiscount(member.referral_count ?? 0)
    const couponCode = generateCouponCode()

    try {
      // 1. Create the Promotion in Medusa
      await createPromotionsWorkflow(container).run({
        input: {
          promotionsData: [
            {
              code: couponCode,
              type: "standard",
              is_automatic: false,
              status: "active",
              application_method: {
                type: "percentage",
                target_type: "order",
                value: discountValue,
                currency_code: "egp",
                allocation: "across",
              },
            },
          ],
        },
      })

      // 2. Save the coupon code back to the waitlist record
      await waitlistService.updateWaitlists({
        selector: { id: member.id },
        data: { coupon_code: couponCode },
      })

      createdCount++
      logger.info(`[waitlist-launch] Created ${discountValue}% coupon ${couponCode} for ${member.email}`)
    } catch (err) {
      logger.error(`[waitlist-launch] Failed to create coupon for ${member.email}:`, err)
    }
  }

  logger.info(`[waitlist-launch] Done. Created ${createdCount} new coupons. Skipped ${skippedCount} already-generated.`)
}
