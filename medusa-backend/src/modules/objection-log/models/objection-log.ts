import { model } from "@medusajs/framework/utils"

const ObjectionLog = model
  .define({ name: "objection_log", tableName: "objection_log" }, {
    id: model.id({ prefix: "obj" }).primaryKey(),
    source: model.enum(["pdp", "cart", "checkout", "post_purchase", "buyer_interview"]).default("pdp"),
    objection: model.text(),
    category: model.enum(["price", "size", "trust", "delivery", "gift_fit", "other"]).default("other"),
    product_slug: model.text().nullable(),
    order_id: model.text().nullable(),
    buyer_segment: model.text().nullable(),
    resolved: model.boolean().default(false),
    resolution: model.text().nullable(),
    resolution_date: model.dateTime().nullable(),
    assigned_to: model.text().nullable(),
    priority: model.enum(["low", "medium", "high"]).default("medium"),
  })
  .indexes([
    {
      on: ["resolved", "priority"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["category", "source"],
      where: "deleted_at IS NULL",
    },
  ])

export default ObjectionLog
