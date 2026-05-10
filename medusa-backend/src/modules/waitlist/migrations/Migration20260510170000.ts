import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260510170000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_waitlist" add column if not exists "coupon_code" text null;`);
    this.addSql(`create unique index if not exists "IDX_waitlist_coupon_code" on "storefront_waitlist" ("coupon_code") where "deleted_at" is null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_waitlist_coupon_code";`);
    this.addSql(`alter table if exists "storefront_waitlist" drop column if exists "coupon_code";`);
  }

}
