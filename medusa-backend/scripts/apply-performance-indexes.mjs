import pg from "pg";

const { Client } = pg;

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  `CREATE INDEX IF NOT EXISTS "IDX_cart_customer_id" ON "cart" ("customer_id") WHERE "customer_id" IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS "IDX_cart_created_at" ON "cart" ("created_at");`,
  `CREATE INDEX IF NOT EXISTS "IDX_cart_completed_at" ON "cart" ("completed_at") WHERE "completed_at" IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS "IDX_line_item_cart_id" ON "cart_line_item" ("cart_id");`,
  `CREATE INDEX IF NOT EXISTS "IDX_line_item_variant_id" ON "cart_line_item" ("variant_id") WHERE "variant_id" IS NOT NULL;`,
  `CREATE INDEX IF NOT EXISTS "IDX_product_handle" ON "product" ("handle");`,
  `CREATE INDEX IF NOT EXISTS "IDX_product_created_at" ON "product" ("created_at");`,
  `CREATE INDEX IF NOT EXISTS "IDX_product_variant_product_id" ON "product_variant" ("product_id");`,
  `CREATE INDEX IF NOT EXISTS "IDX_product_variant_sku" ON "product_variant" ("sku") WHERE "sku" IS NOT NULL;`,
  `
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
  `,
  `
    CREATE INDEX IF NOT EXISTS "IDX_product_storefront_status_created_at"
    ON "product" ("status", "created_at")
    WHERE "deleted_at" IS NULL;
  `,
  `
    CREATE INDEX IF NOT EXISTS "IDX_product_category_parent_rank_active"
    ON "product_category" ("parent_category_id", "rank")
    WHERE "deleted_at" IS NULL;
  `,
  `
    CREATE INDEX IF NOT EXISTS "IDX_product_category_handle_active"
    ON "product_category" ("handle")
    WHERE "deleted_at" IS NULL;
  `,
  `
    CREATE INDEX IF NOT EXISTS "IDX_storefront_homepage_section_active_sort"
    ON "storefront_homepage_section" ("active", "sort_order")
    WHERE deleted_at IS NULL;
  `,
];

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(2);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL.includes("sslmode=require") ||
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
});

await client.connect();

try {
  for (const statement of statements) {
    await client.query(statement);
  }
  console.info(`Applied/verified ${statements.length} performance index statements.`);
} finally {
  await client.end();
}
