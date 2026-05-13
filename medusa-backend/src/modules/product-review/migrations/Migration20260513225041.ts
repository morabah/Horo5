import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260513225041 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "storefront_product_review" ("id" text not null, "product_id" text not null, "customer_id" text null, "rating" integer not null, "body" text not null default '', "locale" text not null default 'en', "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'pending', "photo_url" text null, "video_url" text null, "instagram_handle" text null, "permission_to_repost" boolean not null default false, "fit_feedback" text null, "gift_feedback" text null, "ugc_type" text check ("ugc_type" in ('review', 'photo', 'video', 'delivery_reaction')) not null default 'review', "source" text check ("source" in ('post_delivery_whatsapp', 'website', 'manual_admin', 'instagram')) not null default 'website', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_product_review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_product_review_deleted_at" ON "storefront_product_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_product_review_product_id" ON "storefront_product_review" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_product_review_status" ON "storefront_product_review" ("status") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_product_review" cascade;`);
  }

}
