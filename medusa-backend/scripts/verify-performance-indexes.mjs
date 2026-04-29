import pg from "pg";

const { Client } = pg;

const requiredIndexes = [
  "IDX_cart_customer_id",
  "IDX_line_item_cart_id",
  "IDX_line_item_variant_id",
  "IDX_product_handle",
  "IDX_product_variant_product_id",
  "IDX_product_storefront_search_trgm",
  "IDX_product_storefront_status_created_at",
  "IDX_product_category_parent_rank_active",
  "IDX_product_category_handle_active",
  "IDX_storefront_homepage_section_active_sort",
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
  const { rows } = await client.query(
    `
      select indexname
      from pg_indexes
      where schemaname = current_schema()
        and indexname = any($1)
    `,
    [requiredIndexes],
  );
  const present = new Set(rows.map((row) => row.indexname));
  const missing = requiredIndexes.filter((name) => !present.has(name));

  const extension = await client.query(
    "select exists(select 1 from pg_extension where extname = 'pg_trgm') as enabled",
  );
  const trgmEnabled = Boolean(extension.rows[0]?.enabled);

  console.table(
    requiredIndexes.map((name) => ({
      index: name,
      present: present.has(name),
    })),
  );
  console.info(`pg_trgm enabled: ${trgmEnabled ? "yes" : "no"}`);

  if (missing.length > 0 || !trgmEnabled) {
    console.error(
      [
        missing.length > 0 ? `Missing indexes: ${missing.join(", ")}` : null,
        !trgmEnabled ? "Missing extension: pg_trgm" : null,
        "Run npm run migrate from medusa-backend against this database.",
      ]
        .filter(Boolean)
        .join("\n"),
    );
    process.exit(1);
  }

  console.info("Performance index verification passed.");
} finally {
  await client.end();
}
