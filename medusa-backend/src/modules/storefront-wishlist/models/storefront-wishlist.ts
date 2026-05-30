import { model } from "@medusajs/framework/utils"

const StorefrontWishlist = model
  .define({ name: "storefront_wishlist", tableName: "storefront_wishlist" }, {
    id: model.id().primaryKey(),
    client_id: model.text(),
    product_slug: model.text(),
    product_id: model.text().nullable(),
  })
  .indexes([
    {
      on: ["client_id", "product_slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["client_id"],
      where: "deleted_at IS NULL",
    },
  ])

export default StorefrontWishlist
