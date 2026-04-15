import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { EGYPT_REGION_NAME, getEgyptRegionPaymentProviders } from "./lib/egypt-checkout"

/**
 * Read-only: print Egypt region id and linked payment provider ids vs `getEgyptRegionPaymentProviders()`.
 *
 *   npm run inspect:egypt-payment-providers
 *   npm run inspect:egypt-payment-providers:public
 */
export default async function inspectEgyptRegionPaymentProviders({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const expected = getEgyptRegionPaymentProviders()

  const { data } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "payment_providers.id"],
    filters: { name: EGYPT_REGION_NAME },
    pagination: { take: 1 },
  })

  const row = data?.[0] as
    | {
        id?: string
        name?: string
        currency_code?: string
        payment_providers?: Array<{ id?: string }>
      }
    | undefined

  if (!row?.id) {
    logger.warn(`Region "${EGYPT_REGION_NAME}" not found.`)
    return
  }

  const linked = (row.payment_providers ?? [])
    .map((p) => p.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)

  logger.info(`Region: ${row.name} (${row.id}) currency=${row.currency_code ?? "?"}`)
  logger.info(`Linked payment provider IDs (${linked.length}): ${linked.length ? linked.join(", ") : "(none)"}`)
  logger.info(`Would ensure (from current env / Paymob rules): ${expected.join(", ")}`)
}
