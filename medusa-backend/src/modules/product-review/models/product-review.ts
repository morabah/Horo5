import { model } from "@medusajs/framework/utils"

const ProductReview = model
  .define({ name: "storefront_product_review", tableName: "storefront_product_review" }, {
    id: model.id({ prefix: "prv" }).primaryKey(),
    product_id: model.text().searchable(),
    customer_id: model.text().nullable(),
    rating: model.number(),
    body: model.text().default(""),
    locale: model.text().default("en"),
    status: model
      .enum(["pending", "approved", "rejected"])
      .default("pending"),
  })
  .indexes([
    {
      on: ["product_id"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["status"],
      where: "deleted_at IS NULL",
    },
  ])

export default ProductReview
