import { model } from "@medusajs/framework/utils"

const Occasion = model
  .define({ name: "storefront_occasion", tableName: "storefront_occasion" }, {
    id: model.id({ prefix: "sfo" }).primaryKey(),
    slug: model.text().searchable(),
    name: model.text().searchable(),
    blurb: model.text().default(""),
    accent: model.text().nullable(),
    card_image_src: model.text().nullable(),
    card_image_alt: model.text().nullable(),
    hero_image_src: model.text().nullable(),
    hero_image_alt: model.text().nullable(),
    is_gift_occasion: model.boolean().default(false),
    price_hint: model.text().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    sort_order: model.number().default(0),
    active: model.boolean().default(true),
    product_handles: model.array().default([]),
  })
  .indexes([
    {
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Occasion
