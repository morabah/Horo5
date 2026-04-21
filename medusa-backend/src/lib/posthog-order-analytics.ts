import { coerceMoneyAmount } from "./egp-amount"
import { GIFT_WRAP_PRODUCT_HANDLE, type OrderConfirmationInput, type OrderLineLike } from "./order-confirmation-email"

type PostHogCaptureResult = {
  ok: boolean
  status: number
  error?: string
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function quantityFromLine(line: OrderLineLike): number {
  const q =
    typeof line.quantity === "number" && Number.isFinite(line.quantity)
      ? line.quantity
      : coerceMoneyAmount(line.quantity) ?? 1
  return Math.max(1, Math.floor(q))
}

function unitPriceFromLine(line: OrderLineLike, quantity: number): number {
  const unit = coerceMoneyAmount(line.unit_price)
  if (unit !== null && unit > 0) return unit
  const total = coerceMoneyAmount(line.total)
  if (total !== null && total > 0 && quantity > 0) return total / quantity
  return 0
}

function sizeFromVariantTitle(variantTitle: string | null | undefined): string | undefined {
  const value = cleanString(variantTitle)
  if (!value) return undefined
  const direct = value.toUpperCase()
  if (/^(XS|S|M|L|XL|XXL)$/.test(direct)) return direct
  const match = direct.match(/\b(XS|S|M|L|XL|XXL)\b/)
  return match?.[1]
}

export function buildPostHogOrderCompletedPayload(order: OrderConfirmationInput) {
  const orderId = cleanString(order.id) || "unknown_order"
  const displayId =
    typeof order.display_id === "number" && Number.isFinite(order.display_id) && order.display_id > 0
      ? `HORO-${Math.floor(order.display_id)}`
      : cleanString(order.display_id)
  const currency = cleanString(order.currency_code)?.toUpperCase() || "EGP"
  const rawLines = (order.items || []).filter((line) => {
    const handle = cleanString(line.product_handle)?.toLowerCase()
    return handle !== GIFT_WRAP_PRODUCT_HANDLE
  })
  const items = rawLines.map((line) => {
    const quantity = quantityFromLine(line)
    const productHandle = cleanString(line.product_handle)
    const itemName = cleanString(line.product_title) || cleanString(line.title) || cleanString(line.variant_title) || "Item"
    const size = sizeFromVariantTitle(line.variant_title)
    return {
      item_id: productHandle || itemName,
      item_name: itemName,
      item_brand: "HORO Egypt",
      ...(size ? { item_variant: size } : cleanString(line.variant_title) ? { item_variant: cleanString(line.variant_title) } : {}),
      price: unitPriceFromLine(line, quantity),
      quantity,
    }
  })
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const shippingMethod = order.shipping_methods?.find(Boolean)
  const shippingLabel = cleanString(shippingMethod?.name)

  return {
    event: "commerce_order_completed",
    distinct_id: orderId,
    properties: {
      $insert_id: `commerce_order_completed:${orderId}`,
      $process_person_profile: false,
      commerce_event: "commerce_order_completed",
      source: "medusa_order_placed",
      transaction_id: orderId,
      ...(displayId ? { order_ref: displayId } : {}),
      currency,
      value: coerceMoneyAmount(order.total) ?? 0,
      subtotal: coerceMoneyAmount(order.subtotal) ?? 0,
      shipping: coerceMoneyAmount(order.shipping_total) ?? 0,
      tax: coerceMoneyAmount(order.tax_total) ?? 0,
      discount: coerceMoneyAmount(order.discount_total) ?? 0,
      item_count: itemCount,
      line_count: items.length,
      ...(shippingLabel ? { shipping_method: shippingLabel } : {}),
      items,
    },
  }
}

export async function sendPostHogCapture(args: {
  apiKey: string
  host: string
  payload: ReturnType<typeof buildPostHogOrderCompletedPayload>
}): Promise<PostHogCaptureResult> {
  const host = args.host.replace(/\/+$/, "")
  const response = await fetch(`${host}/capture/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      api_key: args.apiKey,
      ...args.payload,
    }),
  })

  if (response.ok) {
    return { ok: true, status: response.status }
  }

  const text = await response.text().catch(() => "")
  return {
    ok: false,
    status: response.status,
    error: text.slice(0, 500) || response.statusText,
  }
}
