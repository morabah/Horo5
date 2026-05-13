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
    photo_url: model.text().nullable(),
    video_url: model.text().nullable(),
    instagram_handle: model.text().nullable(),
    permission_to_repost: model.boolean().default(false),
    fit_feedback: model.text().nullable(),
    gift_feedback: model.text().nullable(),
    ugc_type: model
      .enum(["review", "photo", "video", "delivery_reaction"])
      .default("review"),
    source: model
      .enum(["post_delivery_whatsapp", "website", "manual_admin", "instagram"])
      .default("website"),
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
