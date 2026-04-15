import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Enables trigram search helpers and a GIN index on a normalized storefront search document
 * (`title` + `description` + `handle`) so `ILIKE '%query%'` can use index scans at scale.
 *
 * Requires `pg_trgm` (available on Postgres/Railway; some restricted hosts may need a superuser to create extensions).
 */
export class Migration20260415120000_storefront_search_trgm extends Migration {
  override async up(): Promise<void> {
    this.addSql(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_product_storefront_search_trgm"
      ON "product" USING gin (
        (
          lower(
            coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(handle, '') || ' ' ||
            coalesce(metadata->>'story', '')
          )
        ) gin_trgm_ops
      )
      WHERE deleted_at IS NULL;
    `)
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_product_storefront_search_trgm";`)
    // Do not drop pg_trgm — other objects may depend on it.
  }
}
