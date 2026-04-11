import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260411095533 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_occasion" drop constraint if exists "storefront_occasion_slug_unique";`);
    this.addSql(`create table if not exists "storefront_occasion" ("id" text not null, "slug" text not null, "name" text not null, "blurb" text not null default '', "card_image_src" text null, "card_image_alt" text null, "hero_image_src" text null, "hero_image_alt" text null, "is_gift_occasion" boolean not null default false, "price_hint" text null, "seo_title" text null, "seo_description" text null, "sort_order" integer not null default 0, "active" boolean not null default true, "product_handles" text[] not null default '{}', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_occasion_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_occasion_deleted_at" ON "storefront_occasion" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_occasion_slug_unique" ON "storefront_occasion" ("slug") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_occasion" cascade;`);
  }

}
