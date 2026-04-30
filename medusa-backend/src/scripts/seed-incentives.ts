import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Seeds the storefront incentives: an automatic free-shipping Promotion that
 * the storefront's `/storefront/incentives` endpoint projects into the mini-cart
 * progress bar.
 *
 * Idempotent: skips if a promotion with the same code already exists.
 *
 * Run from medusa-backend:
 *   npm run seed:incentives
 *   npx @railway/cli run npm run seed:incentives:public
 *
 * Override the threshold via env:
 *   FREE_SHIPPING_THRESHOLD_EGP=1200 npm run seed:incentives
 */
const DEFAULT_THRESHOLD_EGP = 1500
const FREE_SHIPPING_CODE_PREFIX = "HORO_FREE_SHIPPING"

export async function runUpdateIncentiveThreshold(
  container: ExecArgs["container"],
  options: { thresholdEgp?: number; dryRun?: boolean } = {},
): Promise<{ summary: string; details: { code: string; threshold: number; created: boolean } }> {
  const threshold = options.thresholdEgp ?? DEFAULT_THRESHOLD_EGP
  if (!Number.isFinite(threshold) || threshold <= 0) {
    return { summary: `Invalid threshold: ${threshold}`, details: { code: "", threshold, created: false } }
  }

  const code = `${FREE_SHIPPING_CODE_PREFIX}_${threshold}`
  const promotionModule = container.resolve(Modules.PROMOTION)

  const existing = await promotionModule.listPromotions(
    { code },
    { take: 1, relations: ["rules", "rules.values"] },
  )
  const existingRow = existing[0] as
    | { id: string; rules?: Array<{ attribute?: string; operator?: string }> }
    | undefined

  if (existingRow) {
    const hasSubtotalRule = (existingRow.rules ?? []).some((r) => {
      const a = (r.attribute ?? "").toLowerCase()
      const o = (r.operator ?? "").toLowerCase()
      return (a === "subtotal" || a === "cart.subtotal") && (o === "gte" || o === "gt")
    })

    if (!hasSubtotalRule && !options.dryRun) {
      await promotionModule.addPromotionRules(existingRow.id, [
        { attribute: "subtotal", operator: "gte", values: [String(threshold)] },
      ])
    }

    return {
      summary: options.dryRun
        ? `[dry-run] Promotion "${code}" already exists (id=${existingRow.id}).`
        : `Promotion "${code}" already exists (id=${existingRow.id}). Subtotal rule ${hasSubtotalRule ? "present" : "added"}.`,
      details: { code, threshold, created: false },
    }
  }

  if (options.dryRun) {
    return {
      summary: `[dry-run] Would create promotion "${code}" with threshold ${threshold} EGP.`,
      details: { code, threshold, created: true },
    }
  }

  const { result } = await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code,
          type: "standard",
          is_automatic: true,
          status: "active",
          application_method: {
            type: "percentage",
            target_type: "shipping_methods",
            value: 100,
            currency_code: "egp",
            allocation: "across",
          },
          rules: [
            { attribute: "subtotal", operator: "gte", values: [String(threshold)] },
          ],
        },
      ],
    },
  })

  const created = result?.[0] as { id?: string } | undefined
  return {
    summary: `Created promotion id=${created?.id} code=${code} threshold=${threshold} EGP`,
    details: { code, threshold, created: true },
  }
}

export default async function seedIncentives({ container }: ExecArgs) {
  const threshold = Number(process.env.FREE_SHIPPING_THRESHOLD_EGP ?? DEFAULT_THRESHOLD_EGP)
  if (!Number.isFinite(threshold) || threshold <= 0) {
    // eslint-disable-next-line no-console
    console.error(`[seed-incentives] Invalid FREE_SHIPPING_THRESHOLD_EGP: ${threshold}`)
    process.exitCode = 1
    return
  }
  const code = `${FREE_SHIPPING_CODE_PREFIX}_${threshold}`

  const promotionModule = container.resolve(Modules.PROMOTION)

  const existing = await promotionModule.listPromotions(
    { code },
    { take: 1, relations: ["rules", "rules.values"] },
  )
  const existingRow = existing[0] as
    | { id: string; rules?: Array<{ attribute?: string; operator?: string }> }
    | undefined
  if (existingRow) {
    const hasSubtotalRule = (existingRow.rules ?? []).some((r) => {
      const a = (r.attribute ?? "").toLowerCase()
      const o = (r.operator ?? "").toLowerCase()
      return (a === "subtotal" || a === "cart.subtotal") && (o === "gte" || o === "gt")
    })
    if (hasSubtotalRule) {
      // eslint-disable-next-line no-console
      console.info(
        `[seed-incentives] Promotion "${code}" already exists with a subtotal rule (id=${existingRow.id}). Nothing to do.`,
      )
      return
    }
    // Existing row was created without a working rule — patch it in-place.
    // eslint-disable-next-line no-console
    console.info(
      `[seed-incentives] Promotion "${code}" exists (id=${existingRow.id}) but has no subtotal rule. Adding rule.`,
    )
    await promotionModule.addPromotionRules(existingRow.id, [
      {
        attribute: "subtotal",
        operator: "gte",
        values: [String(threshold)],
      },
    ])
    // eslint-disable-next-line no-console
    console.info(
      `[seed-incentives] Added rule subtotal>=${threshold} to promotion id=${existingRow.id}`,
    )
    return
  }

  /*
   * Atomic create: pass `rules` inline so the promotion is born WITH the
   * `subtotal gte ${threshold}` rule. A previous two-step variant (create →
   * addPromotionRules) left the promotion rule-less when the second call was
   * skipped, which is what blanked /storefront/incentives.freeShipping.
   * `CreatePromotionDTO` accepts `rules?: CreatePromotionRuleDTO[]` natively
   * (see @medusajs/types/dist/promotion/common/promotion.d.ts).
   */
  const { result } = await createPromotionsWorkflow(container).run({
    input: {
      promotionsData: [
        {
          code,
          type: "standard",
          is_automatic: true,
          status: "active",
          application_method: {
            type: "percentage",
            target_type: "shipping_methods",
            value: 100,
            currency_code: "egp",
            allocation: "across",
          },
          rules: [
            {
              attribute: "subtotal",
              operator: "gte",
              values: [String(threshold)],
            },
          ],
        },
      ],
    },
  })

  const created = result?.[0] as { id?: string } | undefined
  if (!created?.id) {
    // eslint-disable-next-line no-console
    console.error(`[seed-incentives] createPromotionsWorkflow did not return an id.`)
    process.exitCode = 1
    return
  }
  /*
   * Defensive verification: re-fetch the promotion and confirm the rule is
   * present. If older Medusa versions ever drop inline `rules`, fall back to
   * `addPromotionRules` so a partial seed never persists.
   */
  const verify = await promotionModule.listPromotions(
    { id: created.id },
    { take: 1, relations: ["rules", "rules.values"] },
  )
  const rules = (verify[0] as { rules?: Array<{ attribute?: string; operator?: string }> } | undefined)?.rules ?? []
  const hasSubtotalRule = rules.some((r) => {
    const a = (r.attribute ?? "").toLowerCase()
    const o = (r.operator ?? "").toLowerCase()
    return (a === "subtotal" || a === "cart.subtotal") && (o === "gte" || o === "gt")
  })
  if (!hasSubtotalRule) {
    await promotionModule.addPromotionRules(created.id, [
      {
        attribute: "subtotal",
        operator: "gte",
        values: [String(threshold)],
      },
    ])
    // eslint-disable-next-line no-console
    console.info(
      `[seed-incentives] Inline rule was not persisted by core-flows; recovered via addPromotionRules on id=${created.id}.`,
    )
  }
  // eslint-disable-next-line no-console
  console.info(
    `[seed-incentives] Created promotion id=${created.id} code=${code} threshold=${threshold} EGP`,
  )
}
