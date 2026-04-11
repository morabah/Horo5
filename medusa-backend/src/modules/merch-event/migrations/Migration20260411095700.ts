import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260411095700 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_merch_event" drop constraint if exists "storefront_merch_event_slug_unique";`);
    this.addSql(`create table if not exists "storefront_merch_event" ("id" text not null, "slug" text not null, "name" text not null, "type" text not null default 'campaign', "teaser" text not null default '', "body" text not null default '', "status" text check ("status" in ('draft', 'scheduled', 'active', 'archived')) not null default 'scheduled', "starts_at" timestamptz null, "ends_at" timestamptz null, "hero_image_src" text null, "hero_image_alt" text null, "card_image_src" text null, "card_image_alt" text null, "seo_title" text null, "seo_description" text null, "sort_order" integer not null default 0, "active" boolean not null default true, "product_handles" text[] not null default '{}', "occasion_slug" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_merch_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_merch_event_deleted_at" ON "storefront_merch_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_merch_event_slug_unique" ON "storefront_merch_event" ("slug") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_merch_event" cascade;`);
  }

}
