import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260513120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "photo_url" text null;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "video_url" text null;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "instagram_handle" text null;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "permission_to_repost" boolean not null default false;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "fit_feedback" text null;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "gift_feedback" text null;`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "ugc_type" text not null default 'review';`)
    this.addSql(`alter table if exists "storefront_product_review" add column if not exists "source" text not null default 'website';`)
    this.addSql(`alter table if exists "storefront_product_review" drop constraint if exists "storefront_product_review_ugc_type_check";`)
    this.addSql(`alter table if exists "storefront_product_review" add constraint "storefront_product_review_ugc_type_check" check ("ugc_type" in ('review', 'photo', 'video', 'delivery_reaction'));`)
    this.addSql(`alter table if exists "storefront_product_review" drop constraint if exists "storefront_product_review_source_check";`)
    this.addSql(`alter table if exists "storefront_product_review" add constraint "storefront_product_review_source_check" check ("source" in ('post_delivery_whatsapp', 'website', 'manual_admin', 'instagram'));`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_product_review" drop constraint if exists "storefront_product_review_source_check";`)
    this.addSql(`alter table if exists "storefront_product_review" drop constraint if exists "storefront_product_review_ugc_type_check";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "source";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "ugc_type";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "gift_feedback";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "fit_feedback";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "permission_to_repost";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "instagram_handle";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "video_url";`)
    this.addSql(`alter table if exists "storefront_product_review" drop column if exists "photo_url";`)
  }
}
