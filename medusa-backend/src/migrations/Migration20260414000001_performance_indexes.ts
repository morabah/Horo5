import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds performance indexes to core Medusa tables for faster cart/checkout operations.
 * These indexes improve lookup speed for:
 * - Cart by customer_id (customer cart retrieval)
 * - Line items by cart_id (cart item listing)
 * - Products by id (already indexed via PK, but ensures consistency)
 *
 * Uses IF NOT EXISTS to be idempotent - safe to run multiple times.
 */
export class Migration20260414000001_performance_indexes extends Migration {
  override async up(): Promise<void> {
    // Cart indexes - improve customer cart lookups and general cart retrieval
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_customer_id" ON "cart" ("customer_id") WHERE "customer_id" IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_created_at" ON "cart" ("created_at");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cart_completed_at" ON "cart" ("completed_at") WHERE "completed_at" IS NOT NULL;`)

    // Line item indexes - improve cart item queries
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_line_item_cart_id" ON "cart_line_item" ("cart_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_line_item_variant_id" ON "cart_line_item" ("variant_id") WHERE "variant_id" IS NOT NULL;`)

    // Product indexes - improve product lookups (handle is commonly queried)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_handle" ON "product" ("handle");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_created_at" ON "product" ("created_at");`)

    // Product variant indexes - improve variant lookups during cart operations
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_id" ON "product_variant" ("product_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_variant_sku" ON "product_variant" ("sku") WHERE "sku" IS NOT NULL;`)
  }

  override async down(): Promise<void> {
    // Drop indexes in reverse order
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_sku";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_variant_product_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_created_at";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_handle";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_line_item_variant_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_line_item_cart_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_completed_at";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_created_at";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_cart_customer_id";`)
  }
}
