import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260515000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "objection_log" ("id" text not null, "source" text check ("source" in ('pdp', 'cart', 'checkout', 'post_purchase', 'buyer_interview')) not null default 'pdp', "objection" text not null, "category" text check ("category" in ('price', 'size', 'trust', 'delivery', 'gift_fit', 'other')) not null default 'other', "product_slug" text null, "order_id" text null, "buyer_segment" text null, "resolved" boolean not null default false, "resolution" text null, "resolution_date" timestamptz null, "assigned_to" text null, "priority" text check ("priority" in ('low', 'medium', 'high')) not null default 'medium', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "objection_log_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_objection_log_deleted_at" ON "objection_log" ("deleted_at") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_objection_log_resolved_priority" ON "objection_log" ("resolved", "priority") WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_objection_log_category_source" ON "objection_log" ("category", "source") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "objection_log" cascade;`)
  }
}
