import { model } from "@medusajs/framework/utils"

const MerchEvent = model
  .define({ name: "storefront_merch_event", tableName: "storefront_merch_event" }, {
    id: model.id({ prefix: "sfe" }).primaryKey(),
    slug: model.text().searchable(),
    name: model.text().searchable(),
    type: model.text().default("campaign"),
    teaser: model.text().default(""),
    body: model.text().default(""),
    status: model.enum(["draft", "scheduled", "active", "archived"]).default("scheduled"),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    hero_image_src: model.text().nullable(),
    hero_image_alt: model.text().nullable(),
    card_image_src: model.text().nullable(),
    card_image_alt: model.text().nullable(),
    seo_title: model.text().nullable(),
    seo_description: model.text().nullable(),
    sort_order: model.number().default(0),
    active: model.boolean().default(true),
    product_handles: model.array().default([]),
    occasion_slug: model.text().nullable(),
  })
  .indexes([
    {
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default MerchEvent
