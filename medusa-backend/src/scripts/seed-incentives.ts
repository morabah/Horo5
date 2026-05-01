import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createPromotionsWorkflow } from "@medusajs/medusa/core-flows"

import {
  DEFAULT_FREE_SHIPPING_THRESHOLD_EGP,
  FREE_SHIPPING_CODE_PREFIX,
} from "../lib/shared/constants"

/** Read the free-shipping threshold from store metadata, env, or shared constant. */
async function resolveThresholdEgp(container: ExecArgs["container"]): Promise<number> {
  const storeModule = container.resolve(Modules.STORE) as {
    listStores: () => Promise<Array<{ metadata?: Record<string, unknown> | null }>>
  }
  const stores = await storeModule.listStores()
  const meta = stores[0]?.metadata ?? {}
  const fromMeta = typeof meta.freeShippingThresholdEgp === "number"
    ? meta.freeShippingThresholdEgp
    : typeof meta.freeShippingThresholdEgp === "string"
      ? Number(meta.freeShippingThresholdEgp)
      : null
  if (fromMeta !== null && Number.isFinite(fromMeta) && fromMeta > 0) {
    return Math.round(fromMeta)
  }
  const fromEnv = Number(process.env.FREE_SHIPPING_THRESHOLD_EGP ?? "")
  if (Number.isFinite(fromEnv) && fromEnv > 0) {
    return Math.round(fromEnv)
  }
  return DEFAULT_FREE_SHIPPING_THRESHOLD_EGP
}

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

export async function runUpdateIncentiveThreshold(
  container: ExecArgs["container"],
  options: { thresholdEgp?: number; dryRun?: boolean } = {},
): Promise<{ summary: string; details: { code: string; threshold: number; created: boolean } }> {
  const threshold = options.thresholdEgp ?? DEFAULT_FREE_SHIPPING_THRESHOLD_EGP
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
  if (!created?.id) {
    return {
      summary: `createPromotionsWorkflow did not return an id for code=${code}`,
      details: { code, threshold, created: false },
    }
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
    return {
      summary: `Created promotion id=${created.id} code=${code} threshold=${threshold} EGP (rule recovered via addPromotionRules).`,
      details: { code, threshold, created: true },
    }
  }

  return {
    summary: `Created promotion id=${created.id} code=${code} threshold=${threshold} EGP`,
    details: { code, threshold, created: true },
  }
}

export default async function seedIncentives({ container }: ExecArgs) {
  const threshold = await resolveThresholdEgp(container)
  if (!Number.isFinite(threshold) || threshold <= 0) {
    // eslint-disable-next-line no-console
    console.error(`[seed-incentives] Invalid free-shipping threshold: ${threshold}`)
    process.exitCode = 1
    return
  }

  const result = await runUpdateIncentiveThreshold(container, { thresholdEgp: threshold })
  // eslint-disable-next-line no-console
  console.info(`[seed-incentives] ${result.summary}`)
  if (!result.details.created && result.details.code === "") {
    process.exitCode = 1
  }
}
