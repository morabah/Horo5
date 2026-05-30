import { model } from "@medusajs/framework/utils"

const StorefrontAbandonedCart = model.define(
  { name: "storefront_abandoned_cart", tableName: "storefront_abandoned_cart" },
  {
    id: model.id().primaryKey(),
    email: model.text(),
    cart_id: model.text().nullable(),
    surface: model.text(),
    locale: model.text().default("en"),
    cart_value_egp: model.number().nullable(),
    reminder_sent_at: model.dateTime().nullable(),
    normalized_cart_key: model.text(),
    consent_given: model.boolean().default(false),
    last_captured_at: model.dateTime().nullable(),
    reminder_count: model.number().default(0),
    suppressed_at: model.dateTime().nullable(),
  },
).indexes([
  {
    on: ["normalized_cart_key"],
    unique: true,
    where: "deleted_at IS NULL",
  },
  {
    on: ["reminder_sent_at"],
    where: "deleted_at IS NULL AND reminder_sent_at IS NULL",
  },
  {
    on: ["email"],
    where: "deleted_at IS NULL AND suppressed_at IS NULL",
  },
])

export default StorefrontAbandonedCart
