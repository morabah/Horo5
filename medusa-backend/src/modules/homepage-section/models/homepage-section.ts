import { model } from "@medusajs/framework/utils"

const HomepageSection = model
  .define({ name: "storefront_homepage_section", tableName: "storefront_homepage_section" }, {
    id: model.id({ prefix: "hps" }).primaryKey(),
    key: model.text().searchable(),
    type: model
      .enum([
        "hero",
        "trust_ribbon",
        "primary_routes",
        "founding_drop",
        "featured_piece",
        "feeling_grid",
        "occasion_grid",
        "gift_block",
        "why_horo",
        "first_drop_circle",
        "proof_strip",
        "seen_on_you",
        "artist_spotlight",
        "editorial_feature",
      ])
      .default("hero"),
    eyebrow_en: model.text().nullable(),
    eyebrow_ar: model.text().nullable(),
    title_en: model.text().nullable(),
    title_ar: model.text().nullable(),
    body_en: model.text().nullable(),
    body_ar: model.text().nullable(),
    primary_cta_label_en: model.text().nullable(),
    primary_cta_label_ar: model.text().nullable(),
    primary_cta_href: model.text().nullable(),
    secondary_cta_label_en: model.text().nullable(),
    secondary_cta_label_ar: model.text().nullable(),
    secondary_cta_href: model.text().nullable(),
    image_src: model.text().nullable(),
    image_alt_en: model.text().nullable(),
    image_alt_ar: model.text().nullable(),
    accent: model.text().nullable(),
    sort_order: model.number().default(0),
    active: model.boolean().default(true),
    payload: model.json().nullable(),
  })
  .indexes([
    {
      on: ["key"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["active", "sort_order"],
      where: "deleted_at IS NULL",
    },
  ])

export default HomepageSection
