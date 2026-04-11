import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260411124600 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_subfeeling" drop constraint if exists "storefront_subfeeling_slug_unique";`)
    this.addSql(`create table if not exists "storefront_subfeeling" ("id" text not null, "feeling_slug" text not null, "slug" text not null, "name" text not null, "blurb" text not null default '', "card_image_src" text null, "card_image_alt" text null, "hero_image_src" text null, "hero_image_alt" text null, "seo_title" text null, "seo_description" text null, "sort_order" integer not null default 0, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_subfeeling_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_subfeeling_deleted_at" ON "storefront_subfeeling" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_subfeeling_slug_unique" ON "storefront_subfeeling" ("slug") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_subfeeling_feeling_slug" ON "storefront_subfeeling" ("feeling_slug") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_subfeeling" cascade;`)
  }
}
