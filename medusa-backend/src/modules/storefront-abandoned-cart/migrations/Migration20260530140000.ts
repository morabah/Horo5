import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260530140000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "storefront_abandoned_cart" (
        "id" text NOT NULL,
        "email" text NOT NULL,
        "cart_id" text NULL,
        "surface" text NOT NULL,
        "locale" text NOT NULL DEFAULT 'en',
        "cart_value_egp" numeric NULL,
        "reminder_sent_at" timestamptz NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "storefront_abandoned_cart_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_abandoned_cart_email_cart"
      ON "storefront_abandoned_cart" ("email", "cart_id")
      WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_storefront_abandoned_cart_pending"
      ON "storefront_abandoned_cart" ("reminder_sent_at", "created_at")
      WHERE deleted_at IS NULL AND reminder_sent_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "storefront_abandoned_cart" CASCADE;`)
  }
}
