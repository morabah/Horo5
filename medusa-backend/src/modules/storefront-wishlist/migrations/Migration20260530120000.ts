import { Migration } from "@mikro-orm/migrations"

export class Migration20260530120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "storefront_wishlist" (
        "id" text NOT NULL,
        "client_id" text NOT NULL,
        "product_slug" text NOT NULL,
        "product_id" text NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "storefront_wishlist_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_wishlist_client_slug"
      ON "storefront_wishlist" ("client_id", "product_slug")
      WHERE "deleted_at" IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_storefront_wishlist_client"
      ON "storefront_wishlist" ("client_id")
      WHERE "deleted_at" IS NULL;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "storefront_wishlist" CASCADE;`)
  }
}
