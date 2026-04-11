import { model } from "@medusajs/framework/utils"

const Subfeeling = model
  .define({ name: "storefront_subfeeling", tableName: "storefront_subfeeling" }, {
    id: model.id({ prefix: "ssb" }).primaryKey(),
    feeling_slug: model.text().searchable(),
    slug: model.text().searchable(),
    name: model.text().searchable(),
    blurb: model.text().default(""),
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
    {
      on: ["feeling_slug"],
    },
  ])

export default Subfeeling
