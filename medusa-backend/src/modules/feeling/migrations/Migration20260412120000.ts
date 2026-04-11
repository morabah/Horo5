import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260412120000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "storefront_feeling" add column if not exists "tagline" text null;`
    )
    this.addSql(
      `alter table if exists "storefront_feeling" add column if not exists "manifesto" text null;`
    )
    this.addSql(`drop table if exists "storefront_feeling_line" cascade;`)
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_feeling" drop column if exists "tagline";`)
    this.addSql(`alter table if exists "storefront_feeling" drop column if exists "manifesto";`)
  }
}
