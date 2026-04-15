import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { normalizeGraphOrderForEmail } from "../lib/normalize-graph-order-for-email"
import { ORDER_CONFIRMATION_GRAPH_FIELDS } from "../lib/order-confirmation-graph-fields"
import { buildOrderConfirmationHtml, validateOrderConfirmationPricing } from "../lib/order-confirmation-email"

/** Offline fixture when no `ORDER_PREVIEW_ID` — exercises money + delivery copy without DB. */
const FIXTURE_ROW: Record<string, unknown> = {
  id: "order_preview_fixture",
  display_id: 13,
  email: "buyer@example.com",
  currency_code: "egp",
  created_at: "2026-04-15T10:52:00.000Z",
  metadata: { delivery: { standardMinDays: 3, standardMaxDays: 5 } },
  subtotal: 0,
  tax_total: 0,
  shipping_total: 0,
  discount_total: 0,
  total: 0,
  summary: [],
  items: [
    {
      quantity: 1,
      item: {
        product_title: "Midnight Compass",
        variant_title: "M",
        product_handle: "midnight-compass",
        unit_price: { numeric_: "119850" },
      },
      detail: {
        unit_price: { numeric_: "119850" },
        quantity: 1,
        subtotal: { numeric_: "119850" },
      },
    },
    {
      quantity: 1,
      item: {
        product_title: "Silent Scream",
        variant_title: "M",
        product_handle: "silent-scream",
        unit_price: { numeric_: "119850" },
      },
      detail: {
        unit_price: { numeric_: "119850" },
        quantity: 1,
        subtotal: { numeric_: "119850" },
      },
    },
  ],
  shipping_methods: [
    {
      name: "Standard",
      shipping_method: { name: "Standard", amount: { numeric_: "6000" } },
    },
  ],
  shipping_address: {
    first_name: "Mohamed",
    last_name: "Ahmed",
    address_1: "1 Nile St",
    city: "Cairo",
    country_code: "eg",
    phone: "+201005038293",
  },
  billing_address: null,
}

/**
 * Preview order confirmation email HTML (stdout). No Resend call.
 *
 *   cd medusa-backend
 *   npm run preview:order-confirmation-email
 *
 * Load a real order from the connected DB:
 *
 *   ORDER_PREVIEW_ID=order_01XXXX npm run preview:order-confirmation-email
 *
 * Exits with code 1 if normalized pricing fails validation (empty line prices, total mismatch, etc.).
 */
function printPricingCheck(input: ReturnType<typeof normalizeGraphOrderForEmail>): boolean {
  const { ok, errors } = validateOrderConfirmationPricing(input)
  // eslint-disable-next-line no-console
  console.log("\n--- pricing validation ---")
  if (ok) {
    // eslint-disable-next-line no-console
    console.log("OK: line items, subtotal/shipping/total are consistent")
    return true
  }
  for (const e of errors) {
    // eslint-disable-next-line no-console
    console.error("FAIL:", e)
  }
  return false
}

export default async function previewOrderConfirmationEmail({ container }: ExecArgs) {
  const orderId = process.env.ORDER_PREVIEW_ID?.trim()

  if (!orderId) {
    const input = normalizeGraphOrderForEmail(FIXTURE_ROW, { storeUrl: "https://shop.example.com" })
    // eslint-disable-next-line no-console
    console.log("[preview-order-confirmation-email] fixture (set ORDER_PREVIEW_ID for a real order)\n")
    // eslint-disable-next-line no-console
    console.log("estimated_delivery_window:", input.estimated_delivery_window ?? "(null)")
    const pricingOk = printPricingCheck(input)
    // eslint-disable-next-line no-console
    console.log("\n--- HTML ---\n")
    // eslint-disable-next-line no-console
    console.log(buildOrderConfirmationHtml(input))
    if (!pricingOk) process.exitCode = 1
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (args: Record<string, unknown>) => Promise<{ data?: unknown[] }>
  }

  const { data } = await query.graph({
    entity: "order",
    fields: [...ORDER_CONFIRMATION_GRAPH_FIELDS],
    filters: { id: orderId },
    pagination: { take: 1 },
  })
  const row = (data || [])[0] as Record<string, unknown> | undefined
  if (!row) {
    // eslint-disable-next-line no-console
    console.error(`[preview-order-confirmation-email] No order for id: ${orderId}`)
    process.exitCode = 1
    return
  }

  const storeUrl = process.env.STORE_URL?.trim() || process.env.STORE_CORS?.split(",")[0]?.trim() || ""
  const input = normalizeGraphOrderForEmail(row, { storeUrl: storeUrl || null })
  // eslint-disable-next-line no-console
  console.log("[preview-order-confirmation-email] order:", orderId)
  // eslint-disable-next-line no-console
  console.log("estimated_delivery_window:", input.estimated_delivery_window ?? "(null)")
  const pricingOk = printPricingCheck(input)
  // eslint-disable-next-line no-console
  console.log("\n--- HTML ---\n")
  // eslint-disable-next-line no-console
  console.log(buildOrderConfirmationHtml(input))
  if (!pricingOk) process.exitCode = 1
}
