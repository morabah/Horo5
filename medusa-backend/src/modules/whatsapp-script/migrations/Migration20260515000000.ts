import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260515000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "whatsapp_script" ("id" text not null, "name" text not null, "purpose" text check ("purpose" in ('opening', 'cod_confirmation', 'gift_help', 'exchange', 'ugc_request')) not null default 'opening', "body_template" text not null, "locale" text check ("locale" in ('en', 'ar')) not null default 'en', "version" integer not null default 1, "active" boolean not null default true, "sort_order" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "whatsapp_script_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_whatsapp_script_deleted_at" ON "whatsapp_script" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_whatsapp_script_name_locale_unique" ON "whatsapp_script" ("name", "locale") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_whatsapp_script_active_purpose_sort" ON "whatsapp_script" ("active", "purpose", "sort_order") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "whatsapp_script" cascade;`)
  }
}
