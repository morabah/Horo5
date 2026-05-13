import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260513225035 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "pdp_waitlist" drop constraint if exists "pdp_waitlist_product_id_email_unique";`);
    this.addSql(`create table if not exists "pdp_waitlist" ("id" text not null, "product_id" text not null, "email" text not null, "locale" text not null default 'en', "notified_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pdp_waitlist_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pdp_waitlist_deleted_at" ON "pdp_waitlist" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_pdp_waitlist_product_id_email_unique" ON "pdp_waitlist" ("product_id", "email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pdp_waitlist_product_id" ON "pdp_waitlist" ("product_id") WHERE deleted_at IS NULL AND notified_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "pdp_waitlist" cascade;`);
  }

}
