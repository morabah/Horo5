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
  },
).indexes([
  {
    on: ["email", "cart_id"],
    unique: true,
    where: "deleted_at IS NULL",
  },
  {
    on: ["reminder_sent_at"],
    where: "deleted_at IS NULL AND reminder_sent_at IS NULL",
  },
])

export default StorefrontAbandonedCart
