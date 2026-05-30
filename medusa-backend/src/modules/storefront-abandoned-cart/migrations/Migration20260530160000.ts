import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260530160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      ALTER TABLE "storefront_abandoned_cart"
      ADD COLUMN IF NOT EXISTS "normalized_cart_key" text NULL,
      ADD COLUMN IF NOT EXISTS "consent_given" boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "last_captured_at" timestamptz NULL,
      ADD COLUMN IF NOT EXISTS "reminder_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "suppressed_at" timestamptz NULL;
    `)
    this.addSql(`
      UPDATE "storefront_abandoned_cart"
      SET "normalized_cart_key" = lower(trim("email")) || '::' || COALESCE(trim("cart_id"), '__none__')
      WHERE "normalized_cart_key" IS NULL;
    `)
    this.addSql(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_abandoned_cart_normalized_key"
      ON "storefront_abandoned_cart" ("normalized_cart_key")
      WHERE deleted_at IS NULL AND normalized_cart_key IS NOT NULL;
    `)
    this.addSql(`DROP INDEX IF EXISTS "IDX_storefront_abandoned_cart_email_cart";`)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_storefront_abandoned_cart_normalized_key";`)
    this.addSql(`
      ALTER TABLE "storefront_abandoned_cart"
      DROP COLUMN IF EXISTS "normalized_cart_key",
      DROP COLUMN IF EXISTS "consent_given",
      DROP COLUMN IF EXISTS "last_captured_at",
      DROP COLUMN IF EXISTS "reminder_count",
      DROP COLUMN IF EXISTS "suppressed_at";
    `)
  }
}
