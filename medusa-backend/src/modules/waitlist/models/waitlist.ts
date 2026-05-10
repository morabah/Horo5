import { model } from "@medusajs/framework/utils"

const Waitlist = model
  .define({ name: "storefront_waitlist", tableName: "storefront_waitlist" }, {
    id: model.id({ prefix: "wls" }).primaryKey(),
    email: model.text().searchable(),
    locale: model.text().default("en"),
    source: model.text().default("unknown"),
    referral_code: model.text().nullable(),
    referral_count: model.number().default(0),
    coupon_code: model.text().nullable(),
    notified_at: model.dateTime().nullable(),
    unsubscribed_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      on: ["email"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Waitlist
