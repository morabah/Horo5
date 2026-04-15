/** Subset for classification (no relations). */
export const ORDER_OPS_CORE_FIELDS = [
  "id",
  "display_id",
  "email",
  "created_at",
  "updated_at",
  "status",
  "metadata",
  "currency_code",
  "total",
  "fulfillment_status",
  "payment_status",
] as const

/**
 * Rich Remote Query shape for ops (metadata + money + lines + addresses + shipping),
 * aligned with `order-confirmation-email` subscriber graph.
 */
export const ORDER_OPS_GRAPH_FIELDS = [
  ...ORDER_OPS_CORE_FIELDS,
  "subtotal",
  "tax_total",
  "shipping_total",
  "discount_total",
  "items.*",
  "items.item.*",
  "items.detail.*",
  "summary.*",
  "shipping_address.*",
  "billing_address.*",
  "shipping_methods.*",
  "shipping_methods.shipping_method.*",
] as const

/** Extra relations for ops actions (capture, fulfill, mark delivered). */
export const ORDER_OPS_ACTION_GRAPH_FIELDS = [
  ...ORDER_OPS_GRAPH_FIELDS,
  "payment_collections.id",
  "payment_collections.payments.id",
  "payment_collections.payments.status",
  "fulfillments.id",
  "fulfillments.delivered_at",
] as const
