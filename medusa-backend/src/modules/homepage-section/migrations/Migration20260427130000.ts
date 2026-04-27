import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260427130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "storefront_homepage_section" ("id" text not null, "key" text not null, "type" text check ("type" in ('hero', 'trust_ribbon', 'primary_routes', 'founding_drop', 'featured_piece', 'feeling_grid', 'occasion_grid', 'gift_block', 'why_horo', 'first_drop_circle', 'proof_strip', 'seen_on_you', 'artist_spotlight')) not null default 'hero', "eyebrow_en" text null, "eyebrow_ar" text null, "title_en" text null, "title_ar" text null, "body_en" text null, "body_ar" text null, "primary_cta_label_en" text null, "primary_cta_label_ar" text null, "primary_cta_href" text null, "secondary_cta_label_en" text null, "secondary_cta_label_ar" text null, "secondary_cta_href" text null, "image_src" text null, "image_alt_en" text null, "image_alt_ar" text null, "accent" text null, "sort_order" integer not null default 0, "active" boolean not null default true, "payload" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_homepage_section_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_homepage_section_deleted_at" ON "storefront_homepage_section" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_homepage_section_key_unique" ON "storefront_homepage_section" ("key") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_homepage_section_active_sort" ON "storefront_homepage_section" ("active", "sort_order") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_homepage_section" cascade;`)
  }
}
