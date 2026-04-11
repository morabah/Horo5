import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260412120001 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "storefront_occasion" add column if not exists "accent" text null;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_occasion" drop column if exists "accent";`)
  }
}
