import { model } from "@medusajs/framework/utils"

const PdpWaitlist = model
  .define({ name: "pdp_waitlist", tableName: "pdp_waitlist" }, {
    id: model.id().primaryKey(),
    product_id: model.text(),
    email: model.text(),
    locale: model.text().default("en"),
    notified_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      on: ["product_id", "email"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      on: ["product_id"],
      where: "deleted_at IS NULL AND notified_at IS NULL",
    },
  ])

export default PdpWaitlist
