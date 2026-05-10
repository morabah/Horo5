import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260510150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "storefront_waitlist" ("id" text not null, "email" text not null, "locale" text not null default 'en', "source" text not null default 'unknown', "referral_code" text null, "referral_count" integer not null default 0, "unsubscribed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_waitlist_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_waitlist_deleted_at" ON "storefront_waitlist" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_waitlist_email_unique" ON "storefront_waitlist" ("email") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_waitlist" cascade;`)
  }

}
