import { Migration } from "@mikro-orm/migrations"

export class Migration20260515120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "validation_register_entry" ("id" text not null, "record_type" text check ("record_type" in ('buyer_validation', 'empathy_interview', 'evidence_register', 'creative_test')) not null default 'buyer_validation', "title" text not null, "asset" text null, "claim" text null, "status" text check ("status" in ('draft', 'testing', 'passed', 'failed', 'decided', 'archived')) not null default 'draft', "decision" text check ("decision" in ('untested', 'ship', 'revise', 'hold', 'retire', 'override')) not null default 'untested', "buyers_tested" integer not null default 0, "pass_count" integer not null default 0, "concern" text null, "segment" text null, "verbatim" text null, "objection" text null, "gift_situation" text null, "hook" text null, "validation_source" text null, "owner" text null, "week" text null, "metrics" jsonb null, "tags" jsonb null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "validation_register_entry_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_validation_register_entry_deleted_at" ON "validation_register_entry" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_validation_register_entry_type_status" ON "validation_register_entry" ("record_type", "status") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_validation_register_entry_decision_type" ON "validation_register_entry" ("decision", "record_type") WHERE deleted_at IS NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "validation_register_entry" cascade;`)
  }
}
