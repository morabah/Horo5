import { model } from "@medusajs/framework/utils"

const WhatsappScript = model
  .define({ name: "whatsapp_script", tableName: "whatsapp_script" }, {
    id: model.id({ prefix: "was" }).primaryKey(),
    name: model.text().searchable(),
    purpose: model
      .enum([
        "opening",
        "cod_confirmation",
        "gift_help",
        "exchange",
        "ugc_request",
      ])
      .default("opening"),
    body_template: model.text(),
    locale: model.enum(["en", "ar"]).default("en"),
    version: model.number().default(1),
    active: model.boolean().default(true),
    sort_order: model.number().default(0),
  })
  .indexes([
    {
      on: ["name", "locale"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["active", "purpose", "sort_order"],
      where: "deleted_at IS NULL",
    },
  ])

export default WhatsappScript
