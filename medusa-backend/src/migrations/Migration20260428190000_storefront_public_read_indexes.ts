import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Public storefront read-path indexes.
 *
 * These support the current catalog builders:
 * - product list queries filter published/non-deleted products and order by created_at.
 * - feelings/category tree loaders fetch children by parent_category_id and rank.
 * - category lookup by handle is used to find the `feelings` root.
 *
 * Idempotent and intentionally narrow; cart/checkout indexes live in
 * Migration20260414000001_performance_indexes.
 */
export class Migration20260428190000_storefront_public_read_indexes extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_storefront_status_created_at"
      ON "product" ("status", "created_at")
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_category_parent_rank_active"
      ON "product_category" ("parent_category_id", "rank")
      WHERE "deleted_at" IS NULL;
    `)

    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_category_handle_active"
      ON "product_category" ("handle")
      WHERE "deleted_at" IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_category_handle_active";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_category_parent_rank_active";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_storefront_status_created_at";`)
  }
}
