import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"

import { EGYPT_REGION_NAME, getEgyptRegionPaymentProviders } from "./lib/egypt-checkout"

export default async function ensureEgyptPaymentProviders({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const expectedProviders = getEgyptRegionPaymentProviders()
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: EGYPT_REGION_NAME },
    pagination: { take: 1 },
  })

  const region = (existingRegions?.[0] as { id: string; name: string } | undefined) ?? null

  if (!region) {
    throw new Error(
      `Region "${EGYPT_REGION_NAME}" was not found. Run "npm run seed:egypt" first, then rerun this script.`
    )
  }

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: region.id },
      update: {
        payment_providers: expectedProviders,
      },
    },
  })

  logger.info(
    `Ensured ${EGYPT_REGION_NAME} payment providers: ${expectedProviders.join(", ")}`
  )
}
