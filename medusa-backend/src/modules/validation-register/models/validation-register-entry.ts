import { model } from "@medusajs/framework/utils"

const ValidationRegisterEntry = model
  .define({ name: "validation_register_entry", tableName: "validation_register_entry" }, {
    id: model.id({ prefix: "vre" }).primaryKey(),
    record_type: model
      .enum(["buyer_validation", "empathy_interview", "evidence_register", "creative_test"])
      .default("buyer_validation"),
    title: model.text().searchable(),
    asset: model.text().nullable(),
    claim: model.text().nullable(),
    status: model.enum(["draft", "testing", "passed", "failed", "decided", "archived"]).default("draft"),
    decision: model.enum(["untested", "ship", "revise", "hold", "retire", "override"]).default("untested"),
    buyers_tested: model.number().default(0),
    pass_count: model.number().default(0),
    concern: model.text().nullable(),
    segment: model.text().nullable(),
    verbatim: model.text().nullable(),
    objection: model.text().nullable(),
    gift_situation: model.text().nullable(),
    hook: model.text().nullable(),
    validation_source: model.text().nullable(),
    owner: model.text().nullable(),
    week: model.text().nullable(),
    metrics: model.json().nullable(),
    tags: model.json().nullable(),
    notes: model.text().nullable(),
  })
  .indexes([
    {
      on: ["record_type", "status"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["decision", "record_type"],
      where: "deleted_at IS NULL",
    },
  ])

export default ValidationRegisterEntry
