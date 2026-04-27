import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * One-shot diagnostic: dumps every HORO_* automatic promotion (with rules + application
 * method) so we can see why `/storefront/incentives` is returning null.
 *
 *   npm run inspect:incentives
 */
export default async function inspectIncentives({ container }: ExecArgs) {
  const promotionModule = container.resolve(Modules.PROMOTION)

  const all = await promotionModule.listPromotions(
    {},
    { take: 200, relations: ["application_method", "rules", "rules.values"] },
  )

  const horo = all.filter((p) => (p.code ?? "").toUpperCase().startsWith("HORO_"))

  // eslint-disable-next-line no-console
  console.info(`[inspect-incentives] Found ${horo.length} HORO_* promotion(s):`)
  for (const p of horo) {
    // eslint-disable-next-line no-console
    console.info(JSON.stringify(p, null, 2))
  }

  const automaticActive = await promotionModule.listPromotions(
    { is_automatic: true, status: ["active"] },
    { take: 50, relations: ["application_method", "rules", "rules.values"] },
  )
  // eslint-disable-next-line no-console
  console.info(
    `[inspect-incentives] is_automatic+active count = ${automaticActive.length}; codes = ${automaticActive
      .map((p) => p.code)
      .join(", ")}`,
  )
}
