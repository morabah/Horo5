import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260510160000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_waitlist" add column if not exists "notified_at" timestamptz null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_waitlist" drop column if exists "notified_at";`);
  }

}
