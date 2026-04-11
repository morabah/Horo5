import { model } from "@medusajs/framework/utils"

const Artist = model
  .define({ name: "storefront_artist", tableName: "storefront_artist" }, {
    id: model.id({ prefix: "art" }).primaryKey(),
    slug: model.text().searchable(),
    name: model.text().searchable(),
    style: model.text().default(""),
    design_count: model.number().default(0),
    avatar_src: model.text().nullable(),
    active: model.boolean().default(true),
  })
  .indexes([
    {
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Artist
