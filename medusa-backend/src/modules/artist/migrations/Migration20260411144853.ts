import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260411144853 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_artist" drop constraint if exists "storefront_artist_slug_unique";`);
    this.addSql(`create table if not exists "storefront_artist" ("id" text not null, "slug" text not null, "name" text not null, "style" text not null default '', "design_count" integer not null default 0, "avatar_src" text null, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_artist_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_artist_deleted_at" ON "storefront_artist" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_artist_slug_unique" ON "storefront_artist" ("slug") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_artist" cascade;`);
  }

}
