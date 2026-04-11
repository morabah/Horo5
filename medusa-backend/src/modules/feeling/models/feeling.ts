import { model } from "@medusajs/framework/utils"

const Feeling = model
  .define({ name: "storefront_feeling", tableName: "storefront_feeling" }, {
    id: model.id({ prefix: "sfy" }).primaryKey(),
    slug: model.text().searchable(),
    name: model.text().searchable(),
    blurb: model.text().default(""),
    tagline: model.text().nullable(),
    manifesto: model.text().nullable(),
    accent: model.text().nullable(),
    card_image_src: model.text().nullable(),
    card_image_alt: model.text().nullable(),
    hero_image_src: model.text().nullable(),
    hero_image_alt: model.text().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    sort_order: model.number().default(0),
    active: model.boolean().default(true),
  })
  .indexes([
    {
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Feeling
