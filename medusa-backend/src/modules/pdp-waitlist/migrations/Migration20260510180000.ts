import { Migration } from "@mikro-orm/migrations"

export class Migration20260510180000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "pdp_waitlist" ("id" text not null, "product_id" text not null, "email" text not null, "locale" text not null default 'en', "notified_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pdp_waitlist_pkey" primary key ("id"));`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pdp_waitlist_product_email" ON "pdp_waitlist" ("product_id", "email") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pdp_waitlist_product_pending" ON "pdp_waitlist" ("product_id") WHERE deleted_at IS NULL AND notified_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pdp_waitlist_deleted_at" ON "pdp_waitlist" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "pdp_waitlist" cascade;`)
  }
}
